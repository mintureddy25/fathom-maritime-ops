# Fathom — Maritime Operations & Compliance System

A full-stack platform for a marine organization to manage ship maintenance,
schedule and track safety drills, and monitor compliance across the fleet.

- **Frontend:** React + TypeScript + Vite + Tailwind + React Query + Recharts
- **Backend:** Node.js + Express + Sequelize + MySQL
- **Auth:** JWT, bcrypt, role-based access (admin / crew)

---

## Features

### Ship Maintenance
- Admin can create maintenance tasks against any ship, set priority, due date,
  and optionally assign a crew member.
- Crew see only the tasks assigned to them, can update status
  (`pending → in_progress → completed`), and post notes/comments on the task.
- Tasks past their due date that are not yet completed are flagged as
  **overdue** and influence compliance scoring.

### Safety Drills
- Admin schedules drills (fire, evacuation, man overboard, oil-spill,
  security, medical) for a specific ship at a specific date/time.
- Crew of that ship can view upcoming drills, mark their own attendance,
  and add remarks.
- Admin can mark a drill as completed and add post-drill notes.
- Any drill whose scheduled time has passed without being completed is
  automatically marked as **missed** when the dashboard is loaded.

### Compliance Dashboard
- **Admin view** — fleet-wide compliance score with per-ship breakdown,
  pie charts for maintenance and drill mix, and a comparative bar chart
  across all ships.
- **Crew view** — personal task summary, upcoming drills for the assigned
  ship, and a recent participation log.

### Bonus Features Implemented
- Role-based access control on every protected route, both API-side and UI-side.
- Filters on the maintenance and drill listings (ship, status, due window,
  overdue-only).
- Visual highlighting of overdue tasks and missed drills.
- Recharts bar/pie charts for compliance visualisation.
- Docker setup with `docker-compose` (MySQL + backend + nginx-served frontend).

---

## Architecture

```
┌────────────────┐    HTTP/JSON    ┌──────────────────┐    Sequelize    ┌────────────┐
│  React (Vite)  │ ───────────────▶│  Express API     │ ───────────────▶│   MySQL    │
│  + React Query │                 │  + JWT auth      │                 │  (Aiven /  │
│  + Recharts    │ ◀────────────── │  + RBAC middleware                 │   docker)  │
└────────────────┘                 └──────────────────┘                 └────────────┘
```

### Why these choices

- **Sequelize over Prisma**: the schema is small but has clear relations
  (Ship hasMany Tasks/Drills, etc.), and Sequelize migrations + seeders make
  the project trivially reproducible. Adapter is a plain `mysql2` driver.
- **React Query** for server state — keeps the dashboard components free of
  manual refetch / cache logic. Mutations invalidate the `compliance` queries
  so any state change visibly refreshes the dashboard.
- **Zustand (with `persist`)** for the small slice of client state that needs
  to survive a refresh — namely the auth token and user.
- **Compliance is a service, not a controller**: `src/services/compliance.js`
  computes the metrics in one place; controllers only shape HTTP responses.
- **Soft system actions**: when the dashboard loads, drills past their date
  are auto-marked missed (`autoMarkMissedDrills`) so the data stays honest
  without a separate cron.

### Compliance scoring

For each ship:

```
maintenance_pct       = completed_tasks / total_tasks
drill_completion_pct  = completed_drills / drills_whose_date_has_passed
participation_pct     = attended_marks / (crew_size × completed_drills)

overall = round(0.5 × maintenance_pct
              + 0.3 × drill_completion_pct
              + 0.2 × participation_pct)
```

Classification: ≥ 90 → `compliant`, ≥ 70 → `at_risk`, else `non_compliant`.

Fleet score is the average of per-ship overall scores.

---

## Setup (local, against your own MySQL)

### 1. Backend

```bash
cd backend
cp .env.example .env             # then fill in your DB host / creds
npm install
npm run db:migrate
npm run db:seed
npm run dev                      # listens on http://localhost:4000
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env             # VITE_API_URL=http://localhost:4000/api
npm install
npm run dev                      # opens http://localhost:5173
```

### 3. Demo accounts (created by the seeder)

| Role  | Email             | Password   |
|-------|-------------------|------------|
| Admin | admin@fathom.io   | admin123   |
| Crew  | rao@fathom.io     | crew123    |
| Crew  | khan@fathom.io    | crew123    |
| Crew  | iyer@fathom.io    | crew123    |

---

## Setup (Docker)

A single-command bring-up using `docker-compose` is also provided. It boots
MySQL, runs migrations + seeders, starts the backend, and serves the frontend
through nginx with an `/api/` reverse-proxy onto the backend container.

```bash
docker compose up --build
# frontend → http://localhost:8080
# backend  → http://localhost:4000
# mysql    → localhost:3306 (root/rootpw)
```

---

## API surface

| Method | Path                              | Auth        | Notes                                    |
|--------|-----------------------------------|-------------|------------------------------------------|
| POST   | /api/auth/login                   | public      | Returns `{ token, user }`                |
| GET    | /api/auth/me                      | any         |                                          |
| GET    | /api/ships                        | any         |                                          |
| POST   | /api/ships                        | admin       |                                          |
| GET    | /api/ships/:id                    | any         |                                          |
| GET    | /api/users                        | admin       | Filter by `role`, `ship_id`              |
| POST   | /api/users                        | admin       |                                          |
| GET    | /api/tasks                        | any         | Crew sees only their own; admins see all |
| POST   | /api/tasks                        | admin       |                                          |
| GET    | /api/tasks/:id                    | any         | Crew restricted to assigned tasks        |
| PATCH  | /api/tasks/:id                    | admin       |                                          |
| PATCH  | /api/tasks/:id/status             | admin / assignee |                                     |
| POST   | /api/tasks/:id/comments           | admin / assignee |                                     |
| GET    | /api/drills                       | any         | Crew limited to their ship               |
| POST   | /api/drills                       | admin       |                                          |
| PATCH  | /api/drills/:id/complete          | admin       |                                          |
| POST   | /api/drills/:id/attendance        | any         | Marks own attendance                     |
| GET    | /api/compliance/fleet             | admin       | Dashboard payload                        |
| GET    | /api/compliance/ship/:id          | any         |                                          |
| GET    | /api/compliance/crew              | crew        | Personal summary                         |

---

## Project layout

```
fathom_marine_assessment/
├── backend/
│   ├── src/
│   │   ├── config/        # sequelize + DB bootstrap
│   │   ├── models/        # Sequelize models
│   │   ├── migrations/    # Schema migrations
│   │   ├── seeders/       # Demo fleet + crew + tasks + drills
│   │   ├── controllers/   # HTTP handlers
│   │   ├── routes/        # Express routes (RBAC at edges)
│   │   ├── middleware/    # auth, error handling
│   │   ├── services/      # compliance scoring
│   │   ├── utils/         # jwt, http helpers
│   │   ├── app.js
│   │   └── server.js
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/           # axios client + endpoint definitions
│   │   ├── components/    # Badge, StatCard, Protected
│   │   ├── layouts/       # AppLayout (top-nav + footer)
│   │   ├── pages/         # Login, Dashboard, Maintenance, Drills, Ships, Crew
│   │   ├── store/         # zustand auth store
│   │   └── types/
│   ├── Dockerfile + nginx.conf
│   └── .env.example
├── docker-compose.yml
├── BUSINESS_FLOW.md
└── README.md
```

---

## Submission checklist

- [x] GitHub repo with backend + frontend
- [x] Business flow document → `BUSINESS_FLOW.md`
- [x] README with setup steps + architecture decisions
- [x] Deployable via docker-compose (and standard local dev flows)
