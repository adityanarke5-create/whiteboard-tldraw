# Quick Start Guide - 5 Minutes to Running App

## Prerequisites
- Node.js 18+ installed
- PostgreSQL installed (or Docker)

## Step 1: Install Dependencies (1 min)
```bash
npm install
```

**Note**: If you see a React version conflict error, the package.json has been updated to use React 18 (compatible with tldraw). Just run `npm install` again.

## Step 2: Start PostgreSQL (30 seconds)

### Option A: Docker (Recommended)
```bash
docker run --name whiteboard-db -e POSTGRES_PASSWORD=password -e POSTGRES_DB=whiteboard -p 5432:5432 -d postgres
```

### Option B: Local PostgreSQL
Ensure PostgreSQL is running and create database:
```bash
psql -U postgres -c "CREATE DATABASE whiteboard;"
```

## Step 3: Configure Environment (30 seconds)

The `.env` file is already created. For local development, you only need to update the Cognito settings (or skip for now and test without auth).

**For testing without AWS Cognito** (skip authentication):
You can temporarily modify the auth check, or proceed to set up Cognito.

**To set up AWS Cognito** (5 minutes):
1. Go to AWS Console → Cognito
2. Create User Pool (use defaults)
3. Create App Client (no client secret)
4. Copy User Pool ID and Client ID to `.env`

## Step 4: Initialize Database (30 seconds)
```bash
npm run prisma:generate
npm run prisma:migrate
```
When prompted for migration name, type: `init`

## Step 5: Start Development Server (10 seconds)
```bash
npm run dev
```

## Step 6: Open Application
Open http://localhost:3000 in your browser

## Testing the App

### Without Cognito (Quick Test)
If you haven't set up Cognito yet, you can test the UI:
1. Visit landing page
2. View sign-in/sign-up pages (they won't work without Cognito)

### With Cognito (Full Test)
1. Click "Sign Up"
2. Create account (email, password, name)
3. Verify email (check inbox)
4. Sign in
5. Create a board
6. Draw on canvas
7. Save and export

## Common Issues

### "Can't reach database server"
- Ensure PostgreSQL is running
- Check DATABASE_URL in `.env` matches your setup

### "Port 3000 already in use"
```bash
# Kill process on port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Prisma errors
```bash
# Regenerate Prisma client
npm run prisma:generate
```

## Next Steps

1. Read [SETUP.md](SETUP.md) for detailed setup
2. Read [README.md](README.md) for features overview
3. Read [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) for architecture
4. Read [DEPLOYMENT.md](DEPLOYMENT.md) for AWS deployment

## Development Tools

### View Database
```bash
npm run prisma:studio
```
Opens at http://localhost:5555

### View Logs
Check terminal where `npm run dev` is running

## Project Structure
```
src/
├── app/
│   ├── api/              # API routes
│   ├── board/[id]/       # Whiteboard canvas
│   ├── dashboard/        # User dashboard
│   ├── signin/           # Sign in page
│   ├── signup/           # Sign up page
│   └── page.js           # Landing page
├── components/           # React components
├── contexts/             # React contexts (Auth)
└── lib/                  # Utilities (Prisma, Cognito)
```

## Key Features

✅ User authentication (AWS Cognito)
✅ Create/delete boards
✅ Real-time drawing with tldraw
✅ Auto-save every 2 minutes
✅ Manual save button
✅ Export to JSON, SVG, PNG
✅ Share boards with collaborators
✅ Role-based access (owner/editor/viewer)
✅ PostgreSQL database with Prisma

## Support

- Issues? Check [SETUP.md](SETUP.md) troubleshooting section
- Questions? Review [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)
- Deployment? See [DEPLOYMENT.md](DEPLOYMENT.md)

Happy coding! 🎨
