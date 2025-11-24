# 🚀 Deployment Guide - Myanmar POS System

## Production Deployment on Render + Netlify

---

## 📋 Prerequisites

- GitHub account
- Render account (for backend)
- Netlify account (for frontend)
- PostgreSQL database (Render provides free tier)

---

## 🔧 Backend Deployment (Render)

### Step 1: Prepare Database

1. **Create PostgreSQL Database on Render**
   - Go to Render Dashboard
   - Click "New +" → "PostgreSQL"
   - Choose free tier
   - Copy the **External Database URL**

### Step 2: Deploy Backend

1. **Connect GitHub Repository**
   - Go to Render Dashboard
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository

2. **Configure Build Settings**
   ```
   Name: myanmar-pos-backend
   Environment: Node
   Region: Singapore (closest to Myanmar)
   Branch: main
   Build Command: npm install
   Start Command: npm start
   ```

3. **Set Environment Variables**
   ```bash
   DATABASE_URL=<your-postgres-external-url>
   NODE_ENV=production
   PORT=3001
   CLIENT_URL=https://your-frontend.netlify.app
   JWT_SECRET=<generate-strong-secret>
   ```

4. **Advanced Settings**
   - Auto-Deploy: Yes
   - Health Check Path: `/health`

### Step 3: Run Database Migrations

After deployment, use Render Shell:

```bash
# Access Render Shell from dashboard
node scripts/create-stores-table.js
node scripts/seed-database.js
```

---

## 🌐 Frontend Deployment (Netlify)

### Step 1: Prepare Frontend

1. **Create Production Environment File**
   ```bash
   # client/.env.production
   REACT_APP_API_URL=https://your-backend.onrender.com/api
   ```

2. **Test Build Locally**
   ```bash
   cd client
   npm run build
   ```

### Step 2: Deploy to Netlify

1. **Connect GitHub Repository**
   - Go to Netlify Dashboard
   - Click "Add new site" → "Import an existing project"
   - Connect GitHub
   - Select repository

2. **Configure Build Settings**
   ```
   Base directory: client
   Build command: npm run build
   Publish directory: client/build
   ```

3. **Set Environment Variables**
   ```bash
   REACT_APP_API_URL=https://your-backend.onrender.com/api
   ```

4. **Configure Redirects**
   
   Create `client/public/_redirects`:
   ```
   /*    /index.html   200
   ```

### Step 3: Update Backend CORS

Update backend `.env` on Render:
```bash
CLIENT_URL=https://your-site.netlify.app
```

---

## 🔌 WebSocket Configuration

### Dual WebSocket Support

The system includes **two WebSocket implementations**:

1. **Socket.IO** (`/socket.io/`) - For real-time features
   - Used by: Chat, Notifications, Real-time updates
   - Path: `/socket.io/`
   - Auto-upgrades to WebSocket
   - Fallback to polling

2. **Native WebSocket** (`/ws`) - For Render compatibility
   - Direct WebSocket connection
   - Path: `/ws`
   - Heartbeat every 25 seconds
   - Auto-reconnect on disconnect

### Backend (Automatic)

Both WebSocket servers are configured for production:
- ✅ Socket.IO on `/socket.io/` path
- ✅ Native WebSocket on `/ws` path
- ✅ Heartbeat mechanism (25-30s intervals)
- ✅ Reconnection logic
- ✅ Works with Render's proxy
- ✅ SSL/TLS support (wss://)

### Frontend (Automatic)

The frontend automatically:
- ✅ Connects to correct backend URL
- ✅ Uses `wss://` in production
- ✅ Falls back to polling if needed
- ✅ Handles reconnections
- ✅ Shows connection status

### WebSocket URLs

**Development:**
```
Socket.IO: ws://localhost:3001/socket.io/
Native WS: ws://localhost:3001/ws
```

**Production:**
```
Socket.IO: wss://your-backend.onrender.com/socket.io/
Native WS: wss://your-backend.onrender.com/ws
```

**No additional configuration needed!**

---

## ✅ Verification Checklist

### Backend Health Check
```bash
curl https://your-backend.onrender.com/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "Myanmar POS System is running",
  "database": "connected",
  "websocket": "active"
}
```

### Frontend Access
1. Visit `https://your-site.netlify.app`
2. Should load login page
3. Check browser console for errors

### WebSocket Connection
1. Login to the system
2. Go to Messages page
3. Check connection indicator (should show 🟢 Connected)
4. Browser console should show: `✅ Socket connected`

### Database Connection
1. Login with: `admin@pos.com` / `admin123`
2. Dashboard should load with data
3. Check products, orders, etc.

---

## 🔐 Security Checklist

- [ ] Changed `JWT_SECRET` to strong random string
- [ ] Updated `CLIENT_URL` to production frontend URL
- [ ] Database uses SSL (Render does this automatically)
- [ ] CORS configured correctly
- [ ] Environment variables set on Render
- [ ] `.env` files not committed to Git

---

## 🐛 Troubleshooting

### Backend Won't Start

**Check Logs:**
```bash
# Render Dashboard → Your Service → Logs
```

**Common Issues:**
- Missing environment variables
- Database connection failed
- Port already in use (use PORT from Render)

### Frontend Can't Connect

**Check:**
1. `REACT_APP_API_URL` is correct
2. Backend is running (check health endpoint)
3. CORS is configured with correct frontend URL
4. No mixed content errors (http/https)

### WebSocket Not Connecting

**Check:**
1. Backend logs show WebSocket server active
2. Frontend console shows connection attempts
3. No firewall blocking WebSocket
4. Render service is running (not sleeping)

**Debug:**
```javascript
// In browser console
localStorage.debug = 'socket.io-client:*';
// Reload page to see detailed logs
```

### Database Connection Timeout

**Solutions:**
1. Check `DATABASE_URL` is correct
2. Verify database is running on Render
3. Check SSL settings (Render requires SSL)
4. Increase connection timeout in code

---

## 📊 Performance Tips

### Backend (Render)

1. **Keep Service Awake**
   - Free tier sleeps after 15 min inactivity
   - Use UptimeRobot or similar to ping `/health`
   - Or upgrade to paid tier

2. **Database Connection Pooling**
   - Already configured (max 20 connections)
   - Adjust if needed in `src/config/database.js`

3. **Enable Caching**
   - API responses cached (already implemented)
   - Consider Redis for session storage

### Frontend (Netlify)

1. **Build Optimization**
   - Already using production build
   - Code splitting enabled
   - Lazy loading implemented

2. **CDN**
   - Netlify provides global CDN automatically
   - Assets cached at edge locations

3. **Compression**
   - Netlify compresses assets automatically
   - Gzip and Brotli enabled

---

## 🔄 Continuous Deployment

### Auto-Deploy Setup

**Backend (Render):**
- ✅ Auto-deploys on push to `main` branch
- ✅ Build logs available in dashboard
- ✅ Rollback available if needed

**Frontend (Netlify):**
- ✅ Auto-deploys on push to `main` branch
- ✅ Deploy previews for pull requests
- ✅ Instant rollback available

### Manual Deploy

**Backend:**
```bash
# Push to GitHub
git push origin main
# Render auto-deploys
```

**Frontend:**
```bash
# Push to GitHub
git push origin main
# Netlify auto-deploys
```

---

## 💰 Cost Estimate

### Free Tier (Recommended for Testing)

**Render:**
- PostgreSQL: Free (1GB storage)
- Web Service: Free (750 hours/month)
- Limitations: Sleeps after 15 min inactivity

**Netlify:**
- Hosting: Free (100GB bandwidth/month)
- Build minutes: 300 min/month
- No limitations for static sites

**Total: $0/month**

### Paid Tier (Recommended for Production)

**Render:**
- PostgreSQL: $7/month (10GB storage)
- Web Service: $7/month (always on)

**Netlify:**
- Pro: $19/month (unlimited bandwidth)

**Total: ~$33/month**

---

## 📝 Post-Deployment Tasks

1. **Test All Features**
   - [ ] Login/Logout
   - [ ] Dashboard loads
   - [ ] Products CRUD
   - [ ] Orders creation
   - [ ] Messages/Chat
   - [ ] Reports generation
   - [ ] Export functionality

2. **Monitor Performance**
   - [ ] Check response times
   - [ ] Monitor error rates
   - [ ] Watch database usage
   - [ ] Check WebSocket connections

3. **Setup Monitoring**
   - [ ] UptimeRobot for uptime monitoring
   - [ ] Sentry for error tracking (optional)
   - [ ] Google Analytics (optional)

4. **Backup Strategy**
   - [ ] Enable Render database backups
   - [ ] Export data regularly
   - [ ] Document restore procedure

---

## 🎉 Success!

Your Myanmar POS System is now deployed and running in production!

**Access URLs:**
- Frontend: `https://your-site.netlify.app`
- Backend: `https://your-backend.onrender.com`
- Health: `https://your-backend.onrender.com/health`

**Default Login:**
- Email: `admin@pos.com`
- Password: `admin123`

**Remember to:**
- Change default password
- Update JWT secret
- Configure email/SMS if needed
- Setup bot integrations if needed

---

**Need Help?** Check the main README.md or create an issue on GitHub.
