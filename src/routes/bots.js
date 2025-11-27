const express = require('express');
const router = express.Router();
const axios = require('axios');
const { pool, query, supabase } = require('../config/database');

// Get bot configurations
router.get('/config', async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM settings
      WHERE key IN (
        'viber_bot_token',
        'telegram_bot_token',
        'messenger_page_access_token',
        'messenger_verify_token',
        'webhook_domain'
      )
    `);

    const config = {};
    result.rows.forEach(item => {
      // Mask tokens for security (show only last 4 chars)
      if (item.value && item.key.includes('token')) {
        config[item.key] = item.value.length > 4 
          ? '****' + item.value.slice(-4) 
          : '****';
      } else {
        config[item.key] = item.value;
      }
    });

    res.json({ success: true, data: config });
  } catch (error) {
    console.error('Error fetching bot config:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Setup Telegram webhook
router.post('/telegram/setup', async (req, res) => {
  try {
    let { token, domain } = req.body;

    if (!token || !domain) {
      return res.status(400).json({ 
        success: false, 
        error: 'Token and domain are required' 
      });
    }

    // Clean domain - remove trailing slashes and any path
    domain = domain.replace(/\/+$/, ''); // Remove trailing slashes
    domain = domain.replace(/\/webhooks.*$/, ''); // Remove any webhook path
    domain = domain.replace(/\/telegram.*$/, ''); // Remove any telegram path

    const webhookUrl = `${domain}/webhooks/telegram`;

    console.log('🔧 Setting up Telegram webhook:', {
      domain,
      webhookUrl,
      timestamp: new Date().toISOString()
    });

    // Set webhook via Telegram API
    const response = await axios.post(
      `https://api.telegram.org/bot${token}/setWebhook`,
      { url: webhookUrl }
    );

    if (response.data.ok) {
      // Save token to database
      await query(`
        INSERT INTO settings (key, value, updated_at)
        VALUES ('telegram_bot_token', $1, NOW())
        ON CONFLICT (key) DO UPDATE
        SET value = $1, updated_at = NOW()
      `, [token]);

      await query(`
        INSERT INTO settings (key, value, updated_at)
        VALUES ('webhook_domain', $1, NOW())
        ON CONFLICT (key) DO UPDATE
        SET value = $1, updated_at = NOW()
      `, [domain]);

      res.json({ 
        success: true, 
        message: 'Telegram webhook configured successfully',
        webhook_url: webhookUrl
      });
    } else {
      res.status(400).json({ 
        success: false, 
        error: response.data.description || 'Failed to set webhook' 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.response?.data?.description || error.message 
    });
  }
});

// Setup Viber webhook
router.post('/viber/setup', async (req, res) => {
  try {
    let { token, domain } = req.body;

    if (!token || !domain) {
      return res.status(400).json({ 
        success: false, 
        error: 'Token and domain are required' 
      });
    }

    // Clean domain - remove trailing slashes and any path
    domain = domain.replace(/\/+$/, ''); // Remove trailing slashes
    domain = domain.replace(/\/webhooks.*$/, ''); // Remove any webhook path
    domain = domain.replace(/\/viber.*$/, ''); // Remove any viber path

    const webhookUrl = `${domain}/webhooks/viber`;

    console.log('🔧 Setting up Viber webhook:', {
      domain,
      webhookUrl,
      timestamp: new Date().toISOString()
    });

    // Set webhook via Viber API
    const response = await axios.post(
      'https://chatapi.viber.com/pa/set_webhook',
      { 
        url: webhookUrl,
        event_types: ['delivered', 'seen', 'failed', 'subscribed', 'unsubscribed', 'conversation_started']
      },
      {
        headers: {
          'X-Viber-Auth-Token': token
        }
      }
    );

    if (response.data.status === 0) {
      // Save token to database
      await query(`
        INSERT INTO settings (key, value, updated_at)
        VALUES ('viber_bot_token', $1, NOW())
        ON CONFLICT (key) DO UPDATE
        SET value = $1, updated_at = NOW()
      `, [token]);

      await query(`
        INSERT INTO settings (key, value, updated_at)
        VALUES ('webhook_domain', $1, NOW())
        ON CONFLICT (key) DO UPDATE
        SET value = $1, updated_at = NOW()
      `, [domain]);

      res.json({ 
        success: true, 
        message: 'Viber webhook configured successfully',
        webhook_url: webhookUrl
      });
    } else {
      res.status(400).json({ 
        success: false, 
        error: response.data.status_message || 'Failed to set webhook' 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.response?.data?.status_message || error.message 
    });
  }
});

// Setup Messenger webhook (manual - requires Facebook App setup)
router.post('/messenger/setup', async (req, res) => {
  try {
    const { pageAccessToken, verifyToken, domain } = req.body;

    if (!pageAccessToken || !verifyToken || !domain) {
      return res.status(400).json({ 
        success: false, 
        error: 'Page access token, verify token, and domain are required' 
      });
    }

    // Save tokens to database
    await query(`
      INSERT INTO settings (key, value, updated_at)
      VALUES ('messenger_page_access_token', $1, NOW())
      ON CONFLICT (key) DO UPDATE
      SET value = $1, updated_at = NOW()
    `, [pageAccessToken]);

    await query(`
      INSERT INTO settings (key, value, updated_at)
      VALUES ('messenger_verify_token', $1, NOW())
      ON CONFLICT (key) DO UPDATE
      SET value = $1, updated_at = NOW()
    `, [verifyToken]);

    await query(`
      INSERT INTO settings (key, value, updated_at)
      VALUES ('webhook_domain', $1, NOW())
      ON CONFLICT (key) DO UPDATE
      SET value = $1, updated_at = NOW()
    `, [domain]);

    const webhookUrl = `${domain}/webhooks/messenger`;

    res.json({ 
      success: true, 
      message: 'Messenger configuration saved. Please configure webhook in Facebook Developer Console.',
      webhook_url: webhookUrl,
      verify_token: verifyToken,
      instructions: [
        '1. Go to Facebook Developer Console',
        '2. Select your app and go to Messenger > Settings',
        '3. In Webhooks section, click "Add Callback URL"',
        `4. Enter Callback URL: ${webhookUrl}`,
        `5. Enter Verify Token: ${verifyToken}`,
        '6. Subscribe to messages, messaging_postbacks events'
      ]
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Test bot connection
router.post('/test/:platform', async (req, res) => {
  try {
    const { platform } = req.params;
    const { token } = req.body;

    let testResult = false;
    let botInfo = null;

    switch (platform) {
      case 'telegram':
        const tgResponse = await axios.get(
          `https://api.telegram.org/bot${token}/getMe`
        );
        testResult = tgResponse.data.ok;
        botInfo = tgResponse.data.result;
        break;

      case 'viber':
        const vbResponse = await axios.post(
          'https://chatapi.viber.com/pa/get_account_info',
          {},
          {
            headers: {
              'X-Viber-Auth-Token': token
            }
          }
        );
        testResult = vbResponse.data.status === 0;
        botInfo = vbResponse.data;
        break;

      case 'messenger':
        const msResponse = await axios.get(
          `https://graph.facebook.com/v18.0/me?access_token=${token}`
        );
        testResult = !!msResponse.data.id;
        botInfo = msResponse.data;
        break;

      default:
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid platform' 
        });
    }

    res.json({ 
      success: testResult, 
      message: testResult ? 'Bot token is valid' : 'Bot token is invalid',
      bot_info: botInfo
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error.response?.data?.description || error.response?.data?.status_message || error.message 
    });
  }
});

// Get webhook status
router.get('/webhook/status', async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM settings
      WHERE key IN ('telegram_bot_token', 'viber_bot_token', 'webhook_domain')
    `);

    const config = {};
    result.rows.forEach(item => {
      config[item.key] = item.value;
    });

    const status = {
      telegram: false,
      viber: false,
      messenger: false
    };

    // Check Telegram webhook
    if (config.telegram_bot_token) {
      try {
        const tgResponse = await axios.get(
          `https://api.telegram.org/bot${config.telegram_bot_token}/getWebhookInfo`
        );
        status.telegram = tgResponse.data.result.url ? true : false;
      } catch (e) {
        status.telegram = false;
      }
    }

    // Check Viber webhook
    if (config.viber_bot_token) {
      try {
        const vbResponse = await axios.post(
          'https://chatapi.viber.com/pa/get_account_info',
          {},
          {
            headers: {
              'X-Viber-Auth-Token': config.viber_bot_token
            }
          }
        );
        status.viber = vbResponse.data.status === 0;
      } catch (e) {
        status.viber = false;
      }
    }

    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete webhook
router.delete('/:platform/webhook', async (req, res) => {
  try {
    const { platform } = req.params;

    const result = await query(
      'SELECT * FROM settings WHERE key = $1',
      [`${platform}_bot_token`]
    );

    const settings = result.rows[0];

    if (!settings) {
      return res.status(404).json({ 
        success: false, 
        error: 'Bot token not found' 
      });
    }

    console.log(`🗑️  Deleting ${platform} webhook...`);

    switch (platform) {
      case 'telegram':
        await axios.post(
          `https://api.telegram.org/bot${settings.value}/deleteWebhook`
        );
        break;

      case 'viber':
        await axios.post(
          'https://chatapi.viber.com/pa/set_webhook',
          { url: '' },
          {
            headers: {
              'X-Viber-Auth-Token': settings.value
            }
          }
        );
        break;

      default:
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid platform' 
        });
    }

    console.log(`✅ ${platform} webhook deleted successfully`);

    res.json({ 
      success: true, 
      message: `${platform} webhook deleted successfully` 
    });
  } catch (error) {
    console.error(`❌ Error deleting ${platform} webhook:`, error.message);
    res.status(500).json({ 
      success: false, 
      error: error.response?.data?.status_message || error.message 
    });
  }
});

// Fix webhook - removes and re-registers with correct URL
router.post('/:platform/fix-webhook', async (req, res) => {
  try {
    const { platform } = req.params;
    const { domain } = req.body;

    if (!domain) {
      return res.status(400).json({ 
        success: false, 
        error: 'Domain is required' 
      });
    }

    // Get token from database
    const result = await query(
      'SELECT * FROM settings WHERE key = $1',
      [`${platform}_bot_token`]
    );

    const settings = result.rows[0];

    if (!settings || !settings.value) {
      return res.status(404).json({ 
        success: false, 
        error: 'Bot token not found. Please setup the bot first.' 
      });
    }

    const token = settings.value;

    // Clean domain
    let cleanDomain = domain.replace(/\/+$/, '');
    cleanDomain = cleanDomain.replace(/\/webhooks.*$/, '');
    cleanDomain = cleanDomain.replace(/\/(viber|telegram|messenger).*$/, '');

    const webhookUrl = `${cleanDomain}/webhooks/${platform}`;

    console.log(`🔧 Fixing ${platform} webhook:`, {
      oldDomain: domain,
      cleanDomain,
      webhookUrl
    });

    // Delete old webhook first
    switch (platform) {
      case 'telegram':
        await axios.post(
          `https://api.telegram.org/bot${token}/deleteWebhook`
        );
        // Set new webhook
        const tgResponse = await axios.post(
          `https://api.telegram.org/bot${token}/setWebhook`,
          { url: webhookUrl }
        );
        if (!tgResponse.data.ok) {
          throw new Error(tgResponse.data.description);
        }
        break;

      case 'viber':
        // Delete old webhook
        await axios.post(
          'https://chatapi.viber.com/pa/set_webhook',
          { url: '' },
          { headers: { 'X-Viber-Auth-Token': token } }
        );
        // Set new webhook
        const vbResponse = await axios.post(
          'https://chatapi.viber.com/pa/set_webhook',
          { 
            url: webhookUrl,
            event_types: ['delivered', 'seen', 'failed', 'subscribed', 'unsubscribed', 'conversation_started']
          },
          { headers: { 'X-Viber-Auth-Token': token } }
        );
        if (vbResponse.data.status !== 0) {
          throw new Error(vbResponse.data.status_message);
        }
        break;

      default:
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid platform. Use: telegram, viber' 
        });
    }

    // Update domain in database
    await query(`
      INSERT INTO settings (key, value, updated_at)
      VALUES ('webhook_domain', $1, NOW())
      ON CONFLICT (key) DO UPDATE
      SET value = $1, updated_at = NOW()
    `, [cleanDomain]);

    console.log(`✅ ${platform} webhook fixed successfully`);

    res.json({ 
      success: true, 
      message: `${platform} webhook fixed and re-registered successfully`,
      webhook_url: webhookUrl
    });
  } catch (error) {
    console.error(`❌ Error fixing ${platform} webhook:`, error.message);
    res.status(500).json({ 
      success: false, 
      error: error.response?.data?.status_message || error.response?.data?.description || error.message 
    });
  }
});

module.exports = router;
