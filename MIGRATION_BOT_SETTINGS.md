# Migration Guide: Bot Settings to Database

If you're upgrading from a previous version that used environment variables for bot configuration, this guide will help you migrate to the new database-based configuration system.

## What's New?

The bot configuration has been moved from environment variables (`.env` file) to the database, with a user-friendly interface in the Settings page. This allows you to:

- Configure bots without editing files or restarting the server
- Automatically set up webhooks with one click
- Test bot tokens before applying them
- Manage multiple bots from a single interface
- See real-time connection status

## Migration Steps

### Step 1: Update Database Schema

Run this SQL in your Supabase SQL Editor:

```sql
-- Add bot configuration settings if they don't exist
INSERT INTO settings (key, value) VALUES
  ('viber_bot_token', ''),
  ('telegram_bot_token', ''),
  ('messenger_page_access_token', ''),
  ('messenger_verify_token', ''),
  ('webhook_domain', '')
ON CONFLICT (key) DO NOTHING;
```

### Step 2: Update Backend Code

Pull the latest code from the repository:

```bash
git pull origin main
npm install
```

Or manually add the new route:
- Copy `src/routes/bots.js` from the repository
- Update `src/server.js` to include: `app.use('/api/bots', require('./routes/bots'));`

### Step 3: Update Frontend

```bash
cd client
npm install
```

Or manually update:
- Copy the new `client/src/pages/Settings.js`
- Update `client/src/api/api.js` with new bot API functions

### Step 4: Migrate Your Tokens (Optional)

If you have existing bot tokens in your `.env` file, you can migrate them to the database:

#### Option A: Use the Settings UI (Recommended)

1. Start your application
2. Go to Settings page
3. Click setup button for each bot
4. Enter your existing tokens
5. Configure webhooks

#### Option B: Manual Database Insert

Run this SQL in Supabase (replace with your actual tokens):

```sql
-- Update with your actual tokens
UPDATE settings SET value = 'YOUR_TELEGRAM_TOKEN' WHERE key = 'telegram_bot_token';
UPDATE settings SET value = 'YOUR_VIBER_TOKEN' WHERE key = 'viber_bot_token';
UPDATE settings SET value = 'YOUR_MESSENGER_TOKEN' WHERE key = 'messenger_page_access_token';
UPDATE settings SET value = 'YOUR_VERIFY_TOKEN' WHERE key = 'messenger_verify_token';
UPDATE settings SET value = 'https://your-domain.com' WHERE key = 'webhook_domain';
```

### Step 5: Clean Up (Optional)

After migrating, you can remove bot tokens from your `.env` file:

```bash
# You can remove these lines (but keep them as backup initially)
# VIBER_BOT_TOKEN=...
# TELEGRAM_BOT_TOKEN=...
# MESSENGER_PAGE_ACCESS_TOKEN=...
# MESSENGER_VERIFY_TOKEN=...
```

**Note:** The system will prioritize database settings over environment variables.

## Backward Compatibility

The system maintains backward compatibility:

- If database settings are empty, it will fall back to environment variables
- Existing webhooks will continue to work
- No immediate action required - you can migrate at your convenience

## Testing After Migration

1. **Check Bot Status**
   - Go to Settings page
   - Click "Refresh Status"
   - All connected bots should show green badges

2. **Test Bot Responses**
   - Send a message to each bot
   - Verify you receive responses
   - Test commands like `/products` and `/orders`

3. **Verify Webhooks**
   - Check webhook status in Settings
   - Or use API: `GET /api/bots/webhook/status`

## Troubleshooting

### Bots show as "Not Connected"

1. Make sure you've migrated the tokens to the database
2. Click "Setup" button and reconfigure the webhook
3. Check that your domain is publicly accessible

### "Invalid token" error

1. Verify you copied the complete token
2. Check for extra spaces or line breaks
3. Use the "Test Token" button to verify

### Webhooks not working

1. Ensure your domain has HTTPS enabled
2. Verify the webhook URL is correct
3. Check server logs for incoming requests
4. Try removing and re-adding the webhook

## Rollback

If you need to rollback to environment variables:

1. Keep your `.env` file with bot tokens
2. Clear database settings:
   ```sql
   UPDATE settings SET value = '' WHERE key IN (
     'telegram_bot_token',
     'viber_bot_token',
     'messenger_page_access_token',
     'messenger_verify_token'
   );
   ```
3. Restart your server

The system will automatically use environment variables when database settings are empty.

## Benefits of New System

✅ **No Server Restart** - Change tokens without restarting  
✅ **Easy Management** - Configure from web interface  
✅ **Auto Webhooks** - One-click webhook setup  
✅ **Token Testing** - Verify tokens before applying  
✅ **Status Monitoring** - Real-time connection status  
✅ **Secure** - Tokens stored in database, not in code  

## Need Help?

- Check [BOT_SETUP_GUIDE.md](BOT_SETUP_GUIDE.md) for detailed setup instructions
- Review [GETTING_STARTED.md](GETTING_STARTED.md) for general setup
- Open an issue on GitHub if you encounter problems

---

**Migration completed?** You can now manage all your bots from the Settings page!
