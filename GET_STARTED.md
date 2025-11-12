# 🎨 Get Started with Collaborative Whiteboard

Welcome! This guide will help you get your collaborative whiteboard application up and running.

## 📚 Documentation Overview

We've created comprehensive documentation for you:

1. **[QUICKSTART.md](QUICKSTART.md)** - Get running in 5 minutes
2. **[SETUP.md](SETUP.md)** - Detailed setup with troubleshooting
3. **[README.md](README.md)** - Project overview and features
4. **[PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)** - Architecture deep-dive
5. **[DEPLOYMENT.md](DEPLOYMENT.md)** - AWS deployment guide
6. **[FEATURES.md](FEATURES.md)** - Complete feature checklist

## 🚀 Quick Start (5 Minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Database
```bash
# Using Docker (recommended)
docker run --name whiteboard-db -e POSTGRES_PASSWORD=password -e POSTGRES_DB=whiteboard -p 5432:5432 -d postgres
```

### 3. Setup Database
```bash
npm run prisma:generate
npm run prisma:migrate
```

### 4. Configure AWS Cognito
Edit `.env` file and add your Cognito credentials:
```env
NEXT_PUBLIC_COGNITO_USER_POOL_ID="your-pool-id"
NEXT_PUBLIC_COGNITO_CLIENT_ID="your-client-id"
```

**Don't have Cognito set up?** See [SETUP.md](SETUP.md) for step-by-step instructions.

### 5. Start Development Server
```bash
npm run dev
```

### 6. Open Application
Visit http://localhost:3000

## 🎯 What You Get

### Pages
- **Landing Page** (/) - Beautiful hero section with features
- **Sign In** (/signin) - AWS Cognito authentication
- **Sign Up** (/signup) - User registration with email verification
- **Dashboard** (/dashboard) - View and manage all your boards
- **Board Canvas** (/board/[id]) - Full-featured whiteboard with tldraw

### Features
✅ Real-time drawing with tldraw
✅ Auto-save every 2 minutes
✅ Export to JSON, SVG, PNG
✅ Share boards with collaborators
✅ Role-based access (owner/editor/viewer)
✅ PostgreSQL database with Prisma
✅ AWS Cognito authentication
✅ Modern UI with Tailwind CSS

## 📁 Project Structure

```
whiteboard-tldraw-Q/
├── src/
│   ├── app/
│   │   ├── api/              # API routes (boards, snapshots, collaborations)
│   │   ├── board/[id]/       # Whiteboard canvas page
│   │   ├── dashboard/        # User dashboard
│   │   ├── signin/           # Sign in page
│   │   ├── signup/           # Sign up page
│   │   └── page.js           # Landing page
│   ├── components/           # React components
│   │   ├── WhiteboardCanvas.js
│   │   └── LoadingSpinner.js
│   ├── contexts/             # React contexts
│   │   └── AuthContext.js    # Authentication state
│   └── lib/                  # Utilities
│       ├── prisma.js         # Database client
│       └── cognito.js        # AWS Amplify config
├── prisma/
│   └── schema.prisma         # Database schema
├── .env                      # Environment variables
├── package.json              # Dependencies and scripts
└── Documentation files...
```

## 🛠️ Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm start                # Start production server

# Database
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run database migrations
npm run prisma:studio    # Open Prisma Studio (DB GUI)

# Linting
npm run lint             # Run Next.js linter
```

## 🔧 Configuration Files

- **`.env`** - Environment variables (database, AWS Cognito)
- **`prisma/schema.prisma`** - Database schema
- **`next.config.js`** - Next.js configuration
- **`tailwind.config.js`** - Tailwind CSS configuration
- **`jsconfig.json`** - Path aliases (@/ imports)

## 🗄️ Database Schema

### User
- Stores user information from Cognito
- Links to boards and collaborations

### Board
- Whiteboard boards owned by users
- Has title, owner, timestamps
- Links to snapshots and collaborators

### Snapshot
- JSON snapshots of board state
- Auto-saved every 2 minutes
- Loaded when board opens

### Collaboration
- Board sharing relationships
- Roles: "editor" or "viewer"
- Links users to boards

## 🔐 Authentication Flow

1. User signs up via AWS Cognito
2. Email verification sent
3. User verifies and signs in
4. JWT tokens stored in AuthContext
5. Protected routes check authentication
6. User can access dashboard and boards

## 🎨 Using the Whiteboard

1. **Create Board**: Click "Create New Board" on dashboard
2. **Draw**: Use tldraw tools (select, draw, shapes, text)
3. **Save**: Auto-saves every 2 minutes, or click "Save" button
4. **Export**: Click "Export" → Choose JSON, SVG, or PNG
5. **Share**: Click "Share" → Add collaborators by email
6. **Collaborate**: Share link with team members

## 📊 API Endpoints

### Boards
- `GET /api/boards?userId={id}` - List user's boards
- `POST /api/boards` - Create new board
- `DELETE /api/boards?boardId={id}&userId={id}` - Delete board

### Snapshots
- `POST /api/snapshots` - Save board snapshot
- `GET /api/snapshots?boardId={id}` - Get latest snapshot

### Collaborations
- `POST /api/collaborations` - Add collaborator
- `DELETE /api/collaborations?collaborationId={id}` - Remove collaborator

## 🚀 Deployment to AWS

Ready to deploy? Follow these steps:

1. Read [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions
2. Set up AWS Elastic Beanstalk
3. Create RDS PostgreSQL database
4. Configure environment variables
5. Deploy application
6. Run database migrations

Estimated cost: $25-55/month for small-scale production

## 🐛 Troubleshooting

### Database Connection Error
```bash
# Check if PostgreSQL is running
docker ps

# Restart database
docker start whiteboard-db
```

### Prisma Client Error
```bash
# Regenerate Prisma client
npm run prisma:generate
```

### Port Already in Use
```bash
# Windows: Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Authentication Issues
- Verify Cognito User Pool ID and Client ID in `.env`
- Ensure app client has no client secret
- Check AWS region matches

For more troubleshooting, see [SETUP.md](SETUP.md)

## 📖 Learning Resources

### Technologies Used
- **Next.js**: https://nextjs.org/docs
- **tldraw**: https://tldraw.dev
- **Prisma**: https://www.prisma.io/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **AWS Cognito**: https://docs.aws.amazon.com/cognito
- **AWS Amplify**: https://docs.amplify.aws

## 🎯 Next Steps

1. ✅ Complete setup (follow QUICKSTART.md)
2. ✅ Create your first board
3. ✅ Test all features
4. ✅ Invite collaborators
5. ✅ Customize styling (Tailwind)
6. ✅ Deploy to AWS (DEPLOYMENT.md)

## 💡 Tips

- Use Prisma Studio to view database: `npm run prisma:studio`
- Check browser console for errors during development
- Use React DevTools to inspect component state
- Monitor API requests in Network tab
- Keep dependencies updated: `npm update`

## 🤝 Need Help?

1. Check documentation files (especially SETUP.md)
2. Review PROJECT_OVERVIEW.md for architecture details
3. Check FEATURES.md for implementation status
4. Review error messages carefully
5. Check browser console and terminal logs

## 🎉 You're Ready!

Your collaborative whiteboard application is fully set up and ready to use. Start by running:

```bash
npm run dev
```

Then visit http://localhost:3000 and create your first board!

Happy drawing! 🎨✨
