# Bot Setup Guide - Auto Webhook Configuration

This guide explains how to set up bot integrations using the built-in auto-configuration feature.

## Overview

The Myanmar POS System now includes an easy-to-use bot configuration interface that automatically sets up webhooks for:
- **Telegram Bot**
- **Viber Bot**
- **Facebook Messenger Bot**

No more manual webhook configuration or command-line tools needed!

## Prerequisites

1. **Public Domain**: Your application must be accessible via a public HTTPS URL
   - Example: `https://your-domain.com` or `https://your-app.herokuapp.com`
   - Local development URLs (localhost) won't work for webhooks

2. **SSL Certificate**: Your domain must have HTTPS enabled
   - Most hosting providers (Heroku, DigitalOcean, AWS) provide this automatically

## Step-by-Step Setup

### 1. Access Settings Page

1. Open your POS application
2. Navigate to **Settings** from the sidebar
3. Look for the **Bot Configuration** section on the right side

### 2. Setup Telegram Bot

#### Get Your Bot Token

1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Send `/newbot` command
3. Follow the instructions:
   - Choose a name for your bot (e.g., "My Store Bot")
   - Choose a username (must end with 'bot', e.g., "mystorebot")
4. Copy the token provided (looks like: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)

#### Configure in POS

1. Click **Setup Telegram Bot** button
2. Enter your **Webhook Domain** (e.g., `https://your-domain.com`)
3. Paste your **Bot Token**
4. Click **Test Token** to verify it's valid
5. Click **Setup Webhook** to complete configuration

✅ Done! Your Telegram bot is now ready to receive messages.

#### Test Your Bot

1. Open Telegram and search for your bot username
2. Send `/start` command
3. You should receive a welcome message in Myanmar language

### 3. Setup Viber Bot

#### Get Your Bot Token

1. Go to [Viber Partners Portal](https://partners.viber.com)
2. Sign in with your Viber account
3. Create a new bot:
   - Click "Create Bot Account"
   - Fill in bot details (name, icon, description)
   - Submit for review (usually approved within 24 hours)
4. Once approved, copy your **Authentication Token**

#### Configure in POS

1. Click **Setup Viber Bot** button
2. Enter your **Webhook Domain** (e.g., `https://your-domain.com`)
3. Paste your **Bot Token**
4. Click **Test Token** to verify it's valid
5. Click **Setup Webhook** to complete configuration

✅ Done! Your Viber bot is now ready to receive messages.

#### Test Your Bot

1. Open Viber and search for your bot name
2. Start a conversation
3. Send any message - you should receive a welcome response

### 4. Setup Facebook Messenger Bot

#### Get Your Tokens

1. Go to [Facebook Developers](https://developers.facebook.com)
2. Create a new app or select existing app
3. Add **Messenger** product to your app
4. In Messenger Settings:
   - Select or create a Facebook Page
   - Generate a **Page Access Token** (copy this)
5. Create a custom **Verify Token** (any random string, e.g., "my_verify_token_123")

#### Configure in POS

1. Click **Setup Messenger Bot** button
2. Enter your **Webhook Domain** (e.g., `https://your-domain.com`)
3. Paste your **Page Access Token**
4. Enter your custom **Verify Token**
5. Click **Test Token** to verify the page token is valid
6. Click **Setup Webhook**

#### Complete Facebook Configuration

After clicking Setup Webhook, you'll see instructions. Follow these steps:

1. Go back to Facebook Developer Console
2. Navigate to Messenger > Settings
3. In the **Webhooks** section, click "Add Callback URL"
4. Enter the **Callback URL** shown in the POS (e.g., `https://your-domain.com/webhooks/messenger`)
5. Enter the **Verify Token** you created earlier
6. Click "Verify and Save"
7. Subscribe to these webhook fields:
   - `messages`
   - `messaging_postbacks`

✅ Done! Your Messenger bot is now ready to receive messages.

#### Test Your Bot

1. Go to your Facebook Page
2. Send a message to the page
3. You should receive an automated response

## Managing Bots

### Check Bot Status

- The Settings page shows real-time connection status for each bot
- Green badge = Connected and working
- Red badge = Not connected or configuration issue
- Click **Refresh Status** to update

### Update Bot Configuration

1. Click the **Manage** button for any connected bot
2. Update the token or domain
3. Click **Setup Webhook** to apply changes

### Remove Bot

1. Click **Manage** button for the bot you want to remove
2. Click **Remove** button
3. Confirm the action
4. The webhook will be deleted from the bot platform

## Troubleshooting

### "Invalid token" error

- Double-check you copied the entire token
- Make sure there are no extra spaces
- For Telegram: Token should contain a colon (`:`)
- For Viber: Token is a long alphanumeric string
- Use the **Test Token** button to verify before setup

### "Failed to set webhook" error

**Common causes:**
1. **Domain not accessible**: Make sure your domain is publicly accessible via HTTPS
2. **No SSL certificate**: Webhooks require HTTPS (not HTTP)
3. **Firewall blocking**: Check if your server firewall allows incoming connections
4. **Wrong domain format**: Use full URL with `https://` (e.g., `https://your-domain.com`)

**Solutions:**
- Test your domain: Open `https://your-domain.com/health` in a browser
- Verify SSL: Your browser should show a lock icon
- Check server logs for errors
- Try removing and re-adding the webhook

### Bot not responding to messages

1. **Check webhook status**: Click "Refresh Status" in Settings
2. **Verify webhook URL**: Make sure it matches your actual domain
3. **Check server logs**: Look for incoming webhook requests
4. **Test the endpoint**: 
   ```bash
   curl -X POST https://your-domain.com/webhooks/telegram
   ```
5. **Restart your server**: Sometimes a restart helps

### Messenger webhook verification fails

1. Make sure the **Verify Token** in POS matches exactly what you enter in Facebook
2. The verify token is case-sensitive
3. Your server must be running when you click "Verify and Save" in Facebook
4. Check that the callback URL is correct (should end with `/webhooks/messenger`)

## Security Best Practices

1. **Keep tokens secret**: Never share your bot tokens publicly
2. **Use environment variables**: For production, store tokens in environment variables
3. **Regular rotation**: Change tokens periodically for security
4. **Monitor usage**: Check bot logs regularly for suspicious activity
5. **HTTPS only**: Never use HTTP for webhooks (bots won't accept it)

## Bot Commands

Once configured, customers can use these commands:

### Telegram & Viber
- `/products` - View available products (ကုန်ပစ္စည်းများကြည့်ရန်)
- `/orders` - View their order history (မှာယူမှုများကြည့်ရန်)
- `/help` - Get help and available commands (အကူအညီ)

### Messenger
- Type "products" - View available products
- Type "orders" - View order history
- Any other message - Get welcome message with instructions

## Advanced Configuration

### Using Environment Variables (Production)

For production deployments, you can still use environment variables:

1. Set these in your hosting platform:
   ```
   TELEGRAM_BOT_TOKEN=your_token
   VIBER_BOT_TOKEN=your_token
   MESSENGER_PAGE_ACCESS_TOKEN=your_token
   MESSENGER_VERIFY_TOKEN=your_token
   ```

2. The system will use environment variables if database settings are empty

### Webhook URLs

The system automatically generates these webhook URLs:
- Telegram: `https://your-domain.com/webhooks/telegram`
- Viber: `https://your-domain.com/webhooks/viber`
- Messenger: `https://your-domain.com/webhooks/messenger`

### API Endpoints

For developers who want to integrate programmatically:

```bash
# Test a token
POST /api/bots/test/:platform
Body: { "token": "your_token" }

# Setup webhook
POST /api/bots/telegram/setup
Body: { "token": "your_token", "domain": "https://your-domain.com" }

# Get webhook status
GET /api/bots/webhook/status

# Delete webhook
DELETE /api/bots/:platform/webhook
```

## Support

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section above
2. Review server logs for error messages
3. Test your domain accessibility
4. Verify SSL certificate is valid
5. Open an issue on GitHub with details

## Resources

- [Telegram Bot API Documentation](https://core.telegram.org/bots/api)
- [Viber Bot API Documentation](https://developers.viber.com/docs/api/rest-bot-api/)
- [Facebook Messenger Platform Documentation](https://developers.facebook.com/docs/messenger-platform)

---

**Need help?** Check the main [README.md](README.md) or open an issue on GitHub.
