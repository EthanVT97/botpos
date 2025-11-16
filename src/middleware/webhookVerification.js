const crypto = require('crypto');

/**
 * Verify Telegram webhook signature
 */
function verifyTelegramWebhook(req, res, next) {
  // Telegram doesn't use signature verification by default
  // But we can verify the token in the URL path if configured
  // For now, we'll rely on the secret token in webhook URL
  next();
}

/**
 * Verify Viber webhook signature
 */
function verifyViberWebhook(req, res, next) {
  const signature = req.headers['x-viber-content-signature'];
  const token = process.env.VIBER_BOT_TOKEN;

  if (!token || token === 'your_viber_bot_token') {
    // If no token configured, skip verification in development
    if (process.env.NODE_ENV === 'production') {
      return res.status(401).json({ error: 'Viber bot not configured' });
    }
    return next();
  }

  if (!signature) {
    console.warn('⚠️  Missing Viber signature');
    return res.status(401).json({ error: 'Missing signature' });
  }

  try {
    const body = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', token)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('❌ Invalid Viber signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    next();
  } catch (error) {
    console.error('Error verifying Viber signature:', error);
    return res.status(500).json({ error: 'Signature verification failed' });
  }
}

/**
 * Verify Messenger webhook signature
 */
function verifyMessengerWebhook(req, res, next) {
  const signature = req.headers['x-hub-signature-256'];
  const appSecret = process.env.MESSENGER_APP_SECRET;

  if (!appSecret || appSecret === 'your_messenger_app_secret') {
    // If no secret configured, skip verification in development
    if (process.env.NODE_ENV === 'production') {
      return res.status(401).json({ error: 'Messenger bot not configured' });
    }
    return next();
  }

  if (!signature) {
    console.warn('⚠️  Missing Messenger signature');
    return res.status(401).json({ error: 'Missing signature' });
  }

  try {
    const body = JSON.stringify(req.body);
    const expectedSignature = 'sha256=' + crypto
      .createHmac('sha256', appSecret)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('❌ Invalid Messenger signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    next();
  } catch (error) {
    console.error('Error verifying Messenger signature:', error);
    return res.status(500).json({ error: 'Signature verification failed' });
  }
}

/**
 * Verify webhook request origin (IP whitelist for additional security)
 */
function verifyWebhookOrigin(allowedIPs = []) {
  return (req, res, next) => {
    if (allowedIPs.length === 0 || process.env.NODE_ENV !== 'production') {
      return next();
    }

    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (!allowedIPs.includes(clientIP)) {
      console.warn(`⚠️  Webhook request from unauthorized IP: ${clientIP}`);
      return res.status(403).json({ error: 'Forbidden' });
    }

    next();
  };
}

module.exports = {
  verifyTelegramWebhook,
  verifyViberWebhook,
  verifyMessengerWebhook,
  verifyWebhookOrigin
};
