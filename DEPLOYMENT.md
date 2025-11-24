# 🚀 Deployment Guide - Myanmar POS System

## Quick Deploy to Render

### Prerequisites
1. GitHub account with repository access
2. Render account (free tier available)
3. PostgreSQL database (Render provides free tier)

---

## Option 1: Deploy with render.yaml (Recommended)

### Step 1: Make Repository Public (if private)

```bash
# Go to GitHub repository settings
# Settings → General → Danger Zone → Change visibility → Make public
```

### Step 2: Create PostgreSQL Database on Render

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"PostgreSQL"**
3. Configure:
   - Name: `myanmar-pos-db`
   - Database: `myanmar_pos`
   - User: `myanmar_pos_user`
   - Region: `Singapore` (or closest to you)
   - Plan: `Free` (or `Starter` for production)
4. Click **"Create Database"**
5. Wait for database to be ready
6. Copy the **Internal Database URL** (starts with `postgres://`)

### Step 3: Deploy Backend

1. Go to Render Dashboard
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository: `EthanVT97/botpos`
4. Configure:
   - **Name**: `myanmar-pos-backend`
   - **Region**: `Singapore`
   - **Branch**: `main`
   - **Root Directory**: Leave empty
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`

5. Add Environment Variables:
   ```
   NODE_ENV=production
   PORT=3001
   DATABASE_URL=<paste_internal_database_url>
   CLIENT_URL=https://myanmar-pos-frontend.onrender.com
   JWT_SECRET=<generate_random_string>
   
   # Optional - Bot tokens
   TELEGRAM_BOT_TOKEN=your_token
   VIBER_BOT_TOKEN=your_token
   MESSENGER_PAGE_ACCESS_TOKEN=your_token
   MESSENGER_VERIFY_TOKEN=your_token
   
   # Optional - Email
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   
   # Optional - SMS
   TWILIO_ACCOUNT_SID=your_sid
   TWILIO_AUTH_TOKEN=your_token
   TWILIO_PHONE_NUMBER=+1234567890
   ```

6. Click **"Create Web Service"**
7. Wait for deployment to complete

### Step 4: Setup Database Schema

```bash
# Connect to your database
psql "<external_database_url>"

# Run schemas
\i database/schema.sql
\i database/chat_schema.sql
\i database/bot_flow_schema.sql
\i database/uom_schema.sql
\i database/multi_store_schema.sql
\i database/analytics_schema.sql
\i database/auth_schema.sql

# Exit
\q
```

Or use the setup script:
```bash
export DATABASE_URL="<external_database_url>"
./scripts/run-schemas.js
```

### Step 5: Deploy Frontend

1. Go to Render Dashboard
2. Click **"New +"** → **"Static Site"**
3. Connect your GitHub repository: `EthanVT97/botpos`
4. Configure:
   - **Name**: `myanmar-pos-frontend`
   - **Region**: `Singapore`
   - **Branch**: `main`
   - **Root Directory**: Leave empty
   - **Build Command**: `cd client && npm install && npm run build`
   - **Publish Directory**: `client/build`

5. Add Environment Variables:
   ```
   REACT_APP_API_URL=https://myanmar-pos-backend.onrender.com
   ```

6. Click **"Create Static Site"**
7. Wait for deployment to complete

### Step 6: Update Backend CLIENT_URL

1. Go to your backend service on Render
2. Go to **Environment** tab
3. Update `CLIENT_URL` to your frontend URL:
   ```
   CLIENT_URL=https://myanmar-pos-frontend.onrender.com
   ```
4. Save changes (service will redeploy)

### Step 7: Test Deployment

1. Visit your frontend URL: `https://myanmar-pos-frontend.onrender.com`
2. Check backend health: `https://myanmar-pos-backend.onrender.com/health`
3. Test API: `https://myanmar-pos-backend.onrender.com/api/products`

---

## Option 2: Manual Deployment

### Backend Deployment

```bash
# On your server
git clone https://github.com/EthanVT97/botpos.git
cd botpos

# Install dependencies
npm install

# Setup environment
cp .env.example .env
nano .env  # Edit with your values

# Setup database
export DATABASE_URL="your_database_url"
psql "$DATABASE_URL" -f database/schema.sql
psql "$DATABASE_URL" -f database/chat_schema.sql
psql "$DATABASE_URL" -f database/bot_flow_schema.sql
psql "$DATABASE_URL" -f database/uom_schema.sql
psql "$DATABASE_URL" -f database/multi_store_schema.sql

# Start with PM2
npm install -g pm2
pm2 start src/server.js --name myanmar-pos
pm2 save
pm2 startup
```

### Frontend Deployment

```bash
# Build frontend
cd client
npm install
npm run build

# Serve with nginx
sudo cp -r build/* /var/www/html/

# Or serve with serve
npm install -g serve
serve -s build -p 3000
```

---

## Option 3: Docker Deployment

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## Troubleshooting

### Issue: "Client directory not found"

**Solution:**
```bash
# Verify directory structure
ls -la
# Should see: client/ folder

# If missing, check git
git status
git pull origin main
```

### Issue: "Build failed"

**Solution:**
```bash
# Test build locally
cd client
npm install
npm run build

# Check for errors
# Fix any issues
# Commit and push
git add .
git commit -m "fix: build issues"
git push origin main
```

### Issue: "Database connection failed"

**Solution:**
1. Check DATABASE_URL is correct
2. Verify database is running
3. Check SSL settings:
   ```javascript
   // In src/config/database.js
   ssl: process.env.NODE_ENV === 'production' ? {
     rejectUnauthorized: false
   } : false
   ```

### Issue: "CORS errors"

**Solution:**
1. Update CLIENT_URL in backend environment variables
2. Restart backend service
3. Clear browser cache

---

## Post-Deployment Checklist

- [ ] Backend health check returns OK
- [ ] Frontend loads without errors
- [ ] Can create products
- [ ] Can create orders
- [ ] Can create stores
- [ ] Chat works (if bots configured)
- [ ] Database has all tables
- [ ] Environment variables are set
- [ ] SSL/HTTPS is working

---

## Monitoring

### Render Dashboard
- View logs in real-time
- Monitor resource usage
- Check deployment history
- View metrics

### Health Checks
```bash
# Backend health
curl https://your-backend.onrender.com/health

# Should return:
{
  "status": "OK",
  "message": "Myanmar POS System is running",
  "database": "connected",
  "websocket": "active"
}
```

---

## Scaling

### Free Tier Limitations
- Backend: Spins down after 15 minutes of inactivity
- Database: 1GB storage, 97 hours/month
- Static Site: 100GB bandwidth/month

### Upgrade Options
- **Starter Plan** ($7/month): Always on, more resources
- **Standard Plan** ($25/month): Better performance
- **Pro Plan** ($85/month): High performance

---

## Custom Domain

1. Go to your service on Render
2. Click **"Settings"** → **"Custom Domain"**
3. Add your domain: `pos.yourdomain.com`
4. Update DNS records:
   ```
   Type: CNAME
   Name: pos
   Value: your-service.onrender.com
   ```
5. Wait for DNS propagation (up to 48 hours)

---

## Backup Strategy

### Database Backups
```bash
# Manual backup
pg_dump "$DATABASE_URL" > backup.sql

# Restore
psql "$DATABASE_URL" < backup.sql
```

### Automated Backups
- Render Pro plan includes automated backups
- Or use cron job:
  ```bash
  0 2 * * * pg_dump "$DATABASE_URL" > /backups/backup-$(date +\%Y\%m\%d).sql
  ```

---

## Support

### Render Support
- Documentation: https://render.com/docs
- Community: https://community.render.com
- Status: https://status.render.com

### Project Support
- GitHub Issues: https://github.com/EthanVT97/botpos/issues
- Check README.md for troubleshooting

---

**Deployment complete! Your Myanmar POS System is now live! 🎉**
