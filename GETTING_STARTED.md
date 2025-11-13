# Getting Started with Myanmar POS System

Welcome! This guide will help you get the Myanmar POS System up and running in minutes.

## 🎯 What You'll Need

- **Node.js** 16 or higher ([Download](https://nodejs.org/))
- **Supabase Account** (Free tier works great - [Sign up](https://supabase.com))
- **Text Editor** (VS Code recommended)
- **Terminal/Command Line** access

## 🚀 Quick Start (5 Minutes)

### Step 1: Get the Code
```bash
# Clone or download the repository
cd myanmar-pos-system
```

### Step 2: Automated Setup
```bash
# Run the setup script
bash scripts/setup.sh
```

This will:
- Check Node.js installation
- Install all dependencies (backend + frontend)
- Create .env file from template

### Step 3: Configure Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be ready (2-3 minutes)
3. Go to **Project Settings** → **API**
4. Copy these values to your `.env` file:
   - Project URL → `SUPABASE_URL`
   - anon/public key → `SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_KEY`

### Step 4: Setup Database

1. In Supabase, go to **SQL Editor**
2. Click **New Query**
3. Copy the entire content from `supabase/schema.sql`
4. Paste and click **Run**
5. You should see "Success. No rows returned"

### Step 5: Add Sample Data (Optional)
```bash
npm run seed
```

This adds:
- 5 categories
- 10 sample products
- 3 sample customers
- Default settings

### Step 6: Start the Application
```bash
# Option 1: Automated (starts both servers)
bash scripts/dev.sh

# Option 2: Manual (use two terminals)
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend
cd client && npm start
```

### Step 7: Open Your Browser

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## 🎉 You're Ready!

The system is now running. Here's what you can do:

### Explore the Dashboard
- View sales summary
- Check top products
- Monitor low stock items

### Try the POS
1. Click **POS** in the sidebar
2. Click on products to add to cart
3. Select payment method
4. Click **Complete Order**

### Manage Products
1. Click **Products**
2. Click **Add Product**
3. Fill in the details
4. Save

### View Reports
1. Click **Reports**
2. Select date range
3. View sales analytics

## 🤖 Optional: Setup Bots

**New!** You can now set up bots directly from the Settings page with automatic webhook configuration!

### Easy Setup (Recommended)

1. Deploy your application to a public domain with HTTPS
2. Open your POS application and go to **Settings**
3. In the **Bot Configuration** section, click the setup button for your desired bot
4. Follow the on-screen instructions to:
   - Enter your bot token
   - Enter your public domain
   - Test the token
   - Automatically configure the webhook

See [BOT_SETUP_GUIDE.md](BOT_SETUP_GUIDE.md) for detailed instructions.

### Manual Setup (Advanced)

If you prefer manual configuration or need to use environment variables:

#### Viber Bot

1. Register at [Viber Partners](https://partners.viber.com/)
2. Create a bot and get the token
3. Add to `.env`:
   ```
   VIBER_BOT_TOKEN=your_token_here
   ```
4. Set webhook (after deploying to production):
   ```bash
   curl -X POST https://chatapi.viber.com/pa/set_webhook \
     -H "X-Viber-Auth-Token: YOUR_TOKEN" \
     -d '{"url":"https://your-domain.com/webhooks/viber"}'
   ```

#### Telegram Bot

1. Talk to [@BotFather](https://t.me/botfather) on Telegram
2. Send `/newbot` and follow instructions
3. Copy the token
4. Add to `.env`:
   ```
   TELEGRAM_BOT_TOKEN=your_token_here
   ```
5. Set webhook (after deploying):
   ```bash
   curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://your-domain.com/webhooks/telegram"
   ```

#### Facebook Messenger Bot

1. Create app at [Facebook Developers](https://developers.facebook.com/)
2. Add Messenger product
3. Create/select a Facebook Page
4. Generate Page Access Token
5. Add to `.env`:
   ```
   MESSENGER_PAGE_ACCESS_TOKEN=your_token
   MESSENGER_VERIFY_TOKEN=your_custom_token
   ```
6. Configure webhook in Facebook settings

## 📖 Next Steps

### Learn More
- Read [SETUP.md](SETUP.md) for detailed configuration
- Check [BOT_SETUP_GUIDE.md](BOT_SETUP_GUIDE.md) for bot configuration
- Check [API_TESTING.md](API_TESTING.md) to test endpoints
- See [QUICK_REFERENCE.md](QUICK_REFERENCE.md) for commands

### Customize
- Edit colors in `client/src/App.css`
- Add your logo in `client/public/`
- Configure settings in the Settings page

### Deploy to Production
- Follow [DEPLOYMENT.md](DEPLOYMENT.md) for:
  - Heroku deployment
  - DigitalOcean VPS
  - AWS deployment
  - Docker deployment

## 🆘 Troubleshooting

### Backend won't start
```bash
# Check if port 3001 is in use
lsof -i :3001

# Kill the process if needed
kill -9 <PID>

# Check .env file exists
ls -la .env

# Verify Supabase credentials
cat .env
```

### Frontend won't start
```bash
# Clear cache and reinstall
cd client
rm -rf node_modules package-lock.json
npm install
npm start
```

### Database connection error
- Verify Supabase project is active
- Check credentials in `.env`
- Ensure schema was run successfully
- Check Supabase project logs

### "Module not found" errors
```bash
# Reinstall dependencies
npm install
cd client && npm install
```

## 💡 Tips

1. **Use the automated scripts**: `scripts/setup.sh` and `scripts/dev.sh` save time
2. **Seed the database**: Sample data helps you understand the system
3. **Check the health endpoint**: http://localhost:3001/health shows if backend is working
4. **Use browser DevTools**: Check console for frontend errors
5. **Read the logs**: Backend logs show detailed error messages

## 📞 Getting Help

- **Documentation**: Check all .md files in the repository
- **Issues**: Open an issue on GitHub
- **API Testing**: Use [API_TESTING.md](API_TESTING.md) examples
- **Quick Reference**: See [QUICK_REFERENCE.md](QUICK_REFERENCE.md)

## ✅ Checklist

Before you start developing:

- [ ] Node.js installed (check: `node --version`)
- [ ] Dependencies installed (ran `npm install`)
- [ ] Supabase project created
- [ ] Database schema executed
- [ ] `.env` file configured
- [ ] Sample data seeded (optional)
- [ ] Backend running on port 3001
- [ ] Frontend running on port 3000
- [ ] Can access http://localhost:3000
- [ ] Health check returns OK

## 🎓 Learning Path

1. **Day 1**: Setup and explore the UI
2. **Day 2**: Create products and categories
3. **Day 3**: Process orders through POS
4. **Day 4**: View reports and analytics
5. **Day 5**: Customize settings and appearance
6. **Week 2**: Setup bot integrations
7. **Week 3**: Deploy to production

## 🌟 What's Next?

Once you're comfortable with the basics:

1. **Customize the UI** - Change colors, add your branding
2. **Add more products** - Build your product catalog
3. **Configure settings** - Set tax rates, store info
4. **Setup bots** - Enable customer interactions
5. **Deploy** - Make it accessible to your team
6. **Contribute** - Help improve the project

---

**Need help?** Check the documentation or open an issue on GitHub.

**Ready to deploy?** See [DEPLOYMENT.md](DEPLOYMENT.md) for production setup.

**Want to contribute?** Read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.
