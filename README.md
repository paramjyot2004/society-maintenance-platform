<div align="center">

# 🏢 Oakwood Heights — Society Maintenance Platform

### A full-stack residential society maintenance and facility management system

Residents can report maintenance issues, track complaint progress, read society notices, view maintenance dues, and find facility staff — while administrators manage complaints, notices, priorities, status history, and operational settings.

**Built with React + TypeScript + Vite + Express + PostgreSQL + Prisma**

<br/>

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)

</div>

---

## ✨ Overview

**Oakwood Heights** is a full-stack society maintenance and facility management platform designed around a realistic residential maintenance workflow.

The application provides separate experiences for residents and society management.

### 👤 Resident

Residents can:

- Raise maintenance complaints
- Track complaint progress
- View complaint history
- Read society notices
- Check maintenance dues
- Browse facility staff
- View complaint status and priority
- Access a responsive dashboard

### 🛡️ Administration

Society management can:

- View society-wide complaints
- Manage complaint priorities
- Update complaint statuses
- Track complaint history
- Publish and manage notices
- Monitor operational statistics
- Manage maintenance settings
- Review facility operations

The project is designed as a **modern SaaS-style dashboard**, focusing on usability, clear information architecture, role-based access and realistic maintenance workflows.

---

# 🎯 Core Features

## 👤 Resident Portal

- 🔐 Resident authentication and registration
- 🎫 Raise maintenance complaints
- 📊 Track complaint lifecycle
- 🔄 Open → In Progress → Resolved workflow
- 🔎 Search and filter complaints
- 🏷️ Complaint category and priority indicators
- 📝 Complaint details and status history
- 📢 Society notices and announcements
- 📌 Pinned important notices
- 💳 Maintenance dues and billing
- 👷 Facility staff directory
- 📱 Responsive resident interface

---

## 🛡️ Admin Management

- 📊 Administrative dashboard
- 🎫 Society-wide complaint management
- 🔍 Complaint search and filtering
- ⚡ Priority management
- 🔄 Complaint status management
- 🧾 Complaint status history
- 📢 Notice creation and management
- 📌 Pin important notices
- ⚙️ Maintenance configuration
- 👥 Role-based administration
- 📈 Operational statistics

---

# 🔐 Authentication & Security

The application includes:

- JWT-based authentication
- HTTP-only authentication cookies
- Password hashing using `bcryptjs`
- Role-based authorization
- Protected resident routes
- Protected administrator routes
- Server-side identity validation
- Environment-based secrets
- Protected admin bootstrap functionality

Sensitive credentials are never stored directly in the repository.

---

## 🖥️ Screenshots

### 🏠 Resident Dashboard

The resident dashboard provides an overview of complaints, maintenance information, notices, and important society updates.

![Resident Dashboard](docs/screenshots/resident-dashboard.png)

---

### 🎫 Complaint Management

Residents can view and track their submitted maintenance complaints, including status, priority, category, and complaint details.

![Complaint Management](docs/screenshots/complaints.png)

---

### 📢 Society Notices

Residents can access important society announcements, maintenance updates, and community notices from a centralized notice board.

![Society Notices](docs/screenshots/notices.png)

---

# 🧭 Application Workflow

```text
                    ┌─────────────────┐
                    │   Login /       │
                    │  Registration   │
                    └────────┬────────┘
                             │
                 ┌───────────┴───────────┐
                 │                       │
            RESIDENT                  ADMIN
                 │                       │
        ┌────────▼────────┐     ┌────────▼────────┐
        │ Resident Portal │     │ Admin Dashboard │
        └────────┬────────┘     └────────┬────────┘
                 │                       │
       ┌─────────┼─────────┐       ┌─────┼──────────┐
       │         │         │       │     │          │
   Complaints  Notices    Dues  Complaints Notices Settings
       │
       ▼
   Open → In Progress → Resolved
```

---

# 🏗️ Architecture

```mermaid
flowchart LR
    A[React + TypeScript + Vite] --> B[Express API]
    B --> C[Authentication + RBAC]
    B --> D[Prisma ORM]
    D --> E[(PostgreSQL)]
    B --> F[Email Service]
    B --> G[File Upload Service]
```

### Application Layers

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Backend | Express.js |
| Database | PostgreSQL |
| ORM | Prisma |
| Authentication | JWT + HTTP-only Cookies |
| Password Security | bcryptjs |
| Email | Resend |
| Icons | Lucide React |
| Animation | Motion |
| Deployment | Node-compatible hosting |

---

# 📁 Project Structure

```text
society-maintenance-platform/
│
├── prisma/
│   └── schema.prisma
│
├── server/
│   ├── auth.ts
│   ├── complaints.ts
│   ├── db.ts
│   ├── email.ts
│   ├── emailTemplates.ts
│   ├── notices.ts
│   └── upload.ts
│
├── src/
│   ├── components/
│   │   ├── AdminComplaintManagement.tsx
│   │   ├── AdminDashboard.tsx
│   │   ├── AuthModal.tsx
│   │   ├── CategoryBadge.tsx
│   │   ├── ComplaintCard.tsx
│   │   ├── ComplaintDetailsModal.tsx
│   │   ├── DuesAndBilling.tsx
│   │   ├── LoginPage.tsx
│   │   ├── Navbar.tsx
│   │   ├── NewComplaintModal.tsx
│   │   ├── NoticesBoard.tsx
│   │   ├── ResidentComplaintsView.tsx
│   │   ├── StaffRoster.tsx
│   │   ├── StatsOverview.tsx
│   │   └── UnitsDirectory.tsx
│   │
│   ├── services/
│   │   ├── adminComplaintService.ts
│   │   ├── authService.ts
│   │   ├── complaintService.ts
│   │   ├── emailService.ts
│   │   └── noticeService.ts
│   │
│   ├── data/
│   │   └── mockData.ts
│   │
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── types.ts
│
├── server.ts
├── prisma.config.ts
├── package.json
├── vite.config.ts
├── tsconfig.json
├── .env.example
├── .gitignore
└── README.md
```

---

# ⚙️ Local Development

## Prerequisites

Make sure you have installed:

- Node.js 18+
- PostgreSQL
- npm or Bun
- Git

---

## 1. Clone the Repository

```bash
git clone https://github.com/paramjyot2004/society-maintenance-platform.git
cd society-maintenance-platform
```

---

## 2. Install Dependencies

Using npm:

```bash
npm install
```

Or using Bun:

```bash
bun install
```

---

## 3. Configure Environment Variables

Create a `.env` file using `.env.example` as a reference.

```bash
cp .env.example .env
```

Example:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"

JWT_SECRET="your-secure-jwt-secret"

ADMIN_SETUP_SECRET="your-admin-bootstrap-secret"

RESEND_API_KEY="your-resend-api-key"

RESEND_FROM_EMAIL="Oakwood Heights <notifications@yourdomain.com>"
```

Never commit the actual `.env` file.

---

## 4. Generate Prisma Client

```bash
npx prisma generate
```

---

## 5. Set Up Database

For development:

```bash
npx prisma migrate dev
```

For production:

```bash
npx prisma migrate deploy
```

---

## 6. Start Development Server

```bash
npm run dev
```

The application will be available at:

```text
http://localhost:3000
```

---

# 🧪 Available Commands

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build production application |
| `npm start` | Start production server |
| `npm run lint` | Run TypeScript/lint checks |
| `npx prisma generate` | Generate Prisma Client |
| `npx prisma migrate dev` | Run development migration |
| `npx prisma migrate deploy` | Deploy production migrations |

---

# 🔌 API Overview

## Authentication

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
POST /api/auth/admin/bootstrap
GET  /api/admin/verify
GET  /api/resident/verify
```

---

## Resident Complaints

```text
POST /api/complaints
GET  /api/complaints
GET  /api/complaints/:id
```

---

## Admin Complaints

```text
GET   /api/admin/complaints
GET   /api/admin/complaints/:id
PATCH /api/admin/complaints/:id/status
PATCH /api/admin/complaints/:id/priority
GET   /api/admin/complaints/:id/history
```

---

## Notices

```text
GET    /api/notices
POST   /api/notices
PUT    /api/notices/:id
PATCH  /api/notices/:id
DELETE /api/notices/:id
```

---

## Dashboard & Settings

```text
GET /api/admin/dashboard/stats

GET /api/admin/settings

PUT /api/admin/settings/overdue-threshold
```

---

## Health Check

```text
GET /api/health
```

---

# 🧠 Engineering Highlights

### ♻️ Reusable Component Architecture

The frontend is divided into reusable components for:

- Complaints
- Notices
- Authentication
- Staff
- Billing
- Dashboard statistics
- Admin management

### 🔒 Role-Based Access

The platform separates:

```text
RESIDENT
   ↓
Resident Dashboard

ADMIN
   ↓
Admin Dashboard
```

Administrative actions are protected on the server rather than relying only on frontend visibility.

### 🧾 Complaint Lifecycle

Each complaint follows a structured lifecycle:

```text
Created
   ↓
Open
   ↓
Assigned
   ↓
In Progress
   ↓
Resolved
```

Status history provides an auditable record of changes.

### 🔎 Search & Filtering

Residents and administrators can efficiently locate complaints using search, status and category/priority filtering.

### 📢 Notice Management

Society management can publish notices with categories such as:

- Maintenance
- Emergency
- Event
- Community
- Rules

Important notices can also be pinned.

---

# 📊 Database

The application uses **PostgreSQL** with **Prisma ORM**.

The database models the major application entities including:

```text
Users
Units
Complaints
Complaint Status History
Notices
Maintenance Settings
```

This allows the application to maintain relationships between residents, complaints, notices and operational data.

---

# 🚀 Deployment

## Recommended Deployment

For the current Express + Vite architecture, a Node-compatible hosting platform such as **Render** is a straightforward deployment option.

Recommended architecture:

```text
                 GitHub
                    │
                    ▼
                 Render
                    │
          ┌─────────┴─────────┐
          │                   │
       Express             Vite
       Backend            Frontend
          │
          ▼
       Prisma
          │
          ▼
   PostgreSQL / Neon
```

---

## Production Build

```bash
npm install
npm run build
```

Start the production server:

```bash
npm start
```

---

## Production Environment Variables

Configure these in your hosting provider:

```text
DATABASE_URL
JWT_SECRET
ADMIN_SETUP_SECRET
RESEND_API_KEY
RESEND_FROM_EMAIL
```

If file/image storage is enabled, configure the required storage credentials as well.

---

## PostgreSQL

A managed PostgreSQL provider such as Neon can be used for production.

Set:

```env
DATABASE_URL="your-production-postgresql-connection-string"
```

Then run:

```bash
npx prisma migrate deploy
```

---

# 🔒 Security Notes

The following files and credentials should **never** be committed:

```text
.env
.env.local
.env.production
```

The repository uses `.gitignore` to exclude environment files.

Only `.env.example` should be committed.

Never expose:

- Database passwords
- JWT secrets
- API keys
- Admin setup secrets
- Email service credentials
- Cloud storage credentials

---

# 📈 Future Improvements

The project can be extended with:

- 📱 Progressive Web App / dedicated mobile experience
- 🔔 Push notifications
- 💬 Real-time resident-management chat
- 📊 Advanced SLA analytics
- 📈 Maintenance performance dashboards
- 💳 Online maintenance payment integration
- ☁️ Production-grade image storage/CDN
- 🧪 Automated unit and integration testing
- 🔄 CI/CD pipeline
- 🌐 Custom domain
- 📡 Production monitoring and logging

---

# 🌟 Why This Project?

Oakwood Heights goes beyond a basic complaint form.

It models the complete maintenance workflow of a residential society:

```text
Report
   ↓
Review
   ↓
Assign
   ↓
Work
   ↓
Resolve
   ↓
Audit
```

The project demonstrates practical full-stack engineering concepts including:

- Authentication
- Authorization
- REST APIs
- Database design
- Prisma ORM
- PostgreSQL
- React component architecture
- State management
- Responsive UI
- Search and filtering
- Complaint lifecycle management
- Administrative workflows
- Email notifications
- Production deployment architecture

---

# 💼 Portfolio Value

This project demonstrates experience with:

```text
Frontend Development
        +
Backend Development
        +
Database Engineering
        +
Authentication
        +
REST APIs
        +
Role-Based Access
        +
Cloud Deployment
        +
Product/UI Design
```

Rather than being only a visual frontend project, Oakwood Heights is designed as a **functional full-stack product with realistic business workflows**.

---

# 👩‍💻 Author

## Paramjyot Kaur

**B.Tech Computer Science (AI/ML)**

### Connect

[![GitHub](https://img.shields.io/badge/GitHub-paramjyot2004-181717?logo=github)](https://github.com/paramjyot2004)

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Paramjyot%20Kaur-0A66C2?logo=linkedin&logoColor=white)](https://www.linkedin.com/in/paramjyot-kaur-4373a128)

---

# 📄 License

This project is currently intended as a portfolio and academic project.

---

<div align="center">

### 🏢 Oakwood Heights

**Report. Track. Resolve.**

Built with ❤️ using React, TypeScript, Express, Prisma and PostgreSQL.

</div>
