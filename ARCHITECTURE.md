# Application Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Landing Page │  │  Auth Pages  │  │  Dashboard   │          │
│  │      /       │  │ /signin      │  │  /dashboard  │          │
│  └──────────────┘  │ /signup      │  └──────────────┘          │
│                    └──────────────┘                              │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Board Canvas (/board/[id])                   │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │           tldraw Whiteboard Component              │  │  │
│  │  │  • Drawing tools  • Shapes  • Export  • Save      │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS APPLICATION                           │
│                   (Elastic Beanstalk)                            │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    API Routes                             │  │
│  │                                                            │  │
│  │  /api/boards          /api/snapshots    /api/collaborations│ │
│  │  • GET (list)         • POST (save)     • POST (add)      │  │
│  │  • POST (create)      • GET (load)      • DELETE (remove) │  │
│  │  • DELETE (remove)                                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  Server Components                        │  │
│  │  • AuthContext (AWS Amplify)                             │  │
│  │  • Prisma Client                                         │  │
│  │  • Business Logic                                        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                    │                        │
                    │                        │
                    ▼                        ▼
        ┌───────────────────┐    ┌──────────────────┐
        │   AWS COGNITO     │    │   POSTGRESQL     │
        │   User Pool       │    │   (RDS)          │
        │                   │    │                  │
        │ • Authentication  │    │ • Users          │
        │ • User Management │    │ • Boards         │
        │ • JWT Tokens      │    │ • Snapshots      │
        └───────────────────┘    │ • Collaborations │
                                 └──────────────────┘
```

## Data Flow Diagrams

### 1. Authentication Flow

```
User                    Next.js App              AWS Cognito
 │                           │                        │
 │──── Sign Up ─────────────>│                        │
 │                           │──── Create User ──────>│
 │                           │<──── Confirmation ─────│
 │<──── Verify Email ────────│                        │
 │                           │                        │
 │──── Verify Code ─────────>│──── Confirm ─────────>│
 │                           │<──── Success ──────────│
 │<──── Success ─────────────│                        │
 │                           │                        │
 │──── Sign In ─────────────>│──── Authenticate ────>│
 │                           │<──── JWT Tokens ───────│
 │<──── Redirect Dashboard ──│                        │
```

### 2. Board Creation Flow

```
User              Dashboard           API Route         Database
 │                    │                   │                 │
 │─ Click Create ────>│                   │                 │
 │                    │─ Show Modal ─────>│                 │
 │                    │                   │                 │
 │─ Enter Title ─────>│                   │                 │
 │                    │─ POST /api/boards>│                 │
 │                    │                   │─ Create Board ─>│
 │                    │                   │<─ Board Data ───│
 │                    │<─ Board Created ──│                 │
 │<─ Redirect to Board│                   │                 │
```

### 3. Drawing and Save Flow

```
User          Canvas Component      API Route        Database
 │                  │                   │                │
 │─ Draw ──────────>│                   │                │
 │                  │─ Update State ───>│                │
 │                  │                   │                │
 │                  │ (Auto-save timer) │                │
 │                  │─ POST /api/snapshots              │
 │                  │                   │─ Save Snapshot>│
 │                  │                   │<─ Success ─────│
 │                  │<─ Saved ──────────│                │
 │<─ Toast Notification                │                │
```

### 4. Collaboration Flow

```
Owner         Share Modal       API Route        Database      Collaborator
 │                │                 │                │               │
 │─ Click Share ─>│                 │                │               │
 │                │─ Show Modal ───>│                │               │
 │                │                 │                │               │
 │─ Add Email ───>│                 │                │               │
 │                │─ POST /api/collaborations        │               │
 │                │                 │─ Create Collab>│               │
 │                │                 │<─ Success ─────│               │
 │                │<─ Added ────────│                │               │
 │                │                 │                │               │
 │─ Copy Link ───>│                 │                │               │
 │                │─ Copy to Clipboard               │               │
 │                │                 │                │               │
 │─ Send Link ───────────────────────────────────────────────────>│
 │                │                 │                │               │
 │                │                 │                │<─ Open Link ──│
 │                │                 │<─ GET /api/boards              │
 │                │                 │─ Check Access ─>│               │
 │                │                 │<─ Board Data ───│               │
 │                │                 │                │<─ View Board ─│
```

## Component Architecture

```
App (Root Layout)
│
├── AuthProvider (Context)
│   └── Authentication State
│
├── Toaster (Notifications)
│
└── Pages
    │
    ├── Landing Page (/)
    │   └── Hero + Features
    │
    ├── Auth Pages
    │   ├── Sign In (/signin)
    │   └── Sign Up (/signup)
    │
    ├── Dashboard (/dashboard)
    │   ├── Board List
    │   ├── Create Modal
    │   └── Delete Confirmation
    │
    └── Board Canvas (/board/[id])
        ├── WhiteboardCanvas
        │   ├── Tldraw Component
        │   ├── Save Button
        │   └── Export Menu
        │
        └── Share Modal
            ├── Link Display
            ├── Add Collaborator Form
            └── Collaborator List
```

## Database Schema Relationships

```
┌──────────────┐
│     User     │
│──────────────│
│ id (PK)      │
│ email        │◄────────┐
│ name         │         │
└──────────────┘         │
       │                 │
       │ 1:N             │ N:1
       │                 │
       ▼                 │
┌──────────────┐         │
│    Board     │         │
│──────────────│         │
│ id (PK)      │         │
│ title        │         │
│ ownerId (FK) │─────────┘
│ createdAt    │
│ updatedAt    │
└──────────────┘
       │
       │ 1:N
       │
       ├──────────────────┬──────────────────┐
       │                  │                  │
       ▼                  ▼                  ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│  Snapshot    │   │Collaboration │   │     User     │
│──────────────│   │──────────────│   │ (via Collab) │
│ id (PK)      │   │ id (PK)      │   └──────────────┘
│ boardId (FK) │   │ boardId (FK) │
│ data (JSON)  │   │ userId (FK)  │
│ createdAt    │   │ role         │
└──────────────┘   └──────────────┘
```

## Technology Stack Layers

```
┌─────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                    │
│  • React Components                                      │
│  • Tailwind CSS                                          │
│  • tldraw Canvas                                         │
│  • React Hot Toast                                       │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                      │
│  • Next.js App Router                                    │
│  • React Context (Auth)                                  │
│  • Client-side State                                     │
│  • AWS Amplify (Auth Client)                            │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────┐
│                      API LAYER                           │
│  • Next.js API Routes                                    │
│  • Request Validation                                    │
│  • Business Logic                                        │
│  • Error Handling                                        │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────┐
│                   DATA ACCESS LAYER                      │
│  • Prisma ORM                                            │
│  • Query Building                                        │
│  • Transaction Management                                │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────┐
│                   INFRASTRUCTURE LAYER                   │
│  • PostgreSQL Database                                   │
│  • AWS Cognito                                           │
│  • File System (snapshots)                              │
└─────────────────────────────────────────────────────────┘
```

## Deployment Architecture (AWS)

```
                    ┌──────────────┐
                    │   Route 53   │
                    │     (DNS)    │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │ CloudFront   │
                    │    (CDN)     │
                    └──────┬───────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│ Elastic       │  │ Elastic       │  │ Elastic       │
│ Beanstalk     │  │ Beanstalk     │  │ Beanstalk     │
│ Instance 1    │  │ Instance 2    │  │ Instance N    │
│ (Next.js App) │  │ (Next.js App) │  │ (Next.js App) │
└───────┬───────┘  └───────┬───────┘  └───────┬───────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                    ┌──────▼───────┐
                    │ Load Balancer│
                    └──────┬───────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│ RDS Primary   │  │ AWS Cognito   │  │  CloudWatch   │
│ (PostgreSQL)  │  │  User Pool    │  │  (Monitoring) │
└───────┬───────┘  └───────────────┘  └───────────────┘
        │
        ▼
┌───────────────┐
│ RDS Replica   │
│  (Read-only)  │
└───────────────┘
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                       │
│                                                          │
│  1. Network Security                                     │
│     • HTTPS/TLS encryption                              │
│     • VPC isolation                                     │
│     • Security groups                                   │
│                                                          │
│  2. Authentication                                       │
│     • AWS Cognito JWT tokens                            │
│     • Email verification                                │
│     • Password policies                                 │
│                                                          │
│  3. Authorization                                        │
│     • Ownership validation                              │
│     • Role-based access (owner/editor/viewer)          │
│     • API route protection                              │
│                                                          │
│  4. Data Security                                        │
│     • Database encryption at rest                       │
│     • Encrypted connections (SSL)                       │
│     • Input validation                                  │
│                                                          │
│  5. Application Security                                 │
│     • CSRF protection (Next.js built-in)               │
│     • XSS prevention (React escaping)                  │
│     • SQL injection prevention (Prisma)                │
└─────────────────────────────────────────────────────────┘
```

## Performance Optimization Strategy

```
┌─────────────────────────────────────────────────────────┐
│                  OPTIMIZATION LAYERS                     │
│                                                          │
│  Frontend                                                │
│  • Code splitting (Next.js automatic)                   │
│  • Dynamic imports (tldraw)                             │
│  • Image optimization                                   │
│  • CSS purging (Tailwind)                               │
│                                                          │
│  API                                                     │
│  • Serverless auto-scaling                              │
│  • Connection pooling (Prisma)                          │
│  • Query optimization                                   │
│  • Response caching                                     │
│                                                          │
│  Database                                                │
│  • Indexed queries                                      │
│  • Efficient relations                                  │
│  • Read replicas                                        │
│  • Query result caching                                 │
│                                                          │
│  Infrastructure                                          │
│  • CDN for static assets                                │
│  • Load balancing                                       │
│  • Auto-scaling groups                                  │
│  • Regional deployment                                  │
└─────────────────────────────────────────────────────────┘
```

## Monitoring and Observability

```
Application Metrics
        │
        ├─> CloudWatch Logs
        │   • Application logs
        │   • Error logs
        │   • Access logs
        │
        ├─> CloudWatch Metrics
        │   • CPU usage
        │   • Memory usage
        │   • Request count
        │   • Response time
        │
        ├─> RDS Monitoring
        │   • Query performance
        │   • Connection count
        │   • Storage usage
        │
        └─> Custom Metrics
            • Board creations
            • Active users
            • Snapshot saves
            • Export requests
```

## Scalability Considerations

```
Vertical Scaling (Scale Up)
• Increase instance size (t3.micro → t3.medium → t3.large)
• Increase database size (db.t3.micro → db.t3.medium)
• More CPU/RAM per instance

Horizontal Scaling (Scale Out)
• Add more EB instances (auto-scaling)
• Add database read replicas
• Distribute across availability zones
• Use CDN for static content

Data Scaling
• Partition snapshots by date
• Archive old boards
• Compress snapshot data
• Use S3 for large files
```

This architecture provides a solid foundation for a scalable, secure, and maintainable collaborative whiteboard application.
