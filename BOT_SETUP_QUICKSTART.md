# Bot Setup - Quick Start Guide

## 🚀 5-Minute Setup

### Prerequisites
✅ Your app is deployed to a public domain with HTTPS  
✅ You have a bot token from Telegram/Viber/Messenger

### Setup Steps

#### 1️⃣ Open Settings
```
Navigate to: Your App → Settings (sidebar)
```

#### 2️⃣ Find Bot Configuration
```
Look for: "Bot Configuration / Bot ဆက်တင်" section
```

#### 3️⃣ Click Setup Button
```
Click: "Setup Telegram Bot" (or Viber/Messenger)
```

#### 4️⃣ Enter Your Details

**Webhook Domain:**
```
https://your-domain.com
```
Example: `https://mystore.herokuapp.com`

**Bot Token:**
```
Paste your token here
```
- Telegram: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`
- Viber: Long alphanumeric string
- Messenger: Page access token

#### 5️⃣ Test Token (Optional but Recommended)
```
Click: "Test Token" button
Wait for: ✓ Token is valid! Bot: YourBotName
```

#### 6️⃣ Setup Webhook
```
Click: "Setup Webhook" button
Wait for: ✓ Webhook configured successfully
```

#### 7️⃣ Done! 🎉
```
Status should show: 🟢 Connected
```

### Test Your Bot

**Telegram:**
1. Open Telegram
2. Search for your bot username
3. Send: `/start`
4. You should receive a welcome message

**Viber:**
1. Open Viber
2. Search for your bot name
3. Send any message
4. You should receive a response

**Messenger:**
1. Go to your Facebook Page
2. Send a message
3. You should receive a response

---

## 📱 Getting Bot Tokens

### Telegram Token

1. Open Telegram
2. Search: `@BotFather`
3. Send: `/newbot`
4. Follow instructions
5. Copy the token

**Time:** 2 minutes

### Viber Token

1. Visit: https://partners.viber.com
2. Sign in with Viber
3. Create Bot Account
4. Wait for approval (24 hours)
5. Copy the token

**Time:** 5 minutes + approval wait

### Messenger Token

1. Visit: https://developers.facebook.com
2. Create/select app
3. Add Messenger product
4. Select Facebook Page
5. Generate Page Access Token
6. Create custom Verify Token

**Time:** 10 minutes

---

## ⚡ Quick Commands

### Check Status
```
Settings → Bot Configuration → Refresh Status
```

### Update Token
```
Settings → Bot Configuration → Manage → Enter new token → Setup Webhook
```

### Remove Bot
```
Settings → Bot Configuration → Manage → Remove
```

---

## 🆘 Quick Troubleshooting

### ❌ "Invalid token"
- Copy the complete token
- No extra spaces
- Use "Test Token" first

### ❌ "Failed to set webhook"
- Check domain is HTTPS
- Verify domain is accessible
- Make sure server is running

### ❌ Bot not responding
- Check status is "Connected"
- Refresh status
- Try removing and re-adding

### ❌ "Not Connected" status
- Click "Setup" to configure
- Verify webhook domain is correct
- Check server logs

---

## 💡 Pro Tips

✅ **Always test tokens** before setup  
✅ **Use HTTPS** - HTTP won't work  
✅ **Public domain** - localhost won't work  
✅ **Refresh status** after changes  
✅ **Check logs** if issues persist  

---

## 📚 Need More Help?

- **Detailed Guide:** [BOT_SETUP_GUIDE.md](BOT_SETUP_GUIDE.md)
- **Troubleshooting:** [BOT_SETUP_GUIDE.md#troubleshooting](BOT_SETUP_GUIDE.md#troubleshooting)
- **Migration:** [MIGRATION_BOT_SETTINGS.md](MIGRATION_BOT_SETTINGS.md)
- **Features:** [FEATURES.md](FEATURES.md)

---

## 🎯 Common Scenarios

### Scenario 1: First Time Setup
```
1. Deploy app to Heroku/DigitalOcean
2. Get bot token from platform
3. Open Settings → Setup Bot
4. Enter domain and token
5. Click Setup Webhook
6. Test bot
```

### Scenario 2: Changing Token
```
1. Open Settings → Manage Bot
2. Enter new token
3. Test Token
4. Setup Webhook
5. Done
```

### Scenario 3: Moving to New Domain
```
1. Open Settings → Manage Bot
2. Update webhook domain
3. Setup Webhook
4. Verify status
```

### Scenario 4: Bot Not Working
```
1. Check status (should be green)
2. If red, click Setup
3. Re-enter token and domain
4. Setup Webhook
5. Test bot
```

---

**That's it!** You're ready to use bots with your POS system. 🚀

For detailed instructions, see [BOT_SETUP_GUIDE.md](BOT_SETUP_GUIDE.md)
