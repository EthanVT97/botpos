# System Architecture

## Overview

Myanmar POS System follows a modern three-tier architecture with bot integrations.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              React Frontend (Port 3000)                   │  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ │  │
│  │  │Dashboard│ │  POS   │ │Products│ │ Orders │ │Reports │ │  │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ │  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐           │  │
│  │  │Customer│ │Category│ │Inventory│ │Settings│           │  │
│  │  └────────┘ └────────┘ └────────┘ └────────┘           │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/REST API
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           Node.js + Express (Port 3001)                   │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │                  API Routes                         │  │  │
│  │  │  /api/products  /api/orders  /api/customers       │  │  │
│  │  │  /api/inventory /api/reports /api/settings        │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │              Bot Webhooks                          │  │  │
│  │  │  /webhooks/viber  /webhooks/telegram              │  │  │
│  │  │  /webhooks/messenger                              │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │              Middleware                            │  │  │
│  │  │  CORS  Body Parser  Error Handler                 │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Supabase Client
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Supabase (PostgreSQL)                        │  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐           │  │
│  │  │Products│ │ Orders │ │Customer│ │Category│           │  │
│  │  └────────┘ └────────┘ └────────┘ └────────┘           │  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐           │  │
│  │  │OrderItem│ │Inventory│ │ Users  │ │Settings│           │  │
│  │  └────────┘ └────────┘ └────────┘ └────────┘           │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL INTEGRATIONS                         │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐             │
│  │  Viber   │      │ Telegram │      │Messenger │             │
│  │   Bot    │      │   Bot    │      │   Bot    │             │
│  └──────────┘      └──────────┘      └──────────┘             │
│       │                  │                  │                   │
│       └──────────────────┴──────────────────┘                   │
│                          │                                       │
│                          ▼                                       │
│                   Bot Webhooks                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Component Details

### Frontend (React)

**Technology**: React 18, React Router v6, Axios

**Components**:
- `Layout.js` - Main layout with sidebar navigation
- `Dashboard.js` - Sales overview and metrics
- `POS.js` - Point of sale interface
- `Products.js` - Product management
- `Orders.js` - Order management
- `Customers.js` - Customer management
- `Categories.js` - Category management
- `Inventory.js` - Stock management
- `Reports.js` - Analytics and reports
- `Settings.js` - System configuration

**Features**:
- Responsive design
- Bilingual UI (English/Myanmar)
- Real-time updates
- Modal-based forms
- Search and filtering

### Backend (Node.js + Express)

**Technology**: Node.js 18+, Express.js, Supabase Client

**Routes**:
- `/api/products` - Product CRUD operations
- `/api/categories` - Category management
- `/api/customers` - Customer management
- `/api/orders` - Order processing
- `/api/inventory` - Stock movements
- `/api/sales` - Sales data
- `/api/reports` - Analytics
- `/api/settings` - Configuration
- `/api/users` - User management

**Webhooks**:
- `/webhooks/viber` - Viber bot integration
- `/webhooks/telegram` - Telegram bot integration
- `/webhooks/messenger` - Messenger bot integration

**Middleware**:
- CORS - Cross-origin resource sharing
- Body Parser - JSON/URL-encoded parsing
- Error Handler - Global error handling

### Database (Supabase/PostgreSQL)

**Tables**:
1. `categories` - Product categories
2. `products` - Product catalog
3. `customers` - Customer information
4. `orders` - Order records
5. `order_items` - Order line items
6. `inventory_movements` - Stock tracking
7. `users` - System users
8. `settings` - Configuration

**Features**:
- UUID primary keys
- Foreign key constraints
- Indexes on key columns
- Stored procedures
- Automatic timestamps

### Bot Integrations

**Viber Bot**:
- Customer auto-registration
- Product browsing
- Order viewing
- Myanmar language support

**Telegram Bot**:
- Command-based interface
- Product catalog
- Order history
- Emoji support

**Messenger Bot**:
- Natural language processing
- Product inquiries
- Order tracking
- Facebook integration

## Data Flow

### Order Creation Flow

```
User (Frontend)
    │
    ▼
Add products to cart
    │
    ▼
Click "Complete Order"
    │
    ▼
POST /api/orders
    │
    ▼
Backend validates data
    │
    ▼
Create order record
    │
    ▼
Create order items
    │
    ▼
Update product stock
    │
    ▼
Return success
    │
    ▼
Frontend shows confirmation
```

### Bot Interaction Flow

```
Customer (Viber/Telegram/Messenger)
    │
    ▼
Send message/command
    │
    ▼
Bot platform sends webhook
    │
    ▼
Backend receives webhook
    │
    ▼
Parse message
    │
    ▼
Find/create customer
    │
    ▼
Process command
    │
    ▼
Query database
    │
    ▼
Format response
    │
    ▼
Send to bot platform
    │
    ▼
Customer receives message
```

## Security Architecture

### Authentication (Future)
- JWT tokens
- Session management
- Role-based access control

### Data Security
- Environment variables for secrets
- HTTPS in production
- SQL injection prevention (Supabase)
- XSS prevention (React)
- CORS configuration

### API Security
- Input validation
- Error handling without exposing internals
- Rate limiting (recommended)

## Deployment Architecture

### Development
```
Local Machine
├── Backend (localhost:3001)
├── Frontend (localhost:3000)
└── Supabase (cloud)
```

### Production (Docker)
```
Docker Host
├── Backend Container (port 3001)
├── Frontend Container (port 80)
├── Nginx (reverse proxy)
└── Supabase (cloud)
```

### Production (Traditional)
```
Server
├── PM2 (backend process manager)
├── Nginx (web server + reverse proxy)
│   ├── Frontend (static files)
│   └── Backend (proxy to :3001)
└── Supabase (cloud)
```

## Scalability Considerations

### Horizontal Scaling
- Load balancer (Nginx, AWS ALB)
- Multiple backend instances
- Session management (Redis)
- Database connection pooling

### Vertical Scaling
- Increase server resources
- Optimize database queries
- Add database indexes
- Enable caching

### Database Scaling
- Read replicas
- Connection pooling
- Query optimization
- Partitioning (future)

## Performance Optimizations

### Frontend
- Code splitting
- Lazy loading
- Asset optimization
- Caching strategies

### Backend
- Efficient queries
- Database indexes
- Connection pooling
- Response compression

### Database
- Indexed columns
- Optimized queries
- Connection pooling
- Query caching

## Monitoring & Logging

### Application Monitoring
- Health check endpoint
- Error logging
- Performance metrics
- User analytics

### Infrastructure Monitoring
- Server resources (CPU, RAM, Disk)
- Network traffic
- Database performance
- Uptime monitoring

### Log Management
- Application logs (PM2/Docker)
- Database logs (Supabase)
- Web server logs (Nginx)
- Error tracking (future: Sentry)

## Backup & Recovery

### Database Backups
- Supabase automatic backups
- Manual backup scripts
- Point-in-time recovery

### Application Backups
- Code repository (Git)
- Configuration files
- Environment variables
- Static assets

## Technology Choices

### Why React?
- Component-based architecture
- Large ecosystem
- Great developer experience
- Strong community support

### Why Node.js + Express?
- JavaScript full-stack
- Fast development
- Large package ecosystem
- Good for real-time features

### Why Supabase?
- PostgreSQL (reliable, powerful)
- Built-in API
- Real-time subscriptions
- Authentication ready
- Automatic backups

### Why Docker?
- Consistent environments
- Easy deployment
- Scalability
- Isolation

## Future Architecture Enhancements

### Planned Improvements
- Microservices architecture
- Message queue (RabbitMQ/Redis)
- Caching layer (Redis)
- CDN integration
- GraphQL API
- WebSocket for real-time updates
- Mobile app (React Native)
- Offline-first architecture
