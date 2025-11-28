const jwt = require('jsonwebtoken');
const { pool, query, supabase } = require('../config/database');

// Validate JWT secret on startup
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error('❌ FATAL: JWT_SECRET must be set and at least 32 characters');
  console.error('Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  process.exit(1);
}

const JWT_EXPIRES_IN = '24h';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

/**
 * Generate JWT access token
 */
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

/**
 * Generate JWT refresh token
 */
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  );
};

/**
 * Verify JWT token
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    // Get user from database
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, full_name, role, is_active')
      .eq('id', decoded.id)
      .single();

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        error: 'User account is inactive'
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

/**
 * Authorization middleware
 * Checks if user has required permission
 */
const authorize = (resource, action) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      // Get user's role permissions
      const { data: role, error } = await supabase
        .from('roles')
        .select('permissions')
        .eq('name', req.user.role)
        .single();

      if (error || !role) {
        return res.status(403).json({
          success: false,
          error: 'Role not found'
        });
      }

      const permissions = role.permissions;

      // Admin has all permissions
      if (permissions.all === true) {
        return next();
      }

      // Check specific permission
      if (resource && action) {
        const resourcePermissions = permissions[resource];
        
        if (!resourcePermissions) {
          return res.status(403).json({
            success: false,
            error: 'Access denied'
          });
        }

        // If resourcePermissions is boolean
        if (typeof resourcePermissions === 'boolean') {
          if (resourcePermissions) {
            return next();
          }
        }
        
        // If resourcePermissions is object with actions
        if (typeof resourcePermissions === 'object' && resourcePermissions[action]) {
          return next();
        }

        return res.status(403).json({
          success: false,
          error: `You don't have permission to ${action} ${resource}`
        });
      }

      next();
    } catch (error) {
      console.error('Authorization error:', error);
      res.status(500).json({
        success: false,
        error: 'Authorization failed'
      });
    }
  };
};

/**
 * Optional authentication
 * Attaches user if token is valid, but doesn't fail if not
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      
      if (decoded) {
        const { data: user } = await supabase
          .from('users')
          .select('id, email, full_name, role, is_active')
          .eq('id', decoded.id)
          .single();

        if (user && user.is_active) {
          req.user = user;
        }
      }
    }
    
    next();
  } catch (error) {
    // Silent fail for optional auth
    next();
  }
};

/**
 * Audit log middleware
 * Logs user actions for audit trail
 */
const auditLog = (action, resource) => {
  return async (req, res, next) => {
    // Store original send function
    const originalSend = res.send;
    
    // Override send function
    res.send = function(data) {
      // Log action after response
      if (req.user && res.statusCode < 400) {
        const resourceId = req.params.id || req.body?.id || null;
        const details = {
          method: req.method,
          path: req.path,
          body: req.body,
          query: req.query
        };

        supabase.rpc('log_user_action', {
          p_user_id: req.user.id,
          p_action: action,
          p_resource: resource,
          p_resource_id: resourceId,
          p_details: details,
          p_ip_address: req.ip || req.connection.remoteAddress,
          p_user_agent: req.headers['user-agent']
        }).catch(err => {
          console.error('Audit log error:', err);
        });
      }
      
      // Call original send
      originalSend.call(this, data);
    };
    
    next();
  };
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  authenticate,
  authorize,
  optionalAuth,
  auditLog
};
