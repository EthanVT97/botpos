# 🔧 Webhook Fix Instructions

## Problem
Your Viber webhook is calling the wrong URL:
- **Wrong:** `/viber/webhook/webhooks/viber` (404 error)
- **Correct:** `/webhooks/viber`

This causes a 404 error and prevents bot messages from being received.

---

## Quick Fix (Production - Render.com)

### Option 1: Use the API Endpoint (Recommended)

1. **Get your Render backend URL:**
   ```
   https://myanmar-pos-backend.onrender.com
   ```

2. **Call the fix-webhook endpoint:**
   ```bash
   curl -X POST https://myanmar-pos-backend.onrender.com/api/bots/viber/fix-webhook \
     -H "Content-Type: application/json" \
     -d '{"domain":"https://myanmar-pos-backend.onrender.com"}'
   ```

3. **Check the response:**
   ```json
   {
     "success": true,
     "message": "viber webhook fixed and re-registered successfully",
     "webhook_url": "https://myanmar-pos-backend.onrender.com/webhooks/viber"
   }
   ```

### Option 2: Use the Settings Page

1. **Go to your Settings page:**
   ```
   https://myanmar-pos-frontend.onrender.com/settings
   ```

2. **Click "Remove" on the Viber bot** (if it shows as connected)

3. **Click "Setup" again and enter:**
   - **Webhook Domain:** `https://myanmar-pos-backend.onrender.com`
   - **Bot Token:** Your Viber bot token
   - Click "Setup Webhook"

4. **Verify:** Status should change to "Connected"

---

## What Was Fixed

### Code Changes:
1. **Domain Cleaning:** Automatically removes trailing slashes and duplicate paths
2. **Fix Endpoint:** New `/api/bots/:platform/fix-webhook` endpoint
3. **Better Logging:** Shows webhook URLs in console
4. **Validation:** Prevents incorrect URLs from being registered

### Files Modified:
- `src/routes/bots.js` - Added domain cleaning and fix endpoint
- `fix-webhook.sh` - Script for local testing

---

## Verify the Fix

### 1. Check Webhook Status
```bash
curl https://myanmar-pos-backend.onrender.com/api/bots/webhook/status
```

Expected response:
```json
{
  "success": true,
  "data": {
    "telegram": false,
    "viber": true,
    "messenger": false
  }
}
```

### 2. Check Backend Logs
In Render dashboard, check logs for:
```
✅ viber webhook fixed successfully
```

### 3. Test the Bot
1. Send a message to your Viber bot
2. Check backend logs for:
   ```
   POST /webhooks/viber 200
   ```
3. Check Messages page in your POS system

---

## For Other Platforms

### Fix Telegram Webhook:
```bash
curl -X POST https://myanmar-pos-backend.onrender.com/api/bots/telegram/fix-webhook \
  -H "Content-Type: application/json" \
  -d '{"domain":"https://myanmar-pos-backend.onrender.com"}'
```

### Fix Messenger Webhook:
Messenger requires manual setup in Facebook Developer Console:
1. Go to Facebook Developer Console
2. Select your app → Messenger → Settings
3. Update Callback URL to: `https://myanmar-pos-backend.onrender.com/webhooks/messenger`

---

## Common Issues

### Issue: "Bot token not found"
**Solution:** Setup the bot first in Settings page before trying to fix

### Issue: "Invalid token"
**Solution:** Verify your bot token is correct and active

### Issue: Still getting 404
**Solution:** 
1. Check Render logs to see what URL is being called
2. Make sure you deployed the latest code
3. Restart the Render service

---

## Prevention

To prevent this issue in the future:

1. **Always use the base domain** when setting up webhooks:
   - ✅ Good: `https://myanmar-pos-backend.onrender.com`
   - ❌ Bad: `https://myanmar-pos-backend.onrender.com/webhooks/viber`

2. **The system will automatically append** the correct path:
   - Input: `https://myanmar-pos-backend.onrender.com`
   - Result: `https://myanmar-pos-backend.onrender.com/webhooks/viber`

3. **Use the fix endpoint** if you accidentally set the wrong URL

---

## Testing Locally

If you want to test locally:

1. **Start the backend:**
   ```bash
   npm run dev
   ```

2. **Run the fix script:**
   ```bash
   ./fix-webhook.sh
   ```

3. **Enter your production domain when prompted**

---

## Summary

✅ **What was wrong:** Webhook URL had duplicate paths  
✅ **What was fixed:** Added domain cleaning and fix endpoint  
✅ **How to fix now:** Use the fix-webhook endpoint or re-setup in Settings  
✅ **How to prevent:** Always use base domain only  

---

**Need help?** Check the backend logs in Render dashboard for detailed error messages.
