# Deployment Guide

This guide covers deploying the Myanmar POS System to production.

## Prerequisites

- Supabase project (production)
- Domain name (optional but recommended)
- SSL certificate (for HTTPS)

## Option 1: Deploy to Heroku

### Backend Deployment

1. Install Heroku CLI:
```bash
npm install -g heroku
```

2. Login to Heroku:
```bash
heroku login
```

3. Create a new Heroku app:
```bash
heroku create myanmar-pos-api
```

4. Set environment variables:
```bash
heroku config:set SUPABASE_URL=your_production_url
heroku config:set SUPABASE_ANON_KEY=your_anon_key
heroku config:set SUPABASE_SERVICE_KEY=your_service_key
heroku config:set NODE_ENV=production
heroku config:set VIBER_BOT_TOKEN=your_token
heroku config:set TELEGRAM_BOT_TOKEN=your_token
heroku config:set MESSENGER_PAGE_ACCESS_TOKEN=your_token
heroku config:set MESSENGER_VERIFY_TOKEN=your_verify_token
```

5. Deploy:
```bash
git push heroku main
```

6. Open your app:
```bash
heroku open
```

### Frontend Deployment (Vercel)

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Navigate to client directory:
```bash
cd client
```

3. Create `.env.production`:
```bash
REACT_APP_API_URL=https://myanmar-pos-api.herokuapp.com/api
```

4. Deploy:
```bash
vercel --prod
```

## Option 2: Deploy to DigitalOcean

### 1. Create a Droplet

- Choose Ubuntu 22.04 LTS
- Select appropriate size (minimum 1GB RAM)
- Add SSH key

### 2. Initial Server Setup

```bash
# SSH into your server
ssh root@your_server_ip

# Update system
apt update && apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install PM2
npm install -g pm2

# Install Nginx
apt install -y nginx

# Install Certbot for SSL
apt install -y certbot python3-certbot-nginx
```

### 3. Deploy Backend

```bash
# Clone repository
cd /var/www
git clone your_repository_url myanmar-pos
cd myanmar-pos

# Install dependencies
npm install

# Create .env file
nano .env
# Add your environment variables

# Start with PM2
pm2 start src/server.js --name myanmar-pos-api
pm2 save
pm2 startup
```

### 4. Configure Nginx

```bash
nano /etc/nginx/sites-available/myanmar-pos
```

Add configuration:
```nginx
server {
    listen 80;
    server_name your_domain.com;

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Webhooks
    location /webhooks {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Frontend
    location / {
        root /var/www/myanmar-pos/client/build;
        try_files $uri /index.html;
    }
}
```

Enable site:
```bash
ln -s /etc/nginx/sites-available/myanmar-pos /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### 5. Build Frontend

```bash
cd /var/www/myanmar-pos/client
npm install
npm run build
```

### 6. Setup SSL

```bash
certbot --nginx -d your_domain.com
```

## Option 3: Deploy to AWS

### Backend (Elastic Beanstalk)

1. Install EB CLI:
```bash
pip install awsebcli
```

2. Initialize:
```bash
eb init -p node.js myanmar-pos
```

3. Create environment:
```bash
eb create myanmar-pos-env
```

4. Set environment variables:
```bash
eb setenv SUPABASE_URL=your_url SUPABASE_ANON_KEY=your_key
```

5. Deploy:
```bash
eb deploy
```

### Frontend (S3 + CloudFront)

1. Build frontend:
```bash
cd client
npm run build
```

2. Create S3 bucket and upload:
```bash
aws s3 mb s3://myanmar-pos-frontend
aws s3 sync build/ s3://myanmar-pos-frontend
```

3. Configure CloudFront distribution
4. Update DNS records

## Bot Webhook Configuration

After deployment, update webhook URLs:

### Viber
```bash
curl -X POST https://chatapi.viber.com/pa/set_webhook \
  -H "X-Viber-Auth-Token: YOUR_TOKEN" \
  -d '{"url":"https://your-domain.com/webhooks/viber"}'
```

### Telegram
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook?url=https://your-domain.com/webhooks/telegram"
```

### Messenger
Update webhook URL in Facebook Developer Console

## Post-Deployment

### 1. Seed Database
```bash
npm run seed
```

### 2. Test Endpoints
```bash
curl https://your-domain.com/health
curl https://your-domain.com/api/products
```

### 3. Monitor Logs
```bash
# PM2
pm2 logs myanmar-pos-api

# Heroku
heroku logs --tail

# AWS
eb logs
```

### 4. Setup Monitoring

- Configure uptime monitoring (UptimeRobot, Pingdom)
- Setup error tracking (Sentry)
- Configure analytics (Google Analytics)

## Backup Strategy

### Database Backups
Supabase provides automatic backups. Configure additional backups:

```bash
# Daily backup script
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

### File Backups
```bash
# Backup uploads/files
tar -czf backup_$(date +%Y%m%d).tar.gz /var/www/myanmar-pos
```

## Security Checklist

- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] Database credentials rotated
- [ ] Bot tokens secured
- [ ] CORS configured properly
- [ ] Rate limiting enabled
- [ ] Firewall configured
- [ ] Regular security updates
- [ ] Backup strategy in place
- [ ] Monitoring enabled

## Troubleshooting

### Backend not responding
```bash
pm2 restart myanmar-pos-api
pm2 logs myanmar-pos-api
```

### Database connection issues
- Check Supabase project status
- Verify credentials
- Check IP whitelist

### Bot webhooks failing
- Verify webhook URLs
- Check SSL certificate
- Review bot token validity
- Check server logs

## Scaling

### Horizontal Scaling
- Use load balancer (Nginx, AWS ALB)
- Deploy multiple backend instances
- Use Redis for session management

### Database Scaling
- Enable Supabase connection pooling
- Add read replicas
- Implement caching (Redis)

### CDN
- Use CloudFront or Cloudflare
- Cache static assets
- Enable compression

## Maintenance

### Regular Updates
```bash
# Update dependencies
npm update

# Security audit
npm audit fix

# Restart services
pm2 restart all
```

### Database Maintenance
- Regular backups
- Monitor query performance
- Clean old data
- Optimize indexes

## Support

For deployment issues:
- Check server logs
- Review Supabase logs
- Test API endpoints
- Verify environment variables
