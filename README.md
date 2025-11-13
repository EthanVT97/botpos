# Myanmar Business POS System 🇲🇲

A comprehensive Point of Sale system with multi-channel bot integrations (Viber, Telegram, Messenger) built with Node.js, React, and Supabase. Designed specifically for Myanmar businesses with full bilingual support.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/react-18.2.0-blue)](https://reactjs.org/)

## ✨ Features

### 🆕 NEW! Auto Bot Configuration (v1.1.0)
- 🎯 **One-Click Setup** - Configure bots from Settings page without code
- ✅ **Token Validation** - Test tokens before applying
- 🔄 **Auto Webhooks** - Automatic webhook configuration
- 📊 **Real-time Status** - Monitor bot connections live
- 🔒 **Secure** - Tokens stored safely in database

### Core Functionality
- 📦 **Product Management** - Full CRUD with Myanmar language support, SKU/barcode tracking
- 👥 **Customer Management** - Customer profiles with multi-channel integration
- 🛒 **Point of Sale** - Real-time cart, multiple payment methods (Cash, KPay, Wave Pay, Card)
- 📋 **Order Processing** - Order tracking with automatic stock updates
- 📊 **Inventory Management** - Stock movements, low stock alerts
- 📈 **Reports & Analytics** - Daily/monthly sales, top products, profit calculations
- ⚙️ **Settings** - Configurable store settings, tax rates, thresholds

### Bot Integrations
- 📱 **Viber Bot** - Customer interactions in Myanmar language
- 💬 **Telegram Bot** - Product browsing and order tracking
- 💌 **Messenger Bot** - Facebook Messenger integration
- 🔧 **Easy Setup** - Configure bots directly from Settings page with automatic webhook setup

### Technical Features
- 🌐 **Bilingual UI** - Full English/Myanmar language support
- 🎨 **Responsive Design** - Works on desktop, tablet, and mobile
- 🔒 **Secure** - Environment-based configuration, SQL injection prevention
- 🚀 **Fast** - Optimized queries, indexed database, efficient React components
- 📦 **Docker Ready** - Full containerization support

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Bot Libraries**: node-telegram-bot-api, viber-bot, Messenger API

### Frontend
- **Framework**: React 18
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Charts**: Recharts

### DevOps
- **Containerization**: Docker & Docker Compose
- **Process Manager**: PM2
- **Web Server**: Nginx

## 🚀 Quick Start

**New to the project?** Check out [GETTING_STARTED.md](GETTING_STARTED.md) for a step-by-step guide!

### Automated Setup (Recommended)
```bash
# Run setup script
bash scripts/setup.sh

# Edit .env with your credentials
nano .env

# Seed database with sample data
npm run seed

# Start both backend and frontend
bash scripts/dev.sh
```

**That's it!** Open http://localhost:3000 in your browser.

### Manual Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
cd client && npm install && cd ..
```

3. Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

4. Set up Supabase:
   - Create a new Supabase project
   - Run the SQL schema from `supabase/schema.sql`
   - Copy your Supabase URL and keys to `.env`

5. Seed database (optional):
```bash
npm run seed
```

6. Start development servers:

Terminal 1 - Backend:
```bash
npm run dev
```

Terminal 2 - Frontend:
```bash
cd client && npm start
```

The backend runs on `http://localhost:3001`
The frontend runs on `http://localhost:3000`

## Production Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions for:
- Heroku
- DigitalOcean
- AWS
- Docker

### Quick Docker Deploy
```bash
docker-compose up -d
```

## API Routes

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/products/search/:query` - Search products

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Customers
- `GET /api/customers` - Get all customers
- `GET /api/customers/:id` - Get customer by ID
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer
- `GET /api/customers/search/:query` - Search customers

### Orders
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get order by ID
- `POST /api/orders` - Create order
- `PATCH /api/orders/:id/status` - Update order status
- `DELETE /api/orders/:id` - Delete order

### Inventory
- `GET /api/inventory/movements` - Get inventory movements
- `POST /api/inventory/movements` - Add inventory movement
- `GET /api/inventory/low-stock` - Get low stock products

### Sales & Reports
- `GET /api/sales/summary` - Get sales summary
- `GET /api/sales/top-products` - Get top selling products
- `GET /api/reports/daily-sales` - Daily sales report
- `GET /api/reports/monthly-sales` - Monthly sales report
- `GET /api/reports/product-performance` - Product performance report

### Bot Webhooks
- `POST /webhooks/viber` - Viber bot webhook
- `POST /webhooks/telegram` - Telegram bot webhook
- `GET/POST /webhooks/messenger` - Messenger bot webhook

## 📱 Bot Commands

### Viber & Telegram
- `/products` - View products (ကုန်ပစ္စည်းများကြည့်ရန်)
- `/orders` - View orders (မှာယူမှုများကြည့်ရန်)
- `/help` - Get help (အကူအညီ)

### Messenger
- Type "products" - View products
- Type "orders" - View your orders

## 📚 Documentation

- **[Setup Guide](SETUP.md)** - Detailed installation and configuration
- **[Bot Setup Guide](BOT_SETUP_GUIDE.md)** - Easy bot configuration with auto-webhook setup
- **[Deployment Guide](DEPLOYMENT.md)** - Production deployment for Heroku, DigitalOcean, AWS, Docker
- **[API Testing](API_TESTING.md)** - Complete API endpoint testing guide
- **[Quick Reference](QUICK_REFERENCE.md)** - Commands, queries, and troubleshooting
- **[Contributing](CONTRIBUTING.md)** - How to contribute to the project
- **[Project Summary](PROJECT_SUMMARY.md)** - Complete project overview
- **[Changelog](CHANGELOG.md)** - Version history and updates

## Database Schema

- **categories** - Product categories
- **products** - Product catalog
- **customers** - Customer information
- **orders** - Order records
- **order_items** - Order line items
- **inventory_movements** - Stock movements
- **users** - System users
- **settings** - System settings

## Project Structure

```
myanmar-pos-system/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── api/           # API client
│   │   ├── components/    # Reusable components
│   │   ├── hooks/         # Custom hooks
│   │   ├── pages/         # Page components
│   │   └── App.js
│   └── package.json
├── src/                   # Node.js backend
│   ├── config/           # Configuration files
│   ├── routes/           # API routes
│   │   └── webhooks/     # Bot webhooks
│   ├── utils/            # Utility functions
│   └── server.js
├── supabase/             # Database schema
├── scripts/              # Setup and utility scripts
├── SETUP.md             # Setup guide
├── DEPLOYMENT.md        # Deployment guide
└── package.json
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Documentation

- [Features Overview](FEATURES.md) - Complete feature list
- [Setup Guide](SETUP.md) - Detailed setup instructions
- [Bot Setup Guide](BOT_SETUP_GUIDE.md) - Easy bot configuration
- [Deployment Guide](DEPLOYMENT.md) - Production deployment
- [API Documentation](README.md#api-routes) - API endpoints
- [Contributing Guide](CONTRIBUTING.md) - How to contribute
- [Changelog](CHANGELOG.md) - Version history

## Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation
- Review Supabase logs for database errors
- Check browser console for frontend errors

## Roadmap

- [ ] User authentication and authorization
- [ ] Role-based access control
- [ ] Receipt printing
- [ ] Barcode scanning
- [ ] Mobile app
- [ ] Advanced analytics
- [ ] Multi-store support
- [ ] Email/SMS notifications

## License

MIT License - see [LICENSE](LICENSE) file for details
