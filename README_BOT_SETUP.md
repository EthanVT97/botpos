# 🤖 Bot Setup Made Easy

## What's This About?

Your Myanmar POS System can now connect to **Telegram**, **Viber**, and **Facebook Messenger** bots - and setting them up is incredibly easy!

## Why Use Bots?

✅ **Reach Customers** - Let customers browse products and check orders via their favorite messaging app  
✅ **24/7 Availability** - Bots respond instantly, anytime  
✅ **Myanmar Language** - Full Unicode support for Myanmar customers  
✅ **Auto Registration** - Customers are automatically added to your system  
✅ **Order Tracking** - Customers can check their order status  

## How Easy Is It?

### Before (Old Way) ❌
```bash
# Edit .env file
nano .env

# Add tokens manually
TELEGRAM_BOT_TOKEN=123456:ABC...

# Run curl commands
curl -X POST https://api.telegram.org/bot...

# Restart server
pm2 restart app

# Hope it works 🤞
```

### Now (New Way) ✅
```
1. Click "Setup Bot" button
2. Paste your token
3. Click "Setup Webhook"
4. Done! ✨
```

**Time saved:** 15 minutes → 2 minutes

## Quick Start

### Step 1: Get a Bot Token

Choose your platform:

**🔵 Telegram** (Easiest - 2 minutes)
1. Open Telegram
2. Search `@BotFather`
3. Send `/newbot`
4. Follow instructions
5. Copy token

**🟣 Viber** (Easy - 5 minutes + approval)
1. Visit https://partners.viber.com
2. Create bot account
3. Wait for approval (~24 hours)
4. Copy token

**🔵 Messenger** (Medium - 10 minutes)
1. Visit https://developers.facebook.com
2. Create app
3. Add Messenger
4. Generate token

### Step 2: Setup in POS

1. **Open your POS app**
   ```
   https://your-domain.com
   ```

2. **Go to Settings**
   - Click "Settings" in sidebar
   - Find "Bot Configuration" section

3. **Click Setup Button**
   - Choose your platform (Telegram/Viber/Messenger)
   - A modal will open

4. **Enter Details**
   - **Webhook Domain:** `https://your-domain.com`
   - **Bot Token:** Paste your token
   - Click "Test Token" (optional but recommended)

5. **Setup Webhook**
   - Click "Setup Webhook" button
   - Wait for success message
   - Status should show "Connected" 🟢

6. **Test Your Bot**
   - Open the messaging app
   - Search for your bot
   - Send a message
   - You should get a response!

## What Can Customers Do?

### Telegram & Viber Commands

```
/products - View available products
/orders - Check order history
/help - Get help
```

### Messenger

```
Type "products" - View products
Type "orders" - Check orders
```

## Screenshots

### Settings Page
```
┌─────────────────────────────────────┐
│  Bot Configuration                  │
├─────────────────────────────────────┤
│  Telegram Bot    [🟢 Connected]     │
│  [Manage]                           │
├─────────────────────────────────────┤
│  Viber Bot       [🔴 Not Connected] │
│  [Setup]                            │
├─────────────────────────────────────┤
│  Messenger Bot   [🔴 Not Connected] │
│  [Setup]                            │
└─────────────────────────────────────┘
```

### Setup Modal
```
┌─────────────────────────────────────┐
│  Telegram Bot Configuration    [×]  │
├─────────────────────────────────────┤
│  Webhook Domain                     │
│  [https://your-domain.com        ]  │
│                                     │
│  Bot Token                          │
│  [••••••••••••••••••••••••••••••]  │
│                                     │
│  [Test Token]                       │
│                                     │
│  ✓ Token is valid! Bot: MyStoreBot  │
│                                     │
│  [Setup Webhook]                    │
└─────────────────────────────────────┘
```

## Real Customer Interaction

### Customer's View (Telegram)
```
Customer: /products
Bot: 📦 ကုန်ပစ္စည်းများ:

• စမတ်ဖုန်း
  💰 500,000 ကျပ်
  📊 Stock: 50

• လက်တော့ပ်
  💰 1,200,000 ကျပ်
  📊 Stock: 20

• နားကြပ်
  💰 50,000 ကျပ်
  📊 Stock: 100
```

### Your View (POS Dashboard)
```
New customer registered via Telegram!
Name: Aung Aung
Telegram ID: 123456789
```

## Benefits

### For Business Owners
- ✅ No technical knowledge needed
- ✅ Setup in minutes, not hours
- ✅ Reach customers on their preferred platform
- ✅ Automatic customer registration
- ✅ 24/7 customer service

### For Developers
- ✅ No manual webhook configuration
- ✅ No server restarts needed
- ✅ Easy token management
- ✅ Built-in token validation
- ✅ Real-time status monitoring

### For Customers
- ✅ Browse products anytime
- ✅ Check orders instantly
- ✅ Myanmar language support
- ✅ Use familiar messaging apps
- ✅ No app installation needed

## Troubleshooting

### Bot shows "Not Connected"
**Solution:** Click "Setup" and configure the webhook

### "Invalid token" error
**Solution:** 
- Copy the complete token
- No extra spaces
- Use "Test Token" to verify

### Bot not responding
**Solution:**
- Check status is "Connected"
- Click "Refresh Status"
- Try removing and re-adding

### Webhook setup fails
**Solution:**
- Ensure domain has HTTPS (not HTTP)
- Verify domain is publicly accessible
- Check server is running

## Security

✅ **Tokens are encrypted** in database  
✅ **Masked in UI** (only show last 4 chars)  
✅ **HTTPS required** for webhooks  
✅ **No tokens in logs** or error messages  

## Cost

**Free!** All bot platforms offer free tiers:
- Telegram: Free unlimited
- Viber: Free for most use cases
- Messenger: Free for standard messaging

## Support

Need help?
- 📖 [Detailed Guide](BOT_SETUP_GUIDE.md)
- 🚀 [Quick Start](BOT_SETUP_QUICKSTART.md)
- 🔧 [Troubleshooting](BOT_SETUP_GUIDE.md#troubleshooting)
- 💬 Open an issue on GitHub

## Next Steps

1. **Deploy your app** to a public domain
2. **Get bot tokens** from your chosen platforms
3. **Setup bots** using the Settings page
4. **Test** by sending messages
5. **Share** your bot with customers!

---

## Comparison

| Feature | Manual Setup | Auto Setup (New!) |
|---------|--------------|-------------------|
| Time | 15-30 min | 2-5 min |
| Technical Level | Advanced | Beginner |
| Tools Needed | Terminal, curl | Just a browser |
| Server Restart | Required | Not needed |
| Token Testing | Manual | Built-in |
| Status Check | Check logs | Visual badges |
| Updates | Edit files | Click buttons |

---

**Ready to connect with your customers?** 

👉 [Get Started Now](BOT_SETUP_QUICKSTART.md)

---

Made with ❤️ for Myanmar businesses
