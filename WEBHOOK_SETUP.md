# 🔗 Auto Webhook Registration

Automatic webhook registration for Telegram, Viber, and Messenger bots.

---

## 🚀 How It Works

The system automatically registers webhooks when:
1. Server starts in production mode
2. Bot tokens are configured in settings
3. Webhook domain is set

---

## ⚙️ Configuration

### 1. Set Environment Variables

Add to your `.env` or Render environment variables:

```bash
# Your production backend URL
WEBHOOK_DOMAIN=https://your-backend.onrender.com

# Enable auto-registration (optional, defaults to true in production)
AUTO_REGISTER_WEBHOOKS=true
```

### 2. Configure Bot Tokens

**Option A: Via Settings Page**
1. Login to your POS system
2. Go to Settings page
3. Enter bot tokens:
   - Telegram Bot Token
   - Viber Bot Token
   - Messenger Page Access Token
   - Webhook Domain

**Option B: Via Database**
```sql
INSERT INTO settings (key, value) VALUES
  ('telegram_bot_token', 'YOUR_TELEGRAM_TOKEN'),
  ('viber_bot_token', 'YOUR_VIBER_TOKEN'),
  ('webhook_domain', 'https://your-backend.onrender.com')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

---

## 🤖 Supported Bots

### Telegram Bot

**Setup:**
1. Create bot with [@BotFather](https://t.me/botfather)
2. Get bot token
3. Add token to settings
4. Webhook auto-registers on server start

**Webhook URL:** `https://your-domain.com/webhooks/telegram`

**Status Check:**
```bash
curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo
```

---

### Viber Bot

**Setup:**
1. Create bot at [Viber Admin Panel](https://partners.viber.com/)
2. Get bot token
3. Add token to settings
4. Webhook auto-registers on server start

**Webhook URL:** `https://your-domain.com/webhooks/viber`

**Events Subscribed:**
- delivered
- seen
- failed
- subscribed
- unsubscribed
- conversation_started

---

### Messenger Bot

**Setup:**
1. Create Facebook App
2. Add Messenger product
3. Get Page Access Token
4. **Manual webhook setup required** in Facebook Developer Console

**Webhook URL:** `https://your-domain.com/webhooks/messenger`

**Manual Steps:**
1. Go to Facebook Developer Console
2. Select your app → Messenger → Settings
3. In Webhooks section, click "Add Callback URL"
4. Enter Callback URL: `https://your-domain.com/webhooks/messenger`
5. Enter Verify Token (from settings)
6. Subscribe to: `messages`, `messaging_postbacks`

---

## 🔄 Auto-Registration Process

### On Server Startup

```
1. Server starts
2. Wait 3 seconds (for full initialization)
3. Check settings table for bot tokens
4. If tokens exist and webhook_domain is set:
   ├─ Register Telegram webhook
   ├─ Register Viber webhook
   └─ Log Messenger manual setup instructions
5. Log results
```

### Console Output

```bash
🔗 Checking bot configurations for webhook registration...
📍 Webhook domain: https://your-backend.onrender.com
✅ Telegram webhook registered: https://your-backend.onrender.com/webhooks/telegram
✅ Viber webhook registered: https://your-backend.onrender.com/webhooks/viber
ℹ️  Messenger webhook requires manual setup in Facebook Developer Console
   Webhook URL: https://your-backend.onrender.com/webhooks/messenger
✅ Webhook auto-registration complete!
```

---

## 🔧 Manual Registration

### Via API Endpoint

Trigger webhook registration manually:

```bash
curl -X POST https://your-backend.onrender.com/api/webhooks/register
```

Response:
```json
{
  "success": true,
  "message": "Webhook registration triggered"
}
```

### Via Settings Page

1. Go to Settings page
2. Configure bot tokens
3. Click "Setup Webhook" for each bot
4. System will register webhooks

---

## ✅ Verification

### Check Webhook Status

**Via API:**
```bash
curl https://your-backend.onrender.com/api/bots/webhook/status
```

**Via Telegram:**
```bash
curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo
```

**Via Viber:**
```bash
curl -X POST https://chatapi.viber.com/pa/get_account_info \
  -H "X-Viber-Auth-Token: YOUR_TOKEN"
```

---

## 🐛 Troubleshooting

### Webhooks Not Registering

**Check:**
1. `WEBHOOK_DOMAIN` is set correctly
2. Bot tokens are valid
3. Domain is accessible from internet
4. SSL certificate is valid (required for webhooks)

**Test:**
```bash
# Check if domain is accessible
curl https://your-backend.onrender.com/health

# Check server logs
# Look for webhook registration messages
```

### Telegram Webhook Fails

**Common Issues:**
- Invalid bot token
- Domain not accessible
- No SSL certificate
- Port not 443, 80, 88, or 8443

**Fix:**
```bash
# Delete old webhook
curl https://api.telegram.org/bot<TOKEN>/deleteWebhook

# Restart server to re-register
```

### Viber Webhook Fails

**Common Issues:**
- Invalid bot token
- Domain not accessible
- No SSL certificate

**Fix:**
```bash
# Clear webhook
curl -X POST https://chatapi.viber.com/pa/set_webhook \
  -H "X-Viber-Auth-Token: YOUR_TOKEN" \
  -d '{"url":""}'

# Restart server to re-register
```

---

## 🔐 Security

### Best Practices

1. **Use Environment Variables**
   - Never commit tokens to Git
   - Use `.env` files (gitignored)
   - Set tokens in Render dashboard

2. **Webhook Verification**
   - Telegram: Automatic signature verification
   - Viber: X-Viber-Content-Signature header
   - Messenger: X-Hub-Signature header

3. **HTTPS Required**
   - All webhooks require HTTPS
   - Render provides SSL automatically
   - No self-signed certificates

---

## 📊 Monitoring

### Check Logs

**Render Dashboard:**
1. Go to your service
2. Click "Logs" tab
3. Look for webhook registration messages

**Local Development:**
```bash
# Start server with logs
npm run dev

# Look for:
# 🔗 Checking bot configurations...
# ✅ Telegram webhook registered...
```

---

## 🎯 Production Checklist

- [ ] Set `WEBHOOK_DOMAIN` environment variable
- [ ] Configure bot tokens in settings
- [ ] Deploy to Render
- [ ] Check server logs for webhook registration
- [ ] Verify webhooks are registered
- [ ] Test bot by sending message
- [ ] Monitor webhook calls in logs

---

## 📝 Example Configuration

### Render Environment Variables

```bash
DATABASE_URL=postgresql://...
NODE_ENV=production
PORT=3001
CLIENT_URL=https://your-frontend.netlify.app
JWT_SECRET=your-secret-key
WEBHOOK_DOMAIN=https://your-backend.onrender.com
AUTO_REGISTER_WEBHOOKS=true
```

### Settings Table

```sql
SELECT * FROM settings WHERE key LIKE '%bot%' OR key = 'webhook_domain';
```

Result:
```
telegram_bot_token          | 123456:ABC-DEF...
viber_bot_token            | 4567890abcdef...
messenger_page_access_token | EAABsbCS...
webhook_domain             | https://your-backend.onrender.com
```

---

## 🎉 Success!

Once configured, your bots will automatically register webhooks on every server restart. No manual intervention needed!

**Test Your Bots:**
1. Send message to your Telegram bot
2. Send message to your Viber bot
3. Send message to your Messenger bot
4. Check Messages page in POS system
5. Reply to customers!

---

**Need Help?** Check the main README.md or DEPLOYMENT.md for more information.
