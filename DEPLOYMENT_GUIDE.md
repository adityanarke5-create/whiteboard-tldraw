# Production Deployment Guide

## Prerequisites
- PostgreSQL database (Neon, Supabase, or AWS RDS)
- AWS Cognito User Pool configured
- Node.js hosting (Vercel, AWS EB, or VPS)
- WebSocket server hosting for sync

## Environment Variables

Create `.env.production`:

```env
# Database (use production PostgreSQL URL)
DATABASE_URL="postgresql://user:pass@host:5432/dbname?sslmode=require"

# AWS Cognito
NEXT_PUBLIC_AWS_REGION="your-region"
NEXT_PUBLIC_COGNITO_USER_POOL_ID="your-pool-id"
NEXT_PUBLIC_COGNITO_CLIENT_ID="your-client-id"

# Sync Server (use wss:// for production)
NEXT_PUBLIC_SYNC_SERVER_URL="wss://your-sync-server.com"
```

## Deployment Steps

### 1. Deploy Next.js App

#### Option A: Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

Add environment variables in Vercel dashboard.

#### Option B: AWS Elastic Beanstalk
```bash
npm run build
eb init
eb create whiteboard-prod
eb setenv DATABASE_URL="..." NEXT_PUBLIC_AWS_REGION="..." ...
eb deploy
```

### 2. Deploy Sync Server

#### Option A: Separate VPS/EC2
```bash
# On server
git clone your-repo
cd whiteboard-tldraw-Q
npm install
npm install -g pm2

# Start with PM2
pm2 start sync-server/server.mjs --name tldraw-sync
pm2 save
pm2 startup
```

#### Option B: Docker
```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY sync-server ./sync-server
EXPOSE 5858
CMD ["node", "sync-server/server.mjs"]
```

### 3. Configure Nginx (for WebSocket)

```nginx
server {
    listen 443 ssl;
    server_name sync.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:5858;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 4. Database Migration

```bash
npm run prisma:generate
npm run prisma:migrate deploy
```

### 5. SSL Certificates

Use Let's Encrypt:
```bash
sudo certbot --nginx -d yourdomain.com -d sync.yourdomain.com
```

## Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] SSL certificates installed
- [ ] Sync server running with PM2/Docker
- [ ] Nginx configured for WebSocket
- [ ] AWS Cognito production pool configured
- [ ] Domain DNS configured
- [ ] Monitoring set up (CloudWatch, Sentry)
- [ ] Backups configured
- [ ] Rate limiting enabled

## Monitoring

### PM2 Monitoring
```bash
pm2 monit
pm2 logs tldraw-sync
```

### Database Backups
```bash
# Automated daily backups
0 2 * * * pg_dump $DATABASE_URL > /backups/db-$(date +\%Y\%m\%d).sql
```

## Scaling

### Horizontal Scaling
- Use load balancer for Next.js instances
- Run multiple sync servers with sticky sessions
- Use Redis for session storage

### Database Scaling
- Enable connection pooling (PgBouncer)
- Add read replicas
- Implement caching (Redis)

## Security

- Enable CORS restrictions
- Add rate limiting
- Implement request validation
- Use environment-specific secrets
- Enable audit logging
- Regular security updates

## Cost Optimization

- Use serverless for Next.js (Vercel)
- t3.micro for sync server (~$10/month)
- Neon PostgreSQL free tier or RDS t3.micro
- CloudFlare for CDN (free)

**Estimated Monthly Cost**: $15-50 for small scale
