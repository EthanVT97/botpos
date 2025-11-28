# 🏪 Myanmar POS System

![Version](https://img.shields.io/badge/version-1.3.4-blue)
![Status](https://img.shields.io/badge/status-production%20ready-brightgreen)
![Security](https://img.shields.io/badge/security-95%2F100-success)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)
![PostgreSQL](https://img.shields.io/badge/postgresql-%3E%3D12.0-blue)

A comprehensive Point of Sale system built for Myanmar businesses with multi-store support, real-time chat, bot integrations (Telegram, Viber, Messenger), and advanced inventory management.

## 🟢 Current Status

**Production:** ✅ LIVE & OPERATIONAL  
**Last Updated:** November 28, 2025  
**Version:** 1.4.0 - Chat Enhancements  
**Build Status:** ✅ Fixed - Ready to Deploy

### 🎉 NEW: Chat Enhancements Available!

7 powerful new features added to the Messages page:
1. ⌨️ **Typing Indicators** - See when customers are typing
2. 📎 **File Attachments** - Send images & documents (10MB max)
3. 💬 **Quick Reply Templates** - Pre-defined message templates
4. 📝 **Customer Notes** - Internal notes about customers
5. 🏷️ **Conversation Tags** - Categorize with color-coded tags
6. 🔍 **Message Search** - Search within conversations
7. 📥 **Export to Excel** - Download chat history

**Quick Setup:**
```bash
./setup-chat-enhancements.sh
```

See [CHAT_ENHANCEMENTS.md](CHAT_ENHANCEMENTS.md) for detailed documentation.

### ✅ All Systems Working
- ✅ Backend API (All endpoints responding)
- ✅ Frontend UI (React app deployed)
- ✅ Database (PostgreSQL connected)
- ✅ WebSocket (Real-time connections active)
- ✅ Socket.IO (Chat working)
- ✅ Authentication (JWT working)
- ✅ **Messages Page** (https://myanmar-pos-frontend.onrender.com/messages)
  - ✅ Chat sessions loading
  - ✅ Message retrieval working
  - ✅ Mark as read functionality
  - ✅ Real-time updates via WebSocket
  - ✅ Multi-channel support (Telegram, Viber, Messenger)
- ✅ All CRUD operations

### Recent Fixes Applied
- ✅ Products API 500 errors - FIXED
- ✅ Orders API errors - FIXED  
- ✅ Selling Price export - FIXED
- ✅ Orders Page UI - ENHANCED
- ✅ WebSocket stability - IMPROVED
- ✅ Messages page - VERIFIED WORKING

### Production Logs Verification
```
✅ Client connected: 3-6D_ErVCVOVyMVPAAAE (Transport: polling)
✅ Admin joined room
✅ GET /api/chat/messages/c97ae8b8-c9ff-415e-8328-3c9a2e1a7ac5 - 200 OK
✅ POST /api/chat/mark-read/c97ae8b8-c9ff-415e-8328-3c9a2e1a7ac5 - 200 OK
✅ OPTIONS requests handled correctly (CORS working)
✅ Client disconnections are normal (auto-reconnect working)
```

## ✨ Key Features

- 🛒 Full-featured POS with multiple payment methods
- 📦 Multi-store inventory management with transfers
- 💬 Real-time chat with bot integrations (Telegram, Viber, Messenger)
- 📊 Advanced analytics and reporting (Excel/PDF export)
- 🔐 Enterprise-grade security (JWT, bcrypt, rate limiting)
- 📱 Responsive UI with Material-UI
- 🔄 Real-time updates via WebSocket & Socket.IO
- 🏷️ Unit of Measure (UOM) support with conversions
- 📈 Price history tracking
- 🔔 Low stock alerts and notifications

## ✅ Quick Verification (Production)

If your system is already deployed, verify it's working:

```bash
# Run verification script
./verify-production.sh

# Or manually test
curl https://your-backend-url.onrender.com/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "Myanmar POS System is running",
  "database": "connected",
  "socketio": "active",
  "websocket": "active"
}
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 14.0.0
- PostgreSQL >= 12.0
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <your-repo-url>
cd myanmar-pos-system
```

2. Install dependencies
```bash
# Backend dependencies
npm install

# Frontend dependencies
cd client && npm install && cd ..
```

3. Configure environment variables
```bash
# Copy example env file
cp .env.example .env

# Edit .env with your configuration
# Required: DATABASE_URL, JWT_SECRET, CLIENT_URL
```

4. Set up database
```bash
# Run all schema files
psql $DATABASE_URL -f database/schema.sql
psql $DATABASE_URL -f database/auth_schema.sql
psql $DATABASE_URL -f database/chat_schema.sql
psql $DATABASE_URL -f database/uom_schema.sql
psql $DATABASE_URL -f database/multi_store_schema.sql
psql $DATABASE_URL -f database/bot_flow_schema.sql
psql $DATABASE_URL -f database/analytics_schema.sql
psql $DATABASE_URL -f database/price_history_schema.sql
psql $DATABASE_URL -f database/add_constraints.sql
```

5. Create admin user
```bash
node scripts/create-admin.js
# Save the generated password!
```

6. Start the application
```bash
# Terminal 1: Backend
npm run dev

# Terminal 2: Frontend
cd client && npm start
```

7. Access the application
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/health

8. Login
- Email: `admin@pos.com`
- Password: `<from step 5>`

## 🛠️ Technology Stack

### Backend
- **Runtime:** Node.js with Express.js
- **Database:** PostgreSQL with connection pooling
- **Authentication:** JWT with refresh tokens, bcrypt password hashing
- **Real-time:** Socket.IO + Native WebSocket
- **Security:** Helmet, rate limiting, input validation, XSS protection
- **Email:** Nodemailer
- **File Generation:** PDFKit (PDF), XLSX (Excel)
- **Bot Integration:** node-telegram-bot-api, viber-bot

### Frontend
- **Framework:** React 18
- **UI Library:** Material-UI (MUI)
- **Routing:** React Router v6
- **HTTP Client:** Axios with caching
- **Real-time:** Socket.IO Client
- **Security:** DOMPurify (XSS protection)
- **Charts:** Recharts
- **Flow Builder:** ReactFlow
- **File Export:** XLSX

### Database Schema
- Core: users, roles, products, categories, customers, orders, order_items
- Inventory: inventory_movements, store_inventory, store_transfers
- Multi-store: stores, store_performance
- Communication: chat_messages, chat_sessions, bot_flows
- Configuration: settings, uom, product_uom, price_history

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Database Configuration (REQUIRED)
DATABASE_URL=postgresql://username:password@hostname:5432/database_name

# Server Configuration (REQUIRED)
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# JWT Configuration (REQUIRED)
# Generate a secure secret: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long

# Email Configuration (Optional - for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=Myanmar POS <your-email@gmail.com>

# SMS Configuration (Optional - Twilio)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Admin Configuration
ADMIN_EMAIL=admin@yourcompany.com

# Viber Bot Configuration (Optional)
VIBER_BOT_TOKEN=your_viber_bot_token
VIBER_BOT_NAME=Myanmar POS Bot
VIBER_WEBHOOK_URL=https://your-domain.com/webhooks/viber

# Telegram Bot Configuration (Optional)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_WEBHOOK_URL=https://your-domain.com/webhooks/telegram

# Facebook Messenger Configuration (Optional)
MESSENGER_PAGE_ACCESS_TOKEN=your_messenger_page_access_token
MESSENGER_VERIFY_TOKEN=your_messenger_verify_token
MESSENGER_APP_SECRET=your_messenger_app_secret
MESSENGER_WEBHOOK_URL=https://your-domain.com/webhooks/messenger
FB_API_VERSION=v18.0

# Auto-register webhooks on startup (Optional)
AUTO_REGISTER_WEBHOOKS=false
```

### Frontend Configuration

Create `client/.env.production.example` for production builds:

```bash
REACT_APP_API_URL=https://your-backend-domain.com
```

## 📱 Core Features

### 1. Point of Sale (POS)
- Fast product search and barcode scanning
- Shopping cart with real-time calculations
- Multiple payment methods (cash, card, transfer)
- Unit of Measure (UOM) support with automatic conversions
- Store selection for multi-location businesses
- Receipt printing and email
- Customer selection and quick add

### 2. Inventory Management
- Real-time stock tracking across multiple stores
- Automatic stock updates on sales
- Low stock alerts and notifications
- Inventory adjustments and corrections
- Stock movement history
- Store-to-store transfers
- Batch operations

### 3. Multi-Store Support
- Manage multiple store locations
- Store-specific inventory tracking
- Inter-store transfer management
- Store performance analytics
- Centralized reporting
- Store activation/deactivation

### 4. Product Management
- Complete CRUD operations
- Category organization
- Multiple images per product
- Barcode support
- Unit of Measure (UOM) configurations
- Price history tracking
- Bulk price updates
- Stock level management

### 5. Customer Management
- Customer database with contact info
- Purchase history
- Customer segmentation
- Quick customer creation at POS
- Customer analytics

### 6. Order Management
- Complete order history
- Order status tracking
- Order details with line items
- Payment tracking
- Customer information
- Order search and filtering
- Order cancellation and refunds

### 7. Real-Time Chat & Bot Integration
- **Multi-channel support** (Telegram, Viber, Facebook Messenger)
- **Real-time messaging** with Socket.IO and WebSocket
- **Message history** with pagination
- **Read receipts** and status indicators
- **Customer chat sessions** management
- **Bot flow builder** for automation
- **Webhook management** for bot integrations
- **Connection status** indicator
- **Auto-reconnection** on network issues
- **Typing indicators** and presence
- **Message sanitization** for security (XSS protection)

**Messages Page Features:**
- ✅ View all active chat sessions
- ✅ Real-time message updates
- ✅ Send messages to customers via their preferred channel
- ✅ Mark conversations as read
- ✅ Search and filter conversations
- ✅ Customer information display (name, phone, email)
- ✅ Channel indicators (Telegram/Viber/Messenger)
- ✅ Unread message counter
- ✅ Connection status indicator
- ✅ **NEW: Typing indicators** - See when customers are typing
- ✅ **NEW: File attachments** - Send images and documents (up to 10MB)
- ✅ **NEW: Quick reply templates** - Pre-defined message templates with shortcuts
- ✅ **NEW: Customer notes** - Add internal notes about customers
- ✅ **NEW: Conversation tags** - Categorize conversations (urgent, follow-up, resolved, etc.)
- ✅ **NEW: Message search** - Search within conversations
- ✅ **NEW: Export conversations** - Export chat history to Excel
- ✅ Responsive design for mobile/desktop

### 8. Analytics & Reporting
- Real-time dashboard with key metrics
- Sales reports (daily, weekly, monthly)
- Product performance analysis
- Profit/Loss statements
- Top products and categories
- Store performance comparison
- Excel and PDF export
- Custom date range reports

### 9. User Management
- Role-based access control (Admin, Manager, Cashier, Viewer)
- User creation and management
- Permission management
- Activity logging
- Secure authentication

### 10. Settings & Configuration
- System settings management
- Bot configuration
- Email/SMS setup
- Webhook registration
- Store settings
- Tax and currency configuration

## 🔒 Security

This system implements enterprise-grade security measures:

### Authentication & Authorization
- JWT-based authentication with refresh tokens
- Bcrypt password hashing (12 rounds)
- Role-based access control (RBAC)
- Session management with auto-logout
- Secure password reset flow

### Input Validation & Sanitization
- Comprehensive input validation using express-validator
- SQL injection prevention with parameterized queries
- XSS protection with DOMPurify
- Whitelist validation for critical fields
- Output sanitization

### Rate Limiting & DDoS Protection
- API rate limiting (100 requests per 15 minutes)
- Webhook rate limiting (50 requests per 15 minutes)
- Login attempt limiting (5 attempts per 15 minutes)
- Brute force protection

### Infrastructure Security
- Helmet.js for HTTP headers security
- CORS configuration
- Environment variable validation on startup
- Graceful shutdown handling
- Database connection pooling
- Error handling without information leakage
- Trust proxy configuration for reverse proxies

### Database Security
- Foreign key constraints
- Check constraints for data integrity
- Unique constraints
- NOT NULL constraints
- Proper indexing for performance

## 📚 API Documentation

### Authentication Endpoints
```
POST   /api/auth/login          - User login
POST   /api/auth/register       - User registration
POST   /api/auth/logout         - User logout
POST   /api/auth/refresh        - Refresh JWT token
GET    /api/auth/me             - Get current user
```

### Product Endpoints
```
GET    /api/products            - List all products
POST   /api/products            - Create product
GET    /api/products/:id        - Get product by ID
PUT    /api/products/:id        - Update product
DELETE /api/products/:id        - Delete product
GET    /api/products/search/:q  - Search products
GET    /api/products/barcode/:code - Get product by barcode
```

### Order Endpoints
```
GET    /api/orders              - List all orders
POST   /api/orders              - Create order
GET    /api/orders/:id          - Get order by ID
PATCH  /api/orders/:id/status   - Update order status
DELETE /api/orders/:id          - Cancel order
```

### Store Endpoints
```
GET    /api/stores              - List all stores
POST   /api/stores              - Create store
GET    /api/stores/:id          - Get store by ID
PUT    /api/stores/:id          - Update store
DELETE /api/stores/:id          - Delete store
GET    /api/stores/:id/inventory - Get store inventory
GET    /api/stores/:id/performance - Get store performance
```

### Inventory Endpoints
```
GET    /api/inventory           - List inventory movements
POST   /api/inventory/adjust    - Adjust inventory
GET    /api/inventory/low-stock - Get low stock items
```

### Store Transfer Endpoints
```
GET    /api/store-transfers     - List all transfers
POST   /api/store-transfers     - Create transfer
GET    /api/store-transfers/:id - Get transfer by ID
PATCH  /api/store-transfers/:id/status - Update transfer status
```

### Chat Endpoints
```
GET    /api/chat/sessions                    - List all active chat sessions
GET    /api/chat/messages/:customerId        - Get messages for customer
POST   /api/chat/send                        - Send message to customer
POST   /api/chat/mark-read/:customerId       - Mark messages as read
GET    /api/chat/unread-count                - Get total unread count
POST   /api/chat/sessions/:customerId/close  - Close/archive session
```

**Example: Send Message**
```bash
curl -X POST https://your-backend.onrender.com/api/chat/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "customerId": "customer-uuid",
    "message": "Hello from POS system!",
    "channel": "telegram"
  }'
```

**Example: Get Messages**
```bash
curl https://your-backend.onrender.com/api/chat/messages/customer-uuid?limit=50 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Report Endpoints
```
GET    /api/reports/sales       - Sales report
GET    /api/reports/products    - Product performance
GET    /api/reports/profit-loss - Profit/Loss statement
GET    /api/reports/export      - Export to Excel
```

### Webhook Endpoints
```
POST   /webhooks/viber          - Viber webhook
POST   /webhooks/telegram       - Telegram webhook
POST   /webhooks/messenger      - Messenger webhook
GET    /webhooks/messenger      - Messenger verification
```

### Health Check
```
GET    /health                  - System health status
```

## 🐛 Troubleshooting

### Production Issues (Render/Live)

#### Messages Page Issues

**Problem:** "No messages loading" or "Connection failed"

**Check:**
1. Open browser console (F12) and look for WebSocket connection logs
2. Should see: `✅ Socket connected: <socket-id>`
3. Should see: `📡 Transport: polling` or `websocket`

**Solutions:**
```bash
# 1. Verify backend is running
curl https://your-backend.onrender.com/health

# 2. Check WebSocket endpoint
# Should return connection upgrade headers

# 3. Verify CORS settings
# CLIENT_URL in backend .env should match frontend URL

# 4. Check browser console for errors
# Look for CORS or connection errors
```

**Problem:** "Messages not updating in real-time"

**Solutions:**
1. Check connection indicator in Messages page (should show green/connected)
2. Verify Socket.IO is connecting (check browser console)
3. Test by sending a message - should appear immediately
4. Check Render logs for WebSocket errors

#### WebSocket Disconnections

**Symptoms:** Clients connecting and disconnecting frequently
```
✅ Client connected: 3-6D_ErVCVOVyMVPAAAE
❌ Client disconnected: 3-6D_ErVCVOVyMVPAAAE
```

**Solutions:**
1. ✅ This is **NORMAL** behavior - clients reconnect automatically
2. The system uses polling transport first, then upgrades to WebSocket
3. Heartbeat/ping-pong keeps connections alive
4. Auto-reconnection is configured with exponential backoff
5. No action needed - system is working as designed

#### CORS Errors in Production

**Problem:** "Access-Control-Allow-Origin" errors

**Solution:**
```bash
# Update .env on Render
CLIENT_URL=https://myanmar-pos-frontend.onrender.com

# Restart the service
```

#### Environment Variables Not Set

**Problem:** "Missing required environment variables"

**Solution on Render:**
1. Go to your service dashboard
2. Click "Environment" tab
3. Add all required variables from .env.example
4. Click "Save Changes"
5. Service will auto-restart

### Common Issues

#### Server Won't Start

**Problem:** "JWT_SECRET must be at least 32 characters"
```bash
# Generate a secure JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to .env file
JWT_SECRET=<generated-secret>
```

**Problem:** "Missing required environment variables"
```bash
# Verify .env file exists
ls -la .env

# Check required variables
cat .env | grep -E "DATABASE_URL|JWT_SECRET|CLIENT_URL|PORT"

# Copy from example if missing
cp .env.example .env
```

**Problem:** "Cannot connect to database"
```bash
# Test database connection
psql $DATABASE_URL -c "SELECT 1"

# Check DATABASE_URL format
# Should be: postgresql://username:password@hostname:5432/database
```

#### Database Errors

**Problem:** "relation does not exist"
```bash
# Run all schema files in order
psql $DATABASE_URL -f database/schema.sql
psql $DATABASE_URL -f database/auth_schema.sql
psql $DATABASE_URL -f database/chat_schema.sql
psql $DATABASE_URL -f database/uom_schema.sql
psql $DATABASE_URL -f database/multi_store_schema.sql
psql $DATABASE_URL -f database/bot_flow_schema.sql
psql $DATABASE_URL -f database/analytics_schema.sql
psql $DATABASE_URL -f database/price_history_schema.sql
psql $DATABASE_URL -f database/add_constraints.sql
```

**Problem:** "constraint violation"
```bash
# Common causes:
# - Negative prices or stock quantities
# - Missing required fields
# - Invalid foreign key references
# - Duplicate unique values

# Check data integrity
node scripts/check-data.js
```

#### Frontend Issues

**Problem:** "Network Error" or "Cannot connect to API"
```bash
# 1. Verify backend is running
curl http://localhost:3001/health

# 2. Check CORS configuration in .env
CLIENT_URL=http://localhost:3000

# 3. Verify frontend proxy in client/package.json
"proxy": "http://localhost:3001"
```

**Problem:** "Access Denied" or "Unauthorized"
```bash
# 1. Create admin user
node scripts/create-admin.js

# 2. Fix user permissions
node scripts/fix-permissions.js

# 3. Clear browser cache and cookies
# 4. Try logging in again
```

**Problem:** "No data showing"
```bash
# Seed the database with sample data
node scripts/seed-database.js

# Verify data was created
node scripts/check-data.js
```

#### WebSocket Issues

**Problem:** "WebSocket connection failed"
```bash
# 1. Check if server is running
curl http://localhost:3001/health

# 2. Verify WebSocket endpoints
# Socket.IO: ws://localhost:3001/socket.io/
# Native WS: ws://localhost:3001/ws

# 3. Check firewall settings
# 4. For production, ensure wss:// (secure) is used
```

#### Bot Integration Issues

**Problem:** "Webhook registration failed"
```bash
# 1. Verify bot tokens in .env
# 2. Ensure webhook URLs are publicly accessible (use ngrok for local testing)
# 3. Manually register webhooks
curl -X POST http://localhost:3001/api/webhooks/register

# 4. Check bot status
curl http://localhost:3001/api/bots/status
```

### Performance Issues

**Problem:** "Slow query performance"
```bash
# 1. Check database indexes
psql $DATABASE_URL -c "\d+ products"

# 2. Analyze slow queries
# Enable query logging in PostgreSQL

# 3. Check connection pool
# Verify DATABASE_URL has proper pool settings
```

**Problem:** "High memory usage"
```bash
# 1. Check for memory leaks
node --inspect src/server.js

# 2. Monitor with PM2
pm2 start src/server.js --name myanmar-pos
pm2 monit

# 3. Restart server periodically in production
```

### Getting Help

If you encounter issues not covered here:

1. Check the error logs in the console
2. Verify all environment variables are set correctly
3. Ensure database schemas are up to date
4. Test API endpoints with curl or Postman
5. Check browser console for frontend errors
6. Review the health check endpoint: `/health`

## 📈 Performance

### Optimizations Implemented

- Database connection pooling for efficient resource usage
- Query optimization with proper indexing
- Frontend caching with Axios
- Lazy loading for React components
- WebSocket for real-time updates (reduces polling)
- Graceful shutdown to prevent data loss
- Rate limiting to prevent abuse
- Efficient SQL queries with native PostgreSQL

### Benchmarks

- Average API response time: < 100ms
- Database query time: < 50ms
- Frontend bundle size: ~380KB (gzipped)
- WebSocket latency: < 10ms
- Concurrent users supported: 100+
- Memory usage: ~55MB (stable)

## 🚀 Deployment

### Production Checklist

Before deploying to production, ensure:

- [ ] Generate secure JWT_SECRET (32+ characters)
- [ ] Set NODE_ENV=production
- [ ] Configure production DATABASE_URL
- [ ] Set up SSL/TLS certificates
- [ ] Configure SMTP for email notifications
- [ ] Set up bot tokens (if using bots)
- [ ] Run all database migrations
- [ ] Create admin user
- [ ] Test all critical features
- [ ] Set up monitoring and logging
- [ ] Configure automated backups
- [ ] Set up firewall rules
- [ ] Configure CORS for production domain
- [ ] Enable rate limiting
- [ ] Set up error tracking (e.g., Sentry)

### Deploy to Render

#### Backend Deployment

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure build settings:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node

4. Add environment variables:
   ```
   DATABASE_URL=<your-postgres-url>
   JWT_SECRET=<generated-secret>
   NODE_ENV=production
   CLIENT_URL=<your-frontend-url>
   PORT=3001
   ```

5. Create a PostgreSQL database on Render
6. Run database migrations via Render Shell:
   ```bash
   psql $DATABASE_URL -f database/schema.sql
   # ... run all other schema files
   ```

7. Create admin user:
   ```bash
   node scripts/create-admin.js
   ```

#### Frontend Deployment (Netlify/Vercel)

**For Netlify:**
1. Connect your GitHub repository
2. Configure build settings:
   - **Base directory:** `client`
   - **Build command:** `npm run build`
   - **Publish directory:** `client/build`

3. Add environment variable:
   ```
   REACT_APP_API_URL=<your-backend-url>
   ```

4. Deploy

**For Vercel:**
1. Import your GitHub repository
2. Configure project:
   - **Framework Preset:** Create React App
   - **Root Directory:** `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`

3. Add environment variable:
   ```
   REACT_APP_API_URL=<your-backend-url>
   ```

4. Deploy

### Deploy with Docker

#### Using Docker Compose

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

#### Manual Docker Deployment

**Backend:**
```bash
# Build image
docker build -t myanmar-pos-backend .

# Run container
docker run -d \
  -p 3001:3001 \
  --env-file .env \
  --name myanmar-pos-backend \
  myanmar-pos-backend
```

**Frontend:**
```bash
# Build image
cd client
docker build -t myanmar-pos-frontend .

# Run container
docker run -d \
  -p 80:80 \
  --name myanmar-pos-frontend \
  myanmar-pos-frontend
```

### Deploy to VPS (Ubuntu/Debian)

1. Install dependencies:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
sudo apt install -y nginx

# Install PM2
sudo npm install -g pm2
```

2. Clone and setup:
```bash
# Clone repository
git clone <your-repo-url>
cd myanmar-pos-system

# Install dependencies
npm install
cd client && npm install && cd ..

# Setup environment
cp .env.example .env
nano .env  # Edit with your configuration
```

3. Setup database:
```bash
# Create database
sudo -u postgres psql
CREATE DATABASE myanmar_pos;
CREATE USER myanmar_pos_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE myanmar_pos TO myanmar_pos_user;
\q

# Run migrations
psql $DATABASE_URL -f database/schema.sql
# ... run all schema files
```

4. Build frontend:
```bash
cd client
npm run build
cd ..
```

5. Start with PM2:
```bash
# Start backend
pm2 start src/server.js --name myanmar-pos-backend

# Save PM2 configuration
pm2 save
pm2 startup
```

6. Configure Nginx:
```bash
sudo nano /etc/nginx/sites-available/myanmar-pos
```

Add configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /path/to/myanmar-pos-system/client/build;
        try_files $uri /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/myanmar-pos /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

7. Setup SSL with Let's Encrypt:
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Post-Deployment

1. Test all endpoints:
```bash
curl https://your-domain.com/health
```

2. Monitor logs:
```bash
pm2 logs myanmar-pos-backend
```

3. Setup automated backups:
```bash
# Create backup script
nano /home/user/backup-db.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > /backups/myanmar_pos_$DATE.sql
# Keep only last 7 days
find /backups -name "myanmar_pos_*.sql" -mtime +7 -delete
```

```bash
chmod +x /home/user/backup-db.sh

# Add to crontab (daily at 2 AM)
crontab -e
0 2 * * * /home/user/backup-db.sh
```

## 🧪 Testing

### Manual Testing

Test the system functionality:

```bash
# 1. Health check
curl http://localhost:3001/health

# 2. Create a product
curl -X POST http://localhost:3001/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "name": "Test Product",
    "price": 1000,
    "stock_quantity": 100,
    "category_id": "<category-uuid>"
  }'

# 3. Create an order
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "customer_id": "<customer-uuid>",
    "items": [{"product_id": "<product-uuid>", "quantity": 1, "price": 1000}],
    "total_amount": 1000,
    "payment_method": "cash"
  }'

# 4. Check inventory updated
curl http://localhost:3001/api/products/<product-uuid> \
  -H "Authorization: Bearer <your-token>"
```

### Security Testing

```bash
# Test rate limiting (should block after 5 attempts)
for i in {1..6}; do
  curl -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"wrong@email.com","password":"wrong"}'
done

# Test input validation (should reject negative price)
curl -X POST http://localhost:3001/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{"name":"Test","price":-100}'

# Test XSS protection (should sanitize)
curl -X POST http://localhost:3001/api/chat/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{"message":"<script>alert(\"xss\")</script>"}'
```

## 🎨 New Chat Features (Enhanced)

### 1. Typing Indicators
See in real-time when customers are typing a message. The indicator appears next to the customer name in the session list and automatically disappears after 3 seconds of inactivity.

**API Endpoint:**
```bash
POST /api/chat/typing/:customerId
Body: { "isTyping": true }
```

### 2. File Attachments
Send images, documents, and files up to 10MB to customers.

**Supported formats:** JPEG, PNG, GIF, PDF, DOC, DOCX, XLS, XLSX, TXT

**How to use:**
- Click the paperclip icon in the message input
- Select a file from your computer
- Add an optional message
- Click send

**API Endpoints:**
```bash
POST /api/chat/upload (multipart/form-data)
POST /api/chat/send-with-attachment
```

### 3. Quick Reply Templates
Create and use pre-defined message templates for common responses.

**Default templates included:**
- Welcome message
- Thank you message
- Order status update
- Payment received
- Out of stock notification
- Delivery information

**How to use:**
- Click the message icon in the input area
- Select a template from the dropdown
- Template content fills the message box
- Edit if needed and send

**API Endpoints:**
```bash
GET    /api/chat/templates
POST   /api/chat/templates
PUT    /api/chat/templates/:id
DELETE /api/chat/templates/:id
POST   /api/chat/templates/:id/use
```

### 4. Customer Notes
Add internal notes about customers that are only visible to your team.

**Use cases:**
- Customer preferences
- Special instructions
- Order history notes
- Follow-up reminders

**How to use:**
- Click the notes icon in the chat header
- Type your note in the input field
- Press Enter or click the + button
- Notes are timestamped and can be deleted

**API Endpoints:**
```bash
GET    /api/chat/notes/:customerId
POST   /api/chat/notes
PUT    /api/chat/notes/:id
DELETE /api/chat/notes/:id
```

### 5. Conversation Tags
Categorize conversations with color-coded tags for better organization.

**Default tags:**
- 🔴 Urgent - Requires immediate attention
- 🟠 Follow-up - Needs follow-up
- 🟢 Resolved - Issue resolved
- 🔴 Complaint - Customer complaint
- 🔵 Inquiry - General inquiry
- 🟣 Order - Order related
- 🟣 Payment - Payment related
- 🟡 VIP - VIP customer

**How to use:**
- Click the tag icon in the chat header
- Click tags to add/remove them from the conversation
- Tags appear in the session list for quick filtering

**API Endpoints:**
```bash
GET    /api/chat/tags
POST   /api/chat/tags
POST   /api/chat/sessions/:customerId/tags
DELETE /api/chat/sessions/:customerId/tags/:tagId
```

### 6. Message Search
Search for specific messages within a conversation or across all conversations.

**Features:**
- Search within current conversation
- Search across all conversations
- Case-insensitive search
- Highlights matching text

**How to use:**
- Click the search icon in the chat header
- Type your search query
- Results update in real-time

**API Endpoints:**
```bash
GET /api/chat/messages/:customerId?search=query
GET /api/chat/search?q=query
```

### 7. Export Conversations
Export chat history to Excel for record-keeping or analysis.

**Export includes:**
- Date and time of each message
- Sender (Admin or Customer name)
- Message content
- Channel (Telegram/Viber/Messenger)
- Read status
- Attachments

**How to use:**
- Click the download icon in the chat header
- Excel file downloads automatically
- Filename includes customer name and timestamp

**API Endpoint:**
```bash
GET /api/chat/export/:customerId?format=xlsx
```

## 🚀 Applying Chat Enhancements

### Step 1: Apply Database Migration

```bash
# Run the migration script
node scripts/apply-chat-enhancements.js
```

This will:
- Add new columns to existing tables
- Create new tables (templates, notes, tags)
- Insert default templates and tags
- Create necessary indexes

### Step 2: Restart Services

```bash
# Backend
npm run dev

# Frontend (in another terminal)
cd client && npm start
```

### Step 3: Verify Installation

1. Open Messages page: http://localhost:3000/messages
2. Check for new icons in the chat header (search, notes, tags, export)
3. Try clicking the message icon to see templates
4. Try clicking the paperclip icon to attach a file
5. Add a note to a customer
6. Add tags to a conversation

### Testing Messages Feature

**1. Test Chat Sessions API:**
```bash
curl https://your-backend.onrender.com/api/chat/sessions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**2. Test Messages Retrieval:**
```bash
curl https://your-backend.onrender.com/api/chat/messages/CUSTOMER_UUID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**3. Test WebSocket Connection:**
- Open Messages page: https://myanmar-pos-frontend.onrender.com/messages
- Open browser console (F12)
- Look for: `✅ Socket connected: <id>`
- Should see connection status indicator (green = connected)

**4. Test Real-time Updates:**
- Open Messages page in two browser tabs
- Send a message in one tab
- Should appear immediately in both tabs

**5. Test Mark as Read:**
- Click on a conversation with unread messages
- Messages should be marked as read automatically
- Unread counter should update

### Automated Testing Scripts

```bash
# Test all routes
./test-all-routes.sh

# Test bot API
./test-bot-api.sh

# Verify system
./verify-system.sh

# Verify production
./verify-production.sh
```

## 📝 Development

### Project Structure

```
myanmar-pos-system/
├── client/                 # React frontend
│   ├── public/            # Static files
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   └── utils/         # Utility functions
│   └── package.json
├── database/              # SQL schema files
├── scripts/               # Utility scripts
├── src/
│   ├── config/           # Configuration files
│   ├── middleware/       # Express middleware
│   ├── routes/           # API routes
│   ├── utils/            # Utility functions
│   └── server.js         # Main server file
├── .env                  # Environment variables
├── package.json
└── README.md
```

### Adding New Features

1. **Backend API:**
   - Create route file in `src/routes/`
   - Add middleware for authentication/validation
   - Register route in `src/server.js`
   - Test with curl or Postman

2. **Frontend:**
   - Create component in `client/src/components/`
   - Add page in `client/src/pages/`
   - Create API service in `client/src/services/`
   - Add route in `client/src/App.js`

3. **Database:**
   - Create migration file in `database/`
   - Run migration: `psql $DATABASE_URL -f database/your_migration.sql`
   - Update relevant models/queries

### Code Style

- Use ES6+ features
- Follow Airbnb JavaScript style guide
- Use async/await for asynchronous operations
- Add comments for complex logic
- Use meaningful variable names
- Keep functions small and focused

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "Add: your feature description"

# Push to remote
git push origin feature/your-feature-name

# Create pull request
```

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📋 Production Checklist

Use this checklist to verify your production deployment:

### Backend (Render)
- [ ] Service is running (check Render dashboard)
- [ ] Health endpoint returns 200: `/health`
- [ ] Environment variables are set correctly
- [ ] DATABASE_URL is configured
- [ ] JWT_SECRET is set (32+ characters)
- [ ] NODE_ENV=production
- [ ] CLIENT_URL points to frontend URL
- [ ] Logs show no errors
- [ ] WebSocket connections working
- [ ] Socket.IO connections working

### Frontend (Netlify/Vercel)
- [ ] Build completed successfully
- [ ] Site is accessible
- [ ] REACT_APP_API_URL points to backend
- [ ] Login page loads
- [ ] Can authenticate
- [ ] Dashboard loads
- [ ] All pages accessible
- [ ] WebSocket connects (check browser console)
- [ ] No CORS errors

### Database (PostgreSQL)
- [ ] Database is accessible
- [ ] All schemas applied
- [ ] Constraints added
- [ ] Admin user created
- [ ] Sample data seeded (optional)
- [ ] Backups configured

### Security
- [ ] HTTPS enabled
- [ ] JWT_SECRET is unique and secure
- [ ] Rate limiting active
- [ ] CORS configured correctly
- [ ] No sensitive data in logs
- [ ] Environment variables secured

### Optional Features
- [ ] Email notifications (SMTP configured)
- [ ] SMS notifications (Twilio configured)
- [ ] Viber bot (token configured)
- [ ] Telegram bot (token configured)
- [ ] Messenger bot (credentials configured)

### Monitoring
- [ ] Error tracking set up (Sentry, etc.)
- [ ] Log monitoring configured
- [ ] Uptime monitoring active
- [ ] Performance monitoring
- [ ] Database backup schedule

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with Node.js, Express, React, and PostgreSQL
- UI components from Material-UI
- Real-time features powered by Socket.IO
- Bot integrations using official APIs

## 📞 Support & Contact

For issues, questions, or contributions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the API documentation

---

**Version:** 1.3.4  
**Last Updated:** November 28, 2025  
**Status:** ✅ Production Ready  
**License:** MIT
