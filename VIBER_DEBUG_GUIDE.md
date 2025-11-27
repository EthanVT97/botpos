# 🐛 Viber Bot Debug Guide

## ✅ Fix Applied

The Viber bot now loads the token **dynamically from the database** instead of relying on environment variables.

---

## 🚀 How to Test

### Step 1: Deploy Latest Code

The code is already pushed to GitHub. Render will auto-deploy.

**Wait for deployment to complete** (check Render dashboard).

---

### Step 2: Verify Webhook is Set

Go to Settings page and check Viber bot status:
```
https://myanmar-pos-frontend.onrender.com/settings
```

Should show: **🟢 Connected**

If not, click "Setup" and enter:
- Domain: `https://myanmar-pos-backend.onrender.com`
- Token: `4f89b4d323a7e5e2-31584a999fd71ef7-bbf6f67804bc6393`

---

### Step 3: Send Test Message

1. **Open your Viber bot** on your phone
2. **Send a message:** "Hello"
3. **Expected response:**
   ```
   မင်္ဂလာပါ! ကျွန်ုပ်တို့၏ POS စနစ်မှ ကြိုဆိုပါတယ်။

   Commands:
   /products - ကုန်ပစ္စည်းများကြည့်ရန်
   /orders - မှာယူမှုများကြည့်ရန်
   /help - အကူအညီ
   ```

---

### Step 4: Check Backend Logs

In Render dashboard → Backend service → Logs, you should see:

```
📱 Viber webhook received: { event: 'message', sender: 'User Name', ... }
✅ Viber bot initialized successfully
💬 Viber message received: { from: 'User Name', text: 'Hello', ... }
👤 Customer: { id: '...', name: 'User Name' }
💾 Message saved to database
✅ Welcome message sent
✅ Viber webhook processed successfully
```

---

### Step 5: Check Messages Page

Go to Messages page:
```
https://myanmar-pos-frontend.onrender.com/messages
```

You should see:
- New chat session with the customer
- The message "Hello" from the customer
- Your bot's response

---

## 🧪 Test Commands

Try these commands in Viber:

### 1. Products List
```
/products
```
**Expected:** List of products from your database

### 2. Orders List
```
/orders
```
**Expected:** List of your orders (or "no orders" if none)

### 3. Help
```
/help
```
**Expected:** Command list

---

## 🐛 Troubleshooting

### Issue: No response from bot

**Check 1: Webhook Status**
```bash
curl https://myanmar-pos-backend.onrender.com/api/bots/webhook/status
```

Should return:
```json
{
  "success": true,
  "data": {
    "viber": true
  }
}
```

**Check 2: Backend Logs**

Look for these in Render logs:
- ✅ `Viber webhook received`
- ✅ `Viber bot initialized successfully`
- ✅ `Viber message received`

If you see:
- ❌ `Viber bot not configured` → Token not in database
- ❌ `Invalid Viber signature` → Token mismatch

**Check 3: Database Token**

The token should be in the database:
```sql
SELECT * FROM settings WHERE key = 'viber_bot_token';
```

Should return: `4f89b4d323a7e5e2-31584a999fd71ef7-bbf6f67804bc6393`

---

### Issue: Messages not appearing in Messages page

**Possible causes:**
1. WebSocket not connected (check Messages page for connection status)
2. Database not saving messages (check backend logs)
3. Customer not created (check backend logs for "Customer:" line)

**Fix:**
1. Refresh Messages page
2. Check browser console for errors
3. Check backend logs for database errors

---

### Issue: Bot responds but messages not in database

**Check backend logs for:**
- `💾 Message saved to database` ✅
- Or database error ❌

**If database error:**
1. Check `chat_messages` table exists
2. Check `chat_sessions` table exists
3. Run: `node scripts/setup-all.js` to create tables

---

## 📊 What Changed

### Before:
```javascript
// Bot used process.env.VIBER_BOT_TOKEN
const viberBot = new ViberBot({
  authToken: process.env.VIBER_BOT_TOKEN
});
```

**Problem:** Token in env var was empty or wrong

### After:
```javascript
// Bot loads token from database dynamically
async function initializeViberBot() {
  const result = await query(
    'SELECT value FROM settings WHERE key = $1',
    ['viber_bot_token']
  );
  const token = result.rows[0].value;
  
  viberBotInstance = new ViberBot({
    authToken: token
  });
}
```

**Solution:** Token loaded from database where it's stored via Settings page

---

## ✅ Expected Flow

1. **User sends message** → Viber servers
2. **Viber servers** → POST to `/webhooks/viber`
3. **Backend receives webhook** → Logs "Viber webhook received"
4. **Bot initializes** (if not already) → Loads token from database
5. **Message handler triggered** → Logs "Viber message received"
6. **Customer created/found** → Logs "Customer: ..."
7. **Message saved** → Logs "Message saved to database"
8. **Response sent** → Logs "Welcome message sent"
9. **Webhook complete** → Logs "Viber webhook processed successfully"
10. **Message appears** in Messages page (via WebSocket)

---

## 🎯 Success Criteria

✅ Bot responds to messages  
✅ Messages appear in Messages page  
✅ Customer is created in database  
✅ Chat session is created  
✅ Commands work (/products, /orders)  
✅ Backend logs show successful processing  

---

## 📝 Quick Test Script

```bash
# 1. Check webhook status
curl https://myanmar-pos-backend.onrender.com/api/bots/webhook/status

# 2. Send test message via Viber app

# 3. Check if message was received
curl https://myanmar-pos-backend.onrender.com/api/chat/sessions

# Should return chat sessions including your test message
```

---

**Need more help?** Check the Render logs for detailed error messages!
