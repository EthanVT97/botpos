# Quick Reference Guide

## Common Commands

### Development
```bash
# Start backend only
npm run dev

# Start frontend only
cd client && npm start

# Start both (automated)
bash scripts/dev.sh

# Seed database
npm run seed
```

### Production
```bash
# Build frontend
cd client && npm run build

# Start backend
npm start

# Docker
docker-compose up -d
```

## API Endpoints Quick Reference

### Products
- `GET /api/products` - List all products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/products/search/:query` - Search products

### Orders
- `GET /api/orders` - List all orders
- `POST /api/orders` - Create order
- `PATCH /api/orders/:id/status` - Update status
- `GET /api/orders/:id` - Get order details

### Inventory
- `GET /api/inventory/movements` - List movements
- `POST /api/inventory/movements` - Add movement
- `GET /api/inventory/low-stock` - Low stock alert

### Reports
- `GET /api/reports/daily-sales?date=YYYY-MM-DD`
- `GET /api/reports/monthly-sales?month=YYYY-MM`
- `GET /api/reports/product-performance`

## Database Quick Reference

### Tables
- `categories` - Product categories
- `products` - Product catalog
- `customers` - Customer information
- `orders` - Order records
- `order_items` - Order line items
- `inventory_movements` - Stock movements
- `users` - System users
- `settings` - System settings

### Common Queries

```sql
-- Get low stock products
SELECT * FROM products WHERE stock_quantity <= 10;

-- Get today's sales
SELECT * FROM orders 
WHERE created_at >= CURRENT_DATE 
AND status = 'completed';

-- Get top selling products
SELECT p.name, SUM(oi.quantity) as total_sold
FROM order_items oi
JOIN products p ON oi.product_id = p.id
GROUP BY p.id, p.name
ORDER BY total_sold DESC
LIMIT 10;
```

## Bot Commands

### Viber & Telegram
- `/products` - View products
- `/orders` - View your orders
- `/help` - Get help

### Messenger
- Type "products" - View products
- Type "orders" - View your orders

## Environment Variables

### Required
```env
SUPABASE_URL=your_url
SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_KEY=your_key
```

### Optional (Bots)
```env
VIBER_BOT_TOKEN=your_token
TELEGRAM_BOT_TOKEN=your_token
MESSENGER_PAGE_ACCESS_TOKEN=your_token
```

## Troubleshooting

### Backend won't start
```bash
# Check port availability
lsof -i :3001

# Check environment variables
cat .env

# Check logs
npm run dev
```

### Frontend won't connect
```bash
# Check proxy in client/package.json
# Should be: "proxy": "http://localhost:3001"

# Clear cache
cd client
rm -rf node_modules package-lock.json
npm install
```

### Database errors
```bash
# Check Supabase connection
curl $SUPABASE_URL/rest/v1/

# Verify schema
# Run supabase/schema.sql in Supabase SQL Editor
```

### Bot webhooks not working
```bash
# Test webhook URL
curl -X POST https://your-domain.com/webhooks/telegram

# Check bot token
# Verify in .env file

# Check server logs
npm run dev
```

## Keyboard Shortcuts (Frontend)

- `Ctrl/Cmd + K` - Quick search (if implemented)
- `Ctrl/Cmd + S` - Save form (browser default)
- `Esc` - Close modal

## Default Settings

- **Port**: 3001 (backend), 3000 (frontend)
- **Currency**: MMK (Kyat)
- **Tax Rate**: 0%
- **Low Stock Threshold**: 10 units
- **Payment Methods**: Cash, KPay, Wave Pay, Card

## File Locations

- **Backend Code**: `src/`
- **Frontend Code**: `client/src/`
- **Database Schema**: `supabase/schema.sql`
- **Environment Config**: `.env`
- **API Client**: `client/src/api/api.js`
- **Routes**: `src/routes/`

## Useful Links

- Supabase Dashboard: https://app.supabase.com
- Viber Admin: https://partners.viber.com
- Telegram BotFather: https://t.me/botfather
- Facebook Developers: https://developers.facebook.com

## Performance Tips

1. Enable database indexes (already in schema)
2. Use connection pooling in Supabase
3. Cache static assets
4. Enable gzip compression
5. Use CDN for frontend
6. Optimize images
7. Lazy load components
8. Use pagination for large lists

## Security Checklist

- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] CORS configured
- [ ] SQL injection prevention (using Supabase)
- [ ] XSS prevention (React default)
- [ ] Rate limiting (implement if needed)
- [ ] Input validation
- [ ] Error handling

## Backup Commands

```bash
# Backup database (Supabase provides automatic backups)
# Manual backup via Supabase dashboard

# Backup files
tar -czf backup_$(date +%Y%m%d).tar.gz .

# Restore from backup
tar -xzf backup_YYYYMMDD.tar.gz
```

## Monitoring

```bash
# Check server health
curl http://localhost:3001/health

# Monitor logs (PM2)
pm2 logs myanmar-pos-api

# Monitor logs (Docker)
docker-compose logs -f

# Check disk space
df -h

# Check memory
free -m
```
