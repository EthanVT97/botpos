const express = require('express');
const router = express.Router();
const axios = require('axios');
const { pool, query, supabase } = require('../config/database');

// Get bot configurations
router.get('/config', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .in('key', [
        'viber_bot_token',
        'telegram_bot_token',
        'messenger_page_access_token',
        'messenger_verify_token',
        'webhook_domain'
      ]);

    if (error) throw error;

    const config = {};
    data.forEach(item => {
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
    res.status(500).json({ success: false, error: error.message });
  }
});

// Setup Telegram webhook
router.post('/telegram/setup', async (req, res) => {
  try {
    const { token, domain } = req.body;

    if (!token || !domain) {
      return res.status(400).json({ 
        success: false, 
        error: 'Token and domain are required' 
      });
    }

    const webhookUrl = `${domain}/webhooks/telegram`;

    // Set webhook via Telegram API
    const response = await axios.post(
      `https://api.telegram.org/bot${token}/setWebhook`,
      { url: webhookUrl }
    );

    if (response.data.ok) {
      // Save token to database
      await supabase
        .from('settings')
        .upsert({ key: 'telegram_bot_token', value: token });

      await supabase
        .from('settings')
        .upsert({ key: 'webhook_domain', value: domain });

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
    const { token, domain } = req.body;

    if (!token || !domain) {
      return res.status(400).json({ 
        success: false, 
        error: 'Token and domain are required' 
      });
    }

    const webhookUrl = `${domain}/webhooks/viber`;

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
      await supabase
        .from('settings')
        .upsert({ key: 'viber_bot_token', value: token });

      await supabase
        .from('settings')
        .upsert({ key: 'webhook_domain', value: domain });

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
    await supabase
      .from('settings')
      .upsert({ key: 'messenger_page_access_token', value: pageAccessToken });

    await supabase
      .from('settings')
      .upsert({ key: 'messenger_verify_token', value: verifyToken });

    await supabase
      .from('settings')
      .upsert({ key: 'webhook_domain', value: domain });

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
    const { data: settings } = await supabase
      .from('settings')
      .select('*')
      .in('key', ['telegram_bot_token', 'viber_bot_token', 'webhook_domain']);

    const config = {};
    settings.forEach(item => {
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

    const { data: settings } = await supabase
      .from('settings')
      .select('*')
      .eq('key', `${platform}_bot_token`)
      .single();

    if (!settings) {
      return res.status(404).json({ 
        success: false, 
        error: 'Bot token not found' 
      });
    }

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

    res.json({ 
      success: true, 
      message: `${platform} webhook deleted successfully` 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;
