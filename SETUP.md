# Quick Setup Guide

## 1. Install Dependencies

```bash
npm install
```

## 2. Set Up PostgreSQL

### Option A: Local PostgreSQL

Install PostgreSQL locally, then create database:

```bash
# Windows (using psql)
psql -U postgres
CREATE DATABASE whiteboard;
\q
```

### Option B: Docker PostgreSQL

```bash
docker run --name whiteboard-postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=whiteboard -p 5432:5432 -d postgres
```

## 3. Configure Environment

Copy `.env.example` to `.env` and update:

```bash
cp .env.example .env
```

Update `.env` with your values:
- Database connection string
- AWS Cognito credentials (see step 4)

## 4. Set Up AWS Cognito

### Create User Pool

1. Go to AWS Console → Cognito
2. Click "Create user pool"
3. Configure sign-in options:
   - Select "Email"
4. Configure security requirements:
   - Password policy: Default or custom
   - MFA: Optional (recommended for production)
5. Configure sign-up experience:
   - Enable self-registration
   - Required attributes: email, name
6. Configure message delivery:
   - Email provider: Cognito (for testing) or SES (for production)
7. Integrate your app:
   - User pool name: `whiteboard-users`
   - App client name: `whiteboard-client`
   - **Important**: Don't generate client secret
8. Review and create

### Get Credentials

After creation:
1. Copy "User pool ID" from pool overview
2. Go to "App integration" → "App clients"
3. Copy "Client ID"
4. Update `.env`:
   ```
   NEXT_PUBLIC_COGNITO_USER_POOL_ID="us-east-1_XXXXXXXXX"
   NEXT_PUBLIC_COGNITO_CLIENT_ID="xxxxxxxxxxxxxxxxxxxxxxxxxx"
   NEXT_PUBLIC_AWS_REGION="us-east-1"
   ```

## 5. Initialize Database

```bash
# Generate Prisma Client
npm run prisma:generate

# Create database tables
npm run prisma:migrate
```

When prompted for migration name, enter: `init`

## 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 7. Create First User

1. Go to http://localhost:3000
2. Click "Sign Up"
3. Enter name, email, password
4. Check email for verification code (if using Cognito email)
5. Verify account
6. Sign in

## 8. Test the Application

1. Create a new board
2. Draw on the canvas
3. Save snapshot
4. Export board
5. Share with another user (create second account)

## Common Issues

### Dependency Resolution Error

**Error**: `ERESOLVE unable to resolve dependency tree` or React version conflict

**Solution**:
```bash
# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Install with legacy peer deps
npm install --legacy-peer-deps

# Or use the fixed package.json (already updated)
npm install
```

### Database Connection Error

**Error**: `Can't reach database server`

**Solution**:
- Ensure PostgreSQL is running
- Check DATABASE_URL in `.env`
- Verify database exists: `psql -U postgres -l`

### Cognito Authentication Error

**Error**: `Invalid user pool configuration`

**Solution**:
- Verify User Pool ID and Client ID in `.env`
- Ensure app client has no client secret
- Check AWS region matches

### Prisma Client Error

**Error**: `@prisma/client did not initialize yet`

**Solution**:
```bash
npm run prisma:generate
```

### Port Already in Use

**Error**: `Port 3000 is already in use`

**Solution**:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use different port
PORT=3001 npm run dev
```

## Development Tools

### Prisma Studio

Visual database browser:
```bash
npm run prisma:studio
```

Opens at http://localhost:5555

### View Logs

Next.js logs are in terminal. For detailed debugging:
```bash
# Enable verbose logging
DEBUG=* npm run dev
```

## Next Steps

- Customize styling in `tailwind.config.js`
- Add more drawing tools
- Implement real-time cursors with tldraw sync server
- Set up production deployment (see DEPLOYMENT.md)
- Configure custom domain
- Add analytics

## Production Checklist

Before deploying to production:

- [ ] Set up production PostgreSQL (RDS)
- [ ] Configure Cognito for production
- [ ] Enable MFA in Cognito
- [ ] Set up SES for email delivery
- [ ] Add error tracking (Sentry, etc.)
- [ ] Configure HTTPS/SSL
- [ ] Set up monitoring and alerts
- [ ] Configure backups
- [ ] Add rate limiting
- [ ] Review security settings
- [ ] Test with multiple users
- [ ] Load testing

## Support

For issues:
1. Check this guide
2. Review README.md
3. Check Prisma docs: https://www.prisma.io/docs
4. Check tldraw docs: https://tldraw.dev
5. Check AWS Cognito docs: https://docs.aws.amazon.com/cognito
