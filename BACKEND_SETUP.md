# Myanmar POS System - Backend Setup Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- Supabase account (free tier works)
- Bot tokens (optional, for bot features)

### Installation

1. **Install dependencies**
```bash
npm install
```

2. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your actual credentials:
- `SUPABASE_URL` and `SUPABASE_ANON_KEY` are already configured
- `SUPABASE_SERVICE_KEY` is for server-side operations (keep secret!)
- Bot tokens are optional - system works without them

3. **Setup database**

Run the SQL schema files in your Supabase SQL editor in this order:
```
1. supabase/schema.sql
2. supabase/chat_schema.sql
3. supabase/bot_flow_schema.sql
4. supabase/uom_schema.sql
5. supabase/price_history_schema.sql
```

4. **Seed initial data (optional)**
```bash
npm run seed
```

5. **Start the server**
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

Server will start on `http://localhost:3001`

## 🔧 Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | ✅ Yes | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | ✅ Yes | Public anon key (safe for frontend) |
| `SUPABASE_SERVICE_KEY` | ✅ Yes | Service role key (server-side only, keep secret!) |
| `PORT` | No | Server port (default: 3001) |
| `NODE_ENV` | No | Environment (development/production) |
| `CLIENT_URL` | No | Frontend URL for CORS (default: http://localhost:3000) |
| `VIBER_BOT_TOKEN` | No | Viber bot authentication token |
| `TELEGRAM_BOT_TOKEN` | No | Telegram bot token from @BotFather |
| `MESSENGER_PAGE_ACCESS_TOKEN` | No | Facebook page access token |
| `MESSENGER_VERIFY_TOKEN` | No | Custom verify token for Messenger |
| `MESSENGER_APP_SECRET` | No | Facebook app secret for signature verification |
| `FB_API_VERSION` | No | Facebook Graph API version (default: v18.0) |

### Bot Configuration

The system works perfectly fine **without bot tokens**. Bots are optional features.

#### Telegram Bot Setup
1. Message @BotFather on Telegram
2. Create a new bot with `/newbot`
3. Copy the token to `TELEGRAM_BOT_TOKEN`
4. Configure webhook via API endpoint: `POST /api/bots/telegram/setup`

#### Viber Bot Setup
1. Register at https://partners.viber.com/
2. Create a bot and get authentication token
3. Copy token to `VIBER_BOT_TOKEN`
4. Configure webhook via API endpoint: `POST /api/bots/viber/setup`

#### Messenger Bot Setup
1. Create Facebook App at https://developers.facebook.com/
2. Add Messenger product
3. Get Page Access Token
4. Generate a custom verify token (any random string)
5. Configure webhook via API endpoint: `POST /api/bots/messenger/setup`

## 🛡️ Security Features

### Implemented Security Measures

1. **Webhook Signature Verification**
   - Viber: HMAC-SHA256 signature verification
   - Messenger: SHA256 signature verification
   - Telegram: Token-based verification

2. **Rate Limiting**
   - API endpoints: 200 req/15min (dev: 1000)
   - Webhooks: 60 req/min
   - Chat messages: 30 req/min
   - Auth endpoints: 5 req/15min

3. **Error Handling**
   - Production: Generic error messages (no internal details exposed)
   - Development: Detailed error messages with stack traces
   - All errors logged server-side

4. **Input Validation**
   - Express-validator for request validation
   - SQL injection prevention via Supabase parameterized queries
   - XSS prevention via input sanitization

5. **CORS Protection**
   - Configured for specific client URL
   - Credentials support enabled

6. **Helmet.js**
   - Security headers automatically set
   - XSS protection, clickjacking prevention, etc.

## 📡 API Endpoints

### Health Check
```
GET /health
```
Returns server status and database connectivity

### Products
```
GET    /api/products          - List all products
GET    /api/products/:id      - Get product by ID
POST   /api/products          - Create product
PUT    /api/products/:id      - Update product
DELETE /api/products/:id      - Delete product
GET    /api/products/search/:query - Search products
```

### Orders
```
GET    /api/orders            - List all orders
GET    /api/orders/:id        - Get order by ID
POST   /api/orders            - Create order (with stock validation)
PATCH  /api/orders/:id/status - Update order status
DELETE /api/orders/:id        - Delete order
```

### Chat
```
GET    /api/chat/sessions           - Get active chat sessions
GET    /api/chat/messages/:customerId - Get messages for customer
POST   /api/chat/send               - Send message to customer
POST   /api/chat/mark-read/:customerId - Mark messages as read
GET    /api/chat/unread-count       - Get total unread count
POST   /api/chat/sessions/:customerId/close - Close chat session
```

### Bot Management
```
GET    /api/bots/config              - Get bot configurations
POST   /api/bots/telegram/setup      - Setup Telegram webhook
POST   /api/bots/viber/setup         - Setup Viber webhook
POST   /api/bots/messenger/setup     - Setup Messenger webhook
POST   /api/bots/test/:platform      - Test bot connection
GET    /api/bots/webhook/status      - Get webhook status
DELETE /api/bots/:platform/webhook  - Delete webhook
```

### Bot Flows
```
GET    /api/bot-flows         - List all flows
GET    /api/bot-flows/:id     - Get flow with nodes
POST   /api/bot-flows         - Create flow
PUT    /api/bot-flows/:id     - Update flow
DELETE /api/bot-flows/:id     - Delete flow
POST   /api/bot-flows/:id/save - Save flow nodes/connections
POST   /api/bot-flows/:id/duplicate - Duplicate flow
GET    /api/bot-flows/:id/stats - Get flow statistics
```

### Selling Price Management
```
POST   /api/selling-price/bulk-update - Bulk update prices with formula
PUT    /api/selling-price/update/:id  - Update single product price
GET    /api/selling-price/history/:productId - Get price history
GET    /api/selling-price/export      - Export prices to Excel/CSV
POST   /api/selling-price/import      - Import prices from Excel
GET    /api/selling-price/import-template - Download import template
```

### UOM (Unit of Measure)
```
GET    /api/uom                - List all UOMs
POST   /api/uom                - Create UOM
PUT    /api/uom/:id            - Update UOM
DELETE /api/uom/:id            - Delete UOM
GET    /api/uom/product/:productId - Get product UOMs
POST   /api/uom/product        - Add UOM to product
PUT    /api/uom/product/:id    - Update product UOM
POST   /api/uom/convert        - Convert quantity between UOMs
```

### Reports
```
GET    /api/reports/daily-sales      - Daily sales report
GET    /api/reports/monthly-sales    - Monthly sales report
GET    /api/reports/product-performance - Product performance
GET    /api/reports/profit-loss      - Profit & loss report
```

## 🔄 Real-time Features

### WebSocket Events

The server uses Socket.IO for real-time updates:

**Client → Server:**
- `join:customer` - Join customer room for private messages
- `join:admin` - Join admin room for all messages

**Server → Client:**
- `chat:new-message` - New message received
- `chat:messages-read` - Messages marked as read
- `chat:unread-count` - Unread count updated
- `chat:session-update` - Chat session updated

## 🐛 Troubleshooting

### Server won't start
- Check if port 3001 is available
- Verify Supabase credentials in `.env`
- Run `npm install` to ensure all dependencies are installed

### Bot webhooks not working
- Verify bot tokens are correct
- Check webhook URLs are publicly accessible (use ngrok for local testing)
- Review server logs for webhook errors
- Ensure webhook signatures are being verified correctly

### Database errors
- Verify all schema files have been run in Supabase
- Check Supabase service role key has proper permissions
- Review Supabase logs for detailed error messages

### CORS errors
- Update `CLIENT_URL` in `.env` to match your frontend URL
- Restart server after changing environment variables

## 📝 Development Tips

### Local Development with Bots

Use ngrok to expose your local server:
```bash
ngrok http 3001
```

Then use the ngrok URL for webhook configuration.

### Testing Without Bots

The system is fully functional without bot integration:
- Use the chat API endpoints directly
- Test with Postman or similar tools
- Frontend can send messages via REST API

### Database Migrations

When updating schema:
1. Make changes in Supabase SQL editor
2. Export schema and save to `supabase/` folder
3. Document changes in migration notes

## 🚀 Production Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Use strong, unique tokens for all bots
3. Configure proper CORS origins
4. Enable HTTPS (required for webhooks)
5. Set up proper logging and monitoring

### Security Checklist
- ✅ All environment variables set
- ✅ HTTPS enabled
- ✅ Webhook signatures verified
- ✅ Rate limiting configured
- ✅ Error messages don't expose internals
- ✅ Database backups configured
- ✅ Monitoring and alerts set up

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Viber Bot API](https://developers.viber.com/docs/api/rest-bot-api/)
- [Messenger Platform](https://developers.facebook.com/docs/messenger-platform)

## 🤝 Support

For issues or questions:
1. Check server logs for detailed error messages
2. Review this documentation
3. Check Supabase logs for database issues
4. Verify all environment variables are set correctly
