const axios = require('axios');
const { query } = require('../config/database');

/**
 * Auto-register webhooks for all configured bots on server startup
 */
async function autoRegisterWebhooks() {
  try {
    console.log('🔗 Checking bot configurations for webhook registration...');

    // Get bot tokens and webhook domain from settings
    const result = await query(`
      SELECT key, value FROM settings
      WHERE key IN (
        'telegram_bot_token',
        'viber_bot_token',
        'messenger_page_access_token',
        'webhook_domain'
      ) AND value != ''
    `);

    const settings = {};
    result.rows.forEach(row => {
      settings[row.key] = row.value;
    });

    const webhookDomain = settings.webhook_domain || process.env.WEBHOOK_DOMAIN;

    if (!webhookDomain) {
      console.log('⚠️  No webhook domain configured. Skipping auto-registration.');
      return;
    }

    console.log(`📍 Webhook domain: ${webhookDomain}`);

    // Register Telegram webhook
    if (settings.telegram_bot_token) {
      await registerTelegramWebhook(settings.telegram_bot_token, webhookDomain);
    }

    // Register Viber webhook
    if (settings.viber_bot_token) {
      await registerViberWebhook(settings.viber_bot_token, webhookDomain);
    }

    // Messenger requires manual setup in Facebook Developer Console
    if (settings.messenger_page_access_token) {
      console.log('ℹ️  Messenger webhook requires manual setup in Facebook Developer Console');
      console.log(`   Webhook URL: ${webhookDomain}/webhooks/messenger`);
    }

    console.log('✅ Webhook auto-registration complete!');
  } catch (error) {
    console.error('❌ Error in auto-webhook registration:', error.message);
    // Don't throw - allow server to start even if webhook registration fails
  }
}

/**
 * Register Telegram webhook
 */
async function registerTelegramWebhook(token, domain) {
  try {
    const webhookUrl = `${domain}/webhooks/telegram`;
    
    // Check current webhook
    const infoResponse = await axios.get(
      `https://api.telegram.org/bot${token}/getWebhookInfo`
    );

    const currentUrl = infoResponse.data.result.url;

    if (currentUrl === webhookUrl) {
      console.log('✅ Telegram webhook already registered:', webhookUrl);
      return;
    }

    // Set new webhook
    const response = await axios.post(
      `https://api.telegram.org/bot${token}/setWebhook`,
      { url: webhookUrl }
    );

    if (response.data.ok) {
      console.log('✅ Telegram webhook registered:', webhookUrl);
    } else {
      console.error('❌ Failed to register Telegram webhook:', response.data.description);
    }
  } catch (error) {
    console.error('❌ Telegram webhook error:', error.response?.data?.description || error.message);
  }
}

/**
 * Register Viber webhook
 */
async function registerViberWebhook(token, domain) {
  try {
    const webhookUrl = `${domain}/webhooks/viber`;

    // Set webhook
    const response = await axios.post(
      'https://chatapi.viber.com/pa/set_webhook',
      {
        url: webhookUrl,
        event_types: [
          'delivered',
          'seen',
          'failed',
          'subscribed',
          'unsubscribed',
          'conversation_started'
        ]
      },
      {
        headers: {
          'X-Viber-Auth-Token': token
        }
      }
    );

    if (response.data.status === 0) {
      console.log('✅ Viber webhook registered:', webhookUrl);
    } else {
      console.error('❌ Failed to register Viber webhook:', response.data.status_message);
    }
  } catch (error) {
    console.error('❌ Viber webhook error:', error.response?.data?.status_message || error.message);
  }
}

/**
 * Get webhook status for all bots
 */
async function getWebhookStatus() {
  try {
    const result = await query(`
      SELECT key, value FROM settings
      WHERE key IN ('telegram_bot_token', 'viber_bot_token')
      AND value != ''
    `);

    const status = {
      telegram: { configured: false, registered: false, url: null },
      viber: { configured: false, registered: false, url: null }
    };

    for (const row of result.rows) {
      if (row.key === 'telegram_bot_token') {
        status.telegram.configured = true;
        try {
          const response = await axios.get(
            `https://api.telegram.org/bot${row.value}/getWebhookInfo`
          );
          status.telegram.registered = !!response.data.result.url;
          status.telegram.url = response.data.result.url;
        } catch (error) {
          // Ignore errors
        }
      } else if (row.key === 'viber_bot_token') {
        status.viber.configured = true;
        try {
          const response = await axios.post(
            'https://chatapi.viber.com/pa/get_account_info',
            {},
            {
              headers: {
                'X-Viber-Auth-Token': row.value
              }
            }
          );
          status.viber.registered = response.data.status === 0;
        } catch (error) {
          // Ignore errors
        }
      }
    }

    return status;
  } catch (error) {
    console.error('Error getting webhook status:', error);
    return null;
  }
}

module.exports = {
  autoRegisterWebhooks,
  getWebhookStatus
};
