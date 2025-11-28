const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { pool, query, supabase } = require('../config/database');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  authenticate
} = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { authLimiter } = require('../middleware/rateLimiter');

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public (but should be restricted in production)
 */
router.post('/register',
  authLimiter, // Add rate limiting
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('full_name').trim().notEmpty(),
    body('role').optional().isIn(['admin', 'manager', 'cashier', 'viewer'])
  ],
  async (req, res) => {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { email, password, full_name, role = 'cashier' } = req.body;

      // Check if user already exists
      const existingUser = await query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'User with this email already exists'
        });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);

      // Create user
      const result = await query(
        `INSERT INTO users (email, full_name, role, password_hash, is_active)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, email, full_name, role, created_at`,
        [email, full_name, role, password_hash, true]
      );

      const user = result.rows[0];

      // Generate tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      // Save refresh token
      await query(
        'UPDATE users SET refresh_token = $1 WHERE id = $2',
        [refreshToken, user.id]
      );

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            role: user.role
          },
          accessToken,
          refreshToken
        },
        message: 'User registered successfully'
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        error: 'Registration failed'
      });
    }
  }
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login',
  authLimiter, // Add rate limiting
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  async (req, res) => {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { email, password } = req.body;

      // Get user
      const result = await query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      const user = result.rows[0];

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password'
        });
      }

      // Check if user is active
      if (!user.is_active) {
        return res.status(403).json({
          success: false,
          error: 'Your account has been deactivated. Please contact administrator.'
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password'
        });
      }

      // Generate tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      // Update last login and refresh token
      await query(
        'UPDATE users SET last_login = $1, refresh_token = $2 WHERE id = $3',
        [new Date(), refreshToken, user.id]
      );

      // Get role permissions
      const roleResult = await query(
        'SELECT permissions FROM roles WHERE name = $1',
        [user.role]
      );

      const role = roleResult.rows[0];

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            role: user.role,
            permissions: role?.permissions || {}
          },
          accessToken,
          refreshToken
        },
        message: 'Login successful'
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Login failed'
      });
    }
  }
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh',
  [body('refreshToken').notEmpty()],
  async (req, res) => {
    try {
      const { refreshToken } = req.body;

      // Verify refresh token
      const decoded = verifyToken(refreshToken);
      
      if (!decoded) {
        return res.status(401).json({
          success: false,
          error: 'Invalid refresh token'
        });
      }

      // Get user and verify refresh token
      const userResult = await query(
        'SELECT * FROM users WHERE id = $1 AND refresh_token = $2',
        [decoded.id, refreshToken]
      );

      if (!userResult.rows || userResult.rows.length === 0) {
        return res.status(401).json({
          success: false,
          error: 'Invalid refresh token'
        });
      }

      const user = userResult.rows[0];

      if (!user.is_active) {
        return res.status(403).json({
          success: false,
          error: 'Account is inactive'
        });
      }

      // Generate new tokens
      const newAccessToken = generateAccessToken(user);
      const newRefreshToken = generateRefreshToken(user);

      // Update refresh token
      await query(
        'UPDATE users SET refresh_token = $1 WHERE id = $2',
        [newRefreshToken, user.id]
      );

      res.json({
        success: true,
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken
        }
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(500).json({
        success: false,
        error: 'Token refresh failed'
      });
    }
  }
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticate, async (req, res) => {
  try {
    // Clear refresh token
    await query(
      'UPDATE users SET refresh_token = NULL WHERE id = $1',
      [req.user.id]
    );

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    // Get user details
    const userResult = await query(
      'SELECT id, email, full_name, role, is_active, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = userResult.rows[0];

    // Get role permissions
    const roleResult = await query(
      'SELECT permissions FROM roles WHERE name = $1',
      [user.role]
    );

    const role = roleResult.rows[0];

    res.json({
      success: true,
      data: {
        user: {
          ...user,
          permissions: role?.permissions || {}
        }
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user'
    });
  }
});

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put('/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 6 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { currentPassword, newPassword } = req.body;

      // Get user with password
      const userResult = await query(
        'SELECT password_hash FROM users WHERE id = $1',
        [req.user.id]
      );
      
      const user = userResult.rows[0];

      // Verify current password
      const isValid = await bcrypt.compare(currentPassword, user.password_hash);
      
      if (!isValid) {
        return res.status(401).json({
          success: false,
          error: 'Current password is incorrect'
        });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const newPasswordHash = await bcrypt.hash(newPassword, salt);

      // Update password
      await query(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [newPasswordHash, req.user.id]
      );

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to change password'
      });
    }
  }
);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post('/forgot-password',
  [body('email').isEmail().normalizeEmail()],
  async (req, res) => {
    try {
      const { email } = req.body;

      // Check if user exists
      const userResult = await query(
        'SELECT id, email, full_name FROM users WHERE email = $1',
        [email]
      );
      
      const user = userResult.rows[0];

      // Always return success to prevent email enumeration
      if (!user) {
        return res.json({
          success: true,
          message: 'If the email exists, a password reset link has been sent'
        });
      }

      // Generate reset token (valid for 1 hour)
      const resetToken = jwt.sign(
        { id: user.id, email: user.email, type: 'password_reset' },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Send password reset email
      const emailService = require('../services/emailService');
      const emailResult = await emailService.sendPasswordResetEmail(email, resetToken);

      if (!emailResult.success) {
        console.error('Failed to send reset email:', emailResult.error);
        // Still return success to prevent email enumeration
        // But log the error for debugging
      }

      res.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent',
        // Include token in development for testing
        ...(process.env.NODE_ENV === 'development' && { 
          resetToken,
          resetLink: `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`
        })
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process request'
      });
    }
  }
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password',
  [
    body('token').notEmpty(),
    body('newPassword').isLength({ min: 6 })
  ],
  async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      // Verify token
      const decoded = verifyToken(token);
      
      if (!decoded || decoded.type !== 'password_reset') {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired reset token'
        });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(newPassword, salt);

      // Update password
      await query(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [passwordHash, decoded.id]
      );

      res.json({
        success: true,
        message: 'Password reset successfully'
      });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to reset password'
      });
    }
  }
);

module.exports = router;
