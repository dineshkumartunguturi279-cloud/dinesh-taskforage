# 🚀 TaskFlow — Team Task Manager

A production-grade, full-stack collaborative task management platform built with **Django REST Framework** and **React + Vite**. Features role-based access control, JWT authentication via httpOnly cookies, real-time dashboard analytics, and Railway-ready deployment.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Local Setup](#local-setup)
- [Railway Deployment](#railway-deployment)
- [Environment Variables](#environment-variables)
- [API Overview](#api-overview)
- [Folder Structure](#folder-structure)
- [Demo Credentials](#demo-credentials)
- [Screenshots](#screenshots)

---

## 🏗️ Overview

TaskFlow is a simplified Trello/Asana-like platform where teams can:

- **Create projects** and invite members
- **Assign roles** (Admin / Member) with strict RBAC
- **Create, assign, and track tasks** across projects
- **Monitor progress** through an analytics dashboard
- **Filter, search, and sort** tasks by status, priority, and due date

---

## 🏛️ Architecture

```
┌─────────────────────┐     HTTP (Cookies)     ┌──────────────────────┐
│   React Frontend    │ ◄──────────────────────► │   Django Backend     │
│   (Vite + Tailwind) │                          │   (DRF + JWT)        │
│   Port: 5173        │                          │   Port: 8000         │
└─────────────────────┘                          └──────────┬───────────┘
                                                            │
                                                 ┌──────────▼───────────┐
                                                 │   PostgreSQL DB      │
                                                 │   taskmanager        │
                                                 └──────────────────────┘
```

- **Frontend** proxies API calls to the backend via Vite dev proxy (dev) or CORS (production)
- **JWT tokens** are stored in httpOnly cookies for security
- **Auto token refresh** with seamless 401 retry queue

---

## ⚙️ Tech Stack

| Layer          | Technology                          |
|----------------|-------------------------------------|
| Frontend       | React 18, Vite, TailwindCSS         |
| Routing        | React Router v6                     |
| HTTP Client    | Axios (with interceptors)           |
| State          | React Context API                   |
| Charts         | Recharts                            |
| Icons          | Lucide React                        |
| Notifications  | React Hot Toast                     |
| Backend        | Django 5, Django REST Framework      |
| Auth           | djangorestframework-simplejwt        |
| Database       | PostgreSQL                          |
| ORM            | Django ORM                          |
| CORS           | django-cors-headers                 |
| Static Files   | WhiteNoise                          |
| Deployment     | Railway (Gunicorn)                  |

---

## ✨ Features

### Authentication
- Email-based signup/login
- Password validation (min 8 chars, uppercase, lowercase, number)
- JWT access + refresh tokens in httpOnly cookies
- Persistent login across sessions
- Auto redirect for unauthenticated users
- Token refresh with retry queue

### Role-Based Access Control (RBAC)
- **ADMIN**: Full CRUD on projects, tasks, members
- **MEMBER**: View projects/tasks, update only status of assigned tasks
- Backend-enforced permissions (not just frontend)

### Projects
- Create, edit, delete projects
- Add/remove members by email
- Promote/demote member roles
- Transfer project ownership
- Search projects

### Tasks
- Create, edit, delete tasks (admin only)
- Assign multiple users per task
- Track status: TODO → IN_PROGRESS → DONE
- Priority levels: LOW, MEDIUM, HIGH, CRITICAL
- Due date tracking with overdue detection
- Filter by status, priority, due date
- Search by title/description
- Sort by date, priority, title

### Dashboard
- Total tasks, projects, overdue counts
- Task status distribution (pie chart)
- Priority breakdown (bar chart)
- Tasks per project with progress bars
- Personal task stats
- Recent tasks table

### UI/UX
- Dark theme with glassmorphism design
- Responsive sidebar layout
- Mobile-friendly with hamburger menu
- Loading skeletons
- Toast notifications
- Empty states
- Modal dialogs
- Badge system for roles, statuses, priorities

---

## 🛠️ Local Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+

### 1. Clone & Setup Backend

```bash
cd task

# Create PostgreSQL database
psql -U postgres -c "CREATE DATABASE taskmanager;"

# Install Python dependencies
pip install -r requirements.txt

# Create .env file (copy from .env.example)
cp .env.example .env
# Edit .env with your database credentials

# Run migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Start backend
python manage.py runserver 8000
```

### 2. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

### 3. Access the app
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/api/
- Admin Panel: http://localhost:8000/admin/

---

## 🚂 Railway Deployment

### Backend Deployment

1. **Create a new Railway project**
2. **Add PostgreSQL** plugin from Railway dashboard
3. **Deploy backend** from GitHub:
   - Set root directory to `/` (project root)
   - Railway will detect `Procfile` and `requirements.txt`
4. **Set environment variables:**

```
SECRET_KEY=<generate-a-strong-key>
DEBUG=False
ALLOWED_HOSTS=<your-railway-domain>
CORS_ALLOWED_ORIGINS=https://<your-frontend-domain>
FRONTEND_URL=https://<your-frontend-domain>
DATABASE_URL=<auto-set-by-railway>
```

5. **Run migrations** via Railway CLI or deploy command:
```bash
python manage.py migrate
```

### Frontend Deployment

1. **Create another Railway service** for the frontend
2. Set root directory to `/frontend`
3. Build command: `npm run build`
4. Start command: `npx serve dist -s -l $PORT`
5. Set environment variable:
```
VITE_API_URL=https://<your-backend-domain>
```

---

## 🔐 Environment Variables

### Backend (.env)

| Variable              | Description                    | Example                              |
|-----------------------|--------------------------------|--------------------------------------|
| `SECRET_KEY`          | Django secret key              | `django-insecure-...`                |
| `DEBUG`               | Debug mode                     | `True` / `False`                     |
| `DATABASE_URL`        | PostgreSQL connection URL      | `postgresql://user:pass@host/db`     |
| `ALLOWED_HOSTS`       | Comma-separated hosts          | `localhost,127.0.0.1`                |
| `CORS_ALLOWED_ORIGINS`| Comma-separated frontend URLs  | `http://localhost:5173`              |
| `FRONTEND_URL`        | Frontend URL                   | `http://localhost:5173`              |

### Frontend (.env)

| Variable         | Description              | Example                    |
|------------------|--------------------------|----------------------------|
| `VITE_API_URL`   | Backend API base URL     | `http://localhost:8000`    |

---

## 📡 API Overview

### Authentication
| Method | Endpoint                    | Description            |
|--------|-----------------------------|------------------------|
| POST   | `/api/auth/signup/`         | Register new user      |
| POST   | `/api/auth/login/`          | Login                  |
| POST   | `/api/auth/logout/`         | Logout                 |
| POST   | `/api/auth/refresh/`        | Refresh access token   |
| GET    | `/api/auth/profile/`        | Get profile            |
| PATCH  | `/api/auth/profile/`        | Update profile         |
| POST   | `/api/auth/change-password/`| Change password        |

### Projects
| Method | Endpoint                              | Description              |
|--------|---------------------------------------|--------------------------|
| GET    | `/api/projects/`                      | List user's projects     |
| POST   | `/api/projects/`                      | Create project           |
| GET    | `/api/projects/:id/`                  | Get project details      |
| PATCH  | `/api/projects/:id/`                  | Update project           |
| DELETE | `/api/projects/:id/`                  | Delete project           |
| GET    | `/api/projects/:id/members/`          | List members             |
| POST   | `/api/projects/:id/members/`          | Add member               |
| PATCH  | `/api/projects/:id/members/:mid/`     | Update member role       |
| DELETE | `/api/projects/:id/members/:mid/`     | Remove member            |
| POST   | `/api/projects/:id/transfer-ownership/`| Transfer ownership      |

### Tasks
| Method | Endpoint                                       | Description            |
|--------|-------------------------------------------------|------------------------|
| GET    | `/api/tasks/project/:pid/`                      | List project tasks     |
| POST   | `/api/tasks/project/:pid/`                      | Create task            |
| GET    | `/api/tasks/project/:pid/:tid/`                 | Get task details       |
| PATCH  | `/api/tasks/project/:pid/:tid/`                 | Update task            |
| DELETE | `/api/tasks/project/:pid/:tid/`                 | Delete task            |
| PATCH  | `/api/tasks/project/:pid/:tid/status/`          | Update status only     |
| GET    | `/api/tasks/my-tasks/`                          | Get my assigned tasks  |
| GET    | `/api/tasks/dashboard/`                         | Dashboard analytics    |

---

## 📁 Folder Structure

```
task/
├── backend/                # Django project settings
│   ├── settings.py         # Main configuration
│   ├── urls.py             # Root URL routing
│   ├── exceptions.py       # Custom exception handler
│   └── wsgi.py             # WSGI application
├── accounts/               # User authentication app
│   ├── models.py           # Custom User model
│   ├── serializers.py      # Auth serializers
│   ├── views.py            # Auth views
│   ├── authentication.py   # Cookie JWT auth class
│   └── urls.py             # Auth URLs
├── projects/               # Projects management app
│   ├── models.py           # Project, ProjectMember models
│   ├── serializers.py      # Project serializers
│   ├── views.py            # Project CRUD + member mgmt
│   ├── permissions.py      # RBAC permission classes
│   └── urls.py             # Project URLs
├── tasks/                  # Task management app
│   ├── models.py           # Task, TaskAssignment models
│   ├── serializers.py      # Task serializers
│   ├── views.py            # Task CRUD + dashboard
│   └── urls.py             # Task URLs
├── frontend/               # React application
│   ├── src/
│   │   ├── api/client.js   # Axios client + API methods
│   │   ├── context/        # Auth context provider
│   │   ├── components/     # Layout, shared components
│   │   ├── pages/          # All page components
│   │   ├── App.jsx         # Root app with routing
│   │   ├── main.jsx        # Entry point
│   │   └── index.css       # Design system
│   ├── vite.config.js      # Vite configuration
│   └── package.json        # Frontend dependencies
├── requirements.txt        # Python dependencies
├── Procfile                # Railway deployment
├── runtime.txt             # Python version
├── manage.py               # Django CLI
├── .env                    # Environment variables
├── .env.example            # Environment template
└── README.md               # This file
```

---

## 🔑 Demo Credentials

After running the application, create an account via the signup page:

| Field    | Value                |
|----------|----------------------|
| Name     | Demo Admin           |
| Email    | admin@taskflow.com   |
| Password | Admin123!            |

Then create a second account to test member functionality:

| Field    | Value                |
|----------|----------------------|
| Name     | Demo Member          |
| Email    | member@taskflow.com  |
| Password | Member123!           |

---

## 📸 Screenshots

> Screenshots can be added after running the application.

---

## 📄 License

MIT License
