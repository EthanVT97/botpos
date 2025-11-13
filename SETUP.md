# Myanmar POS System - Setup Guide

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account
- Bot tokens (optional, for bot integrations)

## Step 1: Clone and Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

## Step 2: Database Setup

1. Create a new project on [Supabase](https://supabase.com)
2. Go to SQL Editor in your Supabase dashboard
3. Copy and paste the entire content from `supabase/schema.sql`
4. Run the SQL script to create all tables and functions

## Step 3: Environment Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Update `.env` with your credentials:

```env
# Supabase Configuration (Required)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_role_key_here

# Server Configuration
PORT=3001
NODE_ENV=development

# Bot Configuration (Optional - only if using bots)
VIBER_BOT_TOKEN=your_viber_token
VIBER_BOT_NAME=Myanmar POS Bot
VIBER_WEBHOOK_URL=https://your-domain.com/webhooks/viber

TELEGRAM_BOT_TOKEN=your_telegram_token
TELEGRAM_WEBHOOK_URL=https://your-domain.com/webhooks/telegram

MESSENGER_PAGE_ACCESS_TOKEN=your_messenger_token
MESSENGER_VERIFY_TOKEN=your_custom_verify_token
MESSENGER_APP_SECRET=your_app_secret
MESSENGER_WEBHOOK_URL=https://your-domain.com/webhooks/messenger
```

### Getting Supabase Credentials:
- Go to Project Settings > API
- Copy the Project URL (SUPABASE_URL)
- Copy the anon/public key (SUPABASE_ANON_KEY)
- Copy the service_role key (SUPABASE_SERVICE_KEY)

## Step 4: Running the Application

### Development Mode

Terminal 1 - Backend:
```bash
npm run dev
```

Terminal 2 - Frontend:
```bash
cd client
npm start
```

The backend will run on `http://localhost:3001`
The frontend will run on `http://localhost:3000`

### Production Mode

```bash
# Build frontend
cd client
npm run build
cd ..

# Start backend
npm start
```

## Step 5: Bot Setup (Optional)

### Viber Bot

1. Register your bot at [Viber Admin Panel](https://partners.viber.com/)
2. Get your bot token
3. Set webhook URL:
```bash
curl -X POST https://chatapi.viber.com/pa/set_webhook \
  -H "X-Viber-Auth-Token: YOUR_TOKEN" \
  -d '{"url":"https://your-domain.com/webhooks/viber"}'
```

### Telegram Bot

1. Talk to [@BotFather](https://t.me/botfather) on Telegram
2. Create a new bot with `/newbot`
3. Copy the bot token
4. Set webhook:
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook?url=https://your-domain.com/webhooks/telegram"
```

### Facebook Messenger Bot

1. Create a Facebook App at [Facebook Developers](https://developers.facebook.com/)
2. Add Messenger product
3. Create a Facebook Page
4. Generate Page Access Token
5. Set webhook URL in Messenger settings
6. Subscribe to webhook events: messages, messaging_postbacks

## Step 6: Initial Data (Optional)

Add some sample data to get started:

```sql
-- Sample Categories
INSERT INTO categories (name, name_mm) VALUES 
('Electronics', 'အီလက်ထရောနစ်'),
('Food & Beverage', 'အစားအသောက်'),
('Clothing', 'အဝတ်အထည်');

-- Sample Products
INSERT INTO products (name, name_mm, price, cost, stock_quantity, category_id) 
SELECT 
  'Sample Product', 
  'နမူနာကုန်ပစ္စည်း', 
  10000, 
  7000, 
  100, 
  id 
FROM categories LIMIT 1;
```

## Troubleshooting

### Backend won't start
- Check if port 3001 is available
- Verify Supabase credentials in `.env`
- Check Node.js version: `node --version`

### Frontend won't connect to backend
- Ensure backend is running on port 3001
- Check proxy setting in `client/package.json`
- Clear browser cache

### Database errors
- Verify SQL schema was executed successfully
- Check Supabase project is active
- Verify service role key has proper permissions

### Bot webhooks not working
- Ensure your server is publicly accessible (use ngrok for testing)
- Verify webhook URLs are set correctly
- Check bot tokens are valid
- Review server logs for errors

## Testing

### Test Backend API
```bash
# Health check
curl http://localhost:3001/health

# Get products
curl http://localhost:3001/api/products
```

### Test Frontend
Open `http://localhost:3000` in your browser

## Deployment

### Backend Deployment (Heroku example)
```bash
heroku create myanmar-pos-api
heroku config:set SUPABASE_URL=your_url
heroku config:set SUPABASE_ANON_KEY=your_key
heroku config:set SUPABASE_SERVICE_KEY=your_key
git push heroku main
```

### Frontend Deployment (Vercel example)
```bash
cd client
vercel --prod
```

## Support

For issues or questions:
- Check the README.md for API documentation
- Review Supabase logs for database errors
- Check browser console for frontend errors
- Review server logs for backend errors

## Next Steps

1. Customize the UI colors and branding
2. Add more product categories
3. Configure payment methods
4. Set up bot integrations
5. Add user authentication
6. Configure backup strategies
