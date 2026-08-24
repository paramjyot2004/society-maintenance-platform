<div align="center">

# 🏢 Oakwood Heights — Society Maintenance Platform

### A full-stack residential society maintenance and facility management system

Residents can raise maintenance complaints, track their progress, view complaint history, read society notices, check maintenance dues, and browse facility staff.

Administrators can monitor society-wide complaints, manage priorities and statuses, review complaint history, assign facility staff, publish notices, and monitor operational statistics.

**Built with React + TypeScript + Vite + Express + PostgreSQL + Prisma**

<br/>

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)

<br/>

### 🚀 Live Demo

<a href="https://society-maintenance-platform.onrender.com" target="_blank">
  <img src="https://img.shields.io/badge/🚀%20Open%20Live%20Demo-00A99D?style=for-the-badge" alt="Open Live Demo">
</a>

</div>

---

# ✨ Overview

**Oakwood Heights** is a full-stack society maintenance and facility management platform designed around a realistic residential maintenance workflow.

The platform provides separate role-based experiences for:

- 👤 Residents
- 🛡️ Administrators

The application uses a React frontend, Express backend, Prisma ORM, and PostgreSQL database to provide persistent complaint and society-management workflows.

---

# 🎯 Core Features

## 👤 Resident Portal

Residents can:

- 🔐 Register and log in securely
- 🎫 Raise maintenance complaints
- 📊 Track complaint progress
- 🧾 View complaint history
- 🔄 Track complaint lifecycle
- 🏷️ View complaint category and priority
- 🔎 Search and filter complaints
- 📢 Read society notices
- 📌 View pinned important notices
- 💳 View maintenance dues
- 👷 Browse facility staff
- 📱 Use a responsive resident dashboard

### Complaint Lifecycle

```text
Complaint Created
       ↓
      Open
       ↓
   In Progress
       ↓
    Resolved
```

Residents can monitor the status of their complaints through the resident portal.

---

# 🛡️ Admin Portal

The administration portal provides society-wide management capabilities.

Administrators can:

- 📊 View dashboard statistics
- 🎫 View all resident complaints
- 🔎 Search and filter complaints
- ⚡ Manage complaint priorities
- 🔄 Update complaint statuses
- 🧾 View complaint status history
- 👷 Assign complaints to facility staff
- 👥 View residents and units
- 📢 Create and manage society notices
- 📌 Pin important notices
- ⚙️ Manage maintenance settings
- 📈 Monitor operational statistics

The administrator has a society-wide view of complaints, while residents only see their own complaints.

---

# 🎫 Complaint Management Flow

The complaint system follows a complete resident-to-administrator workflow:

```text
                    Resident
                       │
                       ▼
               Raise Complaint
                       │
                       ▼
              POST /api/complaints
                       │
                       ▼
                 Express API
                       │
                       ▼
                  Prisma ORM
                       │
                       ▼
                PostgreSQL DB
                       │
                       ▼
              Admin Complaint View
                       │
             ┌─────────┼─────────┐
             ▼         ▼         ▼
          Review     Assign    Prioritize
                       │
                       ▼
                 Update Status
                       │
                       ▼
             Open → In Progress
                       │
                       ▼
                    Resolved
                       │
                       ▼
             Resident Tracks Update
```

This ensures that complaints created by residents are persisted in PostgreSQL and are available to administrators through the admin portal.

---

# 🧭 Application Workflow

```text
                     Login / Registration
                              │
                 ┌────────────┴────────────┐
                 │                         │
              RESIDENT                   ADMIN
                 │                         │
                 ▼                         ▼
         Resident Portal            Admin Dashboard
                 │                         │
       ┌─────────┼─────────┐       ┌───────┼─────────┐
       │         │         │       │       │         │
   Complaints  Notices   Dues  Complaints Notices  Settings
       │
       ▼
 Open → In Progress → Resolved
```

---

# 🖥️ Screenshots

## 🏠 Resident Dashboard

The resident dashboard provides an overview of complaints, maintenance information, notices, and important society updates.

![Resident Dashboard](docs/screenshots/resident-dashboard.png)

---

## 🛡️ Admin Dashboard

The admin dashboard provides society-wide complaint statistics and administrative controls.

![Admin Dashboard](docs/screenshots/admin-dashboard.png)

---

## 🎫 Admin Complaint Management

Administrators can view resident complaints, inspect ticket details, manage priorities, update statuses, and review complaint history.

![Admin Complaint Management](docs/screenshots/admin-complaints.png)

---

## 📢 Society Notices

Residents can access important society announcements, maintenance updates, and community notices from a centralized notice board.

![Society Notices](docs/screenshots/notices.png)

---

# 🏗️ Architecture

```mermaid
flowchart LR

    A[React + TypeScript + Vite]
    B[Express API]
    C[Authentication + RBAC]
    D[Prisma ORM]
    E[(PostgreSQL)]
    F[Email Service]
    G[File Upload Service]

    A --> B
    B --> C
    B --> D
    D --> E
    B --> F
    B --> G
```

---

# 🧱 Application Layers

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
| Deployment | Render |

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
- Protected administrator functionality

Sensitive credentials are never stored directly in the repository.

Environment files are excluded through `.gitignore`.

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
│   │   ├── AdminLoginPage.tsx
│   │   ├── AdminPortalView.tsx
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
├── app.ts
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
- npm
- Git

---

## 1. Clone the Repository

```bash
git clone https://github.com/paramjyot2004/society-maintenance-platform.git
cd society-maintenance-platform
```

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Configure Environment Variables

Create a `.env` file using `.env.example` as a reference.

Example:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"

JWT_SECRET="your-secure-jwt-secret"

ADMIN_SETUP_SECRET="your-admin-bootstrap-secret"

RESEND_API_KEY="your-resend-api-key"

RESEND_FROM_EMAIL="Oakwood Heights <notifications@yourdomain.com>"
```

> Never commit the actual `.env` file.

---

## 4. Generate Prisma Client

```bash
npx prisma generate
```

---

## 5. Set Up the Database

For a development database using Prisma migrations:

```bash
npx prisma migrate dev
```

For a production database with existing migrations:

```bash
npx prisma migrate deploy
```

---

## 6. Start the Application

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
| `npm run lint` | Run lint/type checks |
| `npx prisma generate` | Generate Prisma Client |
| `npx prisma migrate dev` | Run development migrations |
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

## ♻️ Reusable Component Architecture

The frontend is organized into reusable components for:

- Complaints
- Notices
- Authentication
- Staff
- Billing
- Dashboard statistics
- Admin management
- Resident management

---

## 🔒 Role-Based Access Control

The platform separates resident and administrator experiences:

```text
RESIDENT
   ↓
Resident Portal

ADMIN
   ↓
Admin Portal
```

Administrative actions are protected on the server and are not dependent only on frontend visibility.

---

## 🧾 Complaint Lifecycle

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

Complaint status history provides an auditable record of status changes.

---

## 👷 Staff Assignment

Administrators can associate complaints with facility staff based on the maintenance category.

The complaint record supports staff assignment information such as:

- Staff ID
- Staff name
- Staff contact
- Assignment information

---

## 🔎 Search & Filtering

The platform provides complaint search and filtering capabilities based on information such as:

- Complaint status
- Category
- Priority
- Search terms

---

## 📢 Notice Management

Administrators can publish society notices for categories such as:

- Maintenance
- Emergency
- Event
- Community
- Rules

Important notices can also be pinned.

---

# 📊 Database

The application uses **PostgreSQL** with **Prisma ORM**.

Major database entities include:

```text
Users
Units
Complaints
Complaint Status History
Notices
Maintenance Settings
```

Complaint records contain information such as:

```text
Ticket Number
Title
Description
Category
Priority
Status
Resident
Unit
Tower
Assigned Staff
Resolution Information
Created At
Updated At
```

The database allows the platform to maintain relationships between residents, units, complaints, notices, and operational data.

---

# 🚀 Deployment

The application is deployed using **Render**.

### Live Application

**https://society-maintenance-platform.onrender.com**

### Production Architecture

```text
GitHub
   │
   ▼
Render
   │
   ├── Node.js + Express
   │
   └── Vite Frontend
          │
          ▼
       Prisma
          │
          ▼
     PostgreSQL
```

The application is built using:

```bash
npm run build
```

and started using:

```bash
npm start
```

---

# 🌐 Production Environment Variables

Production environment variables should be configured through the hosting provider rather than committed to the repository.

Required variables may include:

```text
DATABASE_URL
JWT_SECRET
ADMIN_SETUP_SECRET
RESEND_API_KEY
RESEND_FROM_EMAIL
```

If file/image storage is enabled, the required storage credentials should also be configured through the hosting provider.

---

# 🔒 Security Notes

The following files should never be committed:

```text
.env
.env.local
.env.production
```

Only `.env.example` should be committed.

Never expose:

- Database passwords
- JWT secrets
- API keys
- Administrator setup secrets
- Email service credentials
- Cloud storage credentials

---

# ✅ Tested Workflows

The following core workflows have been tested during development:

- ✅ Resident registration/login
- ✅ Administrator login
- ✅ Resident complaint creation
- ✅ Complaint persistence in PostgreSQL
- ✅ Resident complaint history
- ✅ Administrator society-wide complaint visibility
- ✅ Complaint search and filtering
- ✅ Complaint priority management
- ✅ Complaint status management
- ✅ Complaint status history
- ✅ Resident-to-admin complaint synchronization
- ✅ Admin dashboard complaint statistics
- ✅ Society notices
- ✅ Role-based resident/admin access
- ✅ Production build
- ✅ Render deployment

---

# 📈 Future Improvements

Potential future improvements include:

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
Prioritize
   ↓
Work
   ↓
Resolve
   ↓
Track
   ↓
Audit
```

The project demonstrates practical full-stack engineering concepts including:

- Authentication
- Authorization
- Role-based access control
- REST APIs
- Database design
- Prisma ORM
- PostgreSQL
- React component architecture
- State management
- Responsive UI
- Search and filtering
- Complaint lifecycle management
- Staff assignment
- Administrative workflows
- Notice management
- Production deployment

---

# 💼 Portfolio Value

This project demonstrates experience across:

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
Complaint Management
        +
Cloud Deployment
        +
Product/UI Design
```

Rather than being only a visual frontend project, Oakwood Heights is designed as a functional full-stack product with realistic business workflows and persistent database-backed operations.

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
