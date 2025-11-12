# AWS Elastic Beanstalk Deployment Guide

## Prerequisites

- AWS Account
- AWS CLI installed and configured
- EB CLI installed (`pip install awsebcli`)
- PostgreSQL RDS instance (or use local during dev)

## Step 1: Prepare Application

1. Build the application:
```bash
npm run build
```

2. Test production build locally:
```bash
npm start
```

## Step 2: Configure Elastic Beanstalk

1. Initialize EB application:
```bash
eb init
```

Select:
- Region: Your preferred AWS region
- Platform: Node.js
- Application name: whiteboard-app

2. Create environment:
```bash
eb create whiteboard-prod
```

## Step 3: Set Up RDS PostgreSQL

1. Go to AWS Console → RDS
2. Create PostgreSQL database
3. Note the endpoint, username, and password
4. Update security group to allow EB environment access

## Step 4: Configure Environment Variables

Set environment variables in EB:

```bash
eb setenv DATABASE_URL="postgresql://username:password@rds-endpoint:5432/whiteboard"
eb setenv NEXT_PUBLIC_AWS_REGION="us-east-1"
eb setenv NEXT_PUBLIC_COGNITO_USER_POOL_ID="your-pool-id"
eb setenv NEXT_PUBLIC_COGNITO_CLIENT_ID="your-client-id"
```

Or use EB Console:
1. Go to Configuration → Software
2. Add environment properties

## Step 5: Deploy

```bash
eb deploy
```

## Step 6: Run Database Migrations

SSH into EB instance:
```bash
eb ssh
cd /var/app/current
npm run prisma:migrate
```

Or use a deployment hook (see below).

## Step 7: Open Application

```bash
eb open
```

## Deployment Hooks

Create `.platform/hooks/postdeploy/01_prisma_migrate.sh`:

```bash
#!/bin/bash
cd /var/app/current
npm run prisma:generate
npm run prisma:migrate deploy
```

Make it executable:
```bash
chmod +x .platform/hooks/postdeploy/01_prisma_migrate.sh
```

## Elastic Beanstalk Configuration File

Create `.ebextensions/nodecommand.config`:

```yaml
option_settings:
  aws:elasticbeanstalk:container:nodejs:
    NodeCommand: "npm start"
  aws:elasticbeanstalk:application:environment:
    NODE_ENV: production
```

## Monitoring

- View logs: `eb logs`
- Check health: `eb health`
- Monitor in AWS Console

## Scaling

Configure auto-scaling in EB Console:
1. Configuration → Capacity
2. Set min/max instances
3. Configure scaling triggers

## Custom Domain

1. Go to Route 53
2. Create hosted zone
3. Add A record pointing to EB environment
4. Update EB environment with custom domain

## SSL Certificate

1. Request certificate in ACM
2. Attach to EB load balancer
3. Configure HTTPS listener

## Troubleshooting

### Build Fails
- Check Node.js version compatibility
- Verify all dependencies are in package.json
- Check build logs: `eb logs`

### Database Connection Issues
- Verify RDS security group allows EB access
- Check DATABASE_URL format
- Ensure RDS is in same VPC as EB

### Memory Issues
- Increase instance type in EB configuration
- Optimize Next.js build size
- Enable compression

## Cost Optimization

- Use t3.micro or t3.small for development
- Enable auto-scaling to scale down during low traffic
- Use RDS reserved instances for production
- Set up CloudWatch alarms for cost monitoring

## Backup Strategy

1. Enable RDS automated backups
2. Create manual snapshots before major updates
3. Export board snapshots regularly
4. Use S3 for snapshot storage (optional enhancement)

## CI/CD Pipeline (Optional)

Use AWS CodePipeline:
1. Connect to GitHub repository
2. Configure build stage (CodeBuild)
3. Deploy to EB automatically on push

Or use GitHub Actions:
```yaml
name: Deploy to EB
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to EB
        run: |
          pip install awsebcli
          eb deploy whiteboard-prod
```
