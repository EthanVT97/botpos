# Quick Reference - Myanmar POS Backend

## 🚀 Quick Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start

# Seed database with sample data
npm run seed
```

## 🔧 Common Issues & Solutions

### Issue: Server won't start
```
Error: Invalid bot token
```
**Solution**: Bot tokens are optional. Server will start with warnings if tokens are missing.

---

### Issue: Database connection failed
```
Error: Database operation failed
```
**Solution**: 
1. Check `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` in `.env`
2. Verify Supabase project is active
3. Run all schema files in Supabase SQL editor

---

### Issue: CORS errors from frontend
```
Access to fetch blocked by CORS policy
```
**Solution**: 
1. Set `CLIENT_URL=http://localhost:3000` in `.env`
2. Restart server after changing `.env`

---

### Issue: Webhook not receiving messages
```
Webhook received but bot not configured
```
**Solution**:
1. Verify bot token is set in `.env`
2. Configure webhook via API: `POST /api/bots/{platform}/setup`
3. For local testing, use ngrok: `ngrok http 3001`

---

### Issue: Order creation fails
```
Insufficient stock for one or more products
```
**Solution**: This is expected behavior. Check product stock before creating order.

---

## 📡 Essential API Endpoints

### Health Check
```bash
GET http://localhost:3001/health
```

### Create Product
```bash
POST http://localhost:3001/api/products
Content-Type: application/json

{
  "name": "Product Name",
  "price": 1000,
  "stock_quantity": 100
}
```

### Create Order
```bash
POST http://localhost:3001/api/orders
Content-Type: application/json

{
  "customer_id": "uuid-here",
  "items": [
    {
      "product_id": "uuid-here",
      "quantity": 2,
      "price": 1000
    }
  ],
  "total_amount": 2000,
  "payment_method": "cash"
}
```

### Send Chat Message
```bash
POST http://localhost:3001/api/chat/send
Content-Type: application/json

{
  "customerId": "uuid-here",
  "message": "Hello!",
  "channel": "telegram"
}
```

### Setup Telegram Bot
```bash
POST http://localhost:3001/api/bots/telegram/setup
Content-Type: application/json

{
  "token": "your-telegram-bot-token",
  "domain": "https://your-domain.com"
}
```

## 🔐 Environment Variables Priority

### Required (Server won't work without these)
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`

### Optional (System works without these)
- `PORT` (default: 3001)
- `NODE_ENV` (default: development)
- `CLIENT_URL` (default: http://localhost:3000)
- All bot tokens (bots are optional features)

## 🐛 Debug Mode

### Enable detailed logging
```bash
NODE_ENV=development npm run dev
```

### Check server logs
- All errors are logged to console
- Webhook payloads are logged in development
- Database errors show full details in development

## 🔒 Security Checklist

### Development
- ✅ Use `.env` file (never commit it)
- ✅ Use development tokens for testing
- ✅ Enable detailed error messages

### Production
- ✅ Set `NODE_ENV=production`
- ✅ Use strong, unique tokens
- ✅ Enable HTTPS
- ✅ Configure proper CORS origins
- ✅ Set up monitoring and alerts
- ✅ Regular database backups

## 📊 Database Schema Order

Run these SQL files in Supabase in this exact order:

1. `supabase/schema.sql` - Core tables
2. `supabase/chat_schema.sql` - Chat system
3. `supabase/bot_flow_schema.sql` - Bot flows
4. `supabase/uom_schema.sql` - Unit of measure
5. `supabase/price_history_schema.sql` - Price tracking

## 🎯 Testing Checklist

- [ ] Server starts without errors
- [ ] Health endpoint returns 200
- [ ] Can create products
- [ ] Can create customers
- [ ] Can create orders (with validation)
- [ ] Chat API works
- [ ] WebSocket connects
- [ ] Bot webhooks receive messages (if configured)

## 📞 Support Resources

- **Setup Guide**: See `BACKEND_SETUP.md`
- **Fixes Applied**: See `FIXES_APPLIED.md`
- **Supabase Docs**: https://supabase.com/docs
- **Telegram Bot API**: https://core.telegram.org/bots/api
- **Viber Bot API**: https://developers.viber.com/docs/api/rest-bot-api/
- **Messenger Platform**: https://developers.facebook.com/docs/messenger-platform

## 💡 Pro Tips

1. **Local Bot Testing**: Use ngrok to expose localhost
   ```bash
   ngrok http 3001
   ```

2. **Database Queries**: Use Supabase dashboard for quick queries

3. **Real-time Testing**: Open browser console and connect to WebSocket
   ```javascript
   const socket = io('http://localhost:3001');
   socket.on('connect', () => console.log('Connected!'));
   ```

4. **API Testing**: Use Postman or Thunder Client VS Code extension

5. **Log Monitoring**: Use `tail -f` on log files in production

## 🚨 Emergency Procedures

### Server Crashed
1. Check logs for error message
2. Verify `.env` file exists and is correct
3. Restart server: `npm start`
4. If still failing, check Supabase status

### Database Issues
1. Check Supabase dashboard for errors
2. Verify service role key is correct
3. Check if tables exist
4. Re-run schema files if needed

### Bot Not Responding
1. Check bot token is valid
2. Verify webhook is configured
3. Check webhook URL is accessible
4. Review server logs for webhook errors

---

**Last Updated**: After applying all 12 fixes
**Status**: ✅ All systems operational
