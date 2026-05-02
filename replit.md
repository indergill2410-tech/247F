# Fixit 24/7 — On-Demand Home Repair Marketplace

## Overview

Full-stack on-demand home repair marketplace with three user roles (homeowner, tradie, admin), a matching engine, real-time notifications, and a mobile-first premium UI.

## Stack

- **Monorepo**: pnpm workspaces (TypeScript throughout)
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui + framer-motion (`artifacts/fixit247` → serves at `/`)
- **Backend**: Express 5 API server (`artifacts/api-server` → serves at `/api`)
- **Database**: PostgreSQL + Drizzle ORM (`lib/db`)
- **Auth**: JWT (jsonwebtoken) — Bearer token, stored in localStorage via zustand persist
- **API contract**: OpenAPI spec in `lib/api-spec/openapi.yaml` → Orval codegen → React Query hooks in `lib/api-client-react`
- **Validation**: Zod v4 + drizzle-zod (`lib/api-zod`)

## Architecture

```
artifacts/
  api-server/   — Express 5 backend (port 8080, proxied at /api)
  fixit247/     — React/Vite SPA (port 24867, proxied at /)
lib/
  api-spec/     — OpenAPI 3.0 spec + Orval config
  api-zod/      — Generated Zod schemas
  api-client-react/ — Generated React Query hooks + custom fetch
  db/           — Drizzle schema + migrations
```

## User Roles & Features

### Homeowner
- Post jobs (title, description, category, urgency, suburb/postcode, budget)
- View dashboard with job stats and recent activity
- Review tradie claims — accept/reject/mark complete
- Receive notifications (new claims, updates)

### Tradie
- Browse available jobs (open/matched)
- Claim jobs with optional message + price quote
- View personal dashboard (active jobs, completed, rating)
- Max 11 active jobs enforced server-side

### Admin
- Full platform overview (user/job counts)
- User management (suspend/activate)
- Browse all jobs

## Matching Engine
- `artifacts/api-server/src/lib/matching.ts`
- Triggered async when a job is posted
- Scores tradies by: nearby postcode (+3), matching suburb (+2), rating bonus
- Max 5 claims per job enforced

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/register | Register (homeowner/tradie) |
| POST | /api/auth/login | Login, returns JWT |
| GET | /api/auth/me | Current user profile |
| PUT | /api/auth/me | Update profile |
| GET | /api/categories | List all 12 trade categories |
| GET | /api/jobs | List jobs (filtered by role) |
| POST | /api/jobs | Create job (homeowner only) |
| GET | /api/jobs/:id | Job detail with claims |
| PUT | /api/jobs/:id | Update job |
| DELETE | /api/jobs/:id | Cancel job |
| GET | /api/jobs/:jobId/claims | List claims for job |
| POST | /api/jobs/:jobId/claims | Claim a job (tradie only) |
| PUT | /api/jobs/:jobId/claims/:claimId | Accept/reject/complete claim |
| GET | /api/dashboard/homeowner | Homeowner stats + recent jobs |
| GET | /api/dashboard/tradie | Tradie stats + available jobs |
| GET | /api/dashboard/admin | Platform-wide stats |
| GET | /api/notifications | User notifications |
| PUT | /api/notifications/:id/read | Mark notification read |
| POST | /api/notifications/read-all | Mark all read |
| GET | /api/notifications/unread-count | Unread count for bell badge |
| GET | /api/admin/users | Admin: list all users |
| PUT | /api/admin/users/:id | Admin: update user (suspend/activate) |
| GET | /api/admin/jobs | Admin: list all jobs |

## Frontend Pages

| Route | Component | Access |
|-------|-----------|--------|
| / | LandingPage | Public |
| /login | LoginPage | Public |
| /register | RegisterPage | Public |
| /dashboard | HomeownerDashboard | homeowner, admin |
| /dashboard/tradie | TradieDashboard | tradie, admin |
| /admin | AdminDashboard | admin only |
| /jobs | JobsPage | Authenticated |
| /jobs/new | PostJobPage | homeowner, admin |
| /jobs/:id | JobDetailPage | Authenticated |
| /notifications | NotificationsPage | Authenticated |
| /profile | ProfilePage | Authenticated |

## Design System

- **Primary**: Navy `hsl(222,47%,11%)`
- **Accent**: Amber `hsl(38,92%,50%)`
- **UI Library**: shadcn/ui components + custom elevation system
- **Animations**: framer-motion (page entry, card animations)

## Demo Accounts (seeded)

| Role | Email | Password |
|------|-------|----------|
| Homeowner | homeowner@fixit247.com | password123 |
| Tradie | tradie@fixit247.com | password123 |
| Admin | admin@fixit247.com | admin123 |

## Key Commands

```bash
# Regenerate API hooks from OpenAPI spec
pnpm --filter @workspace/api-spec run codegen

# Push DB schema changes (dev only)
pnpm --filter @workspace/db run push

# Typecheck all packages
pnpm run typecheck
```

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string (auto-set by Replit)
- `SESSION_SECRET` — JWT signing secret (set in Replit secrets)
- `PORT` — Service port (auto-set by Replit per artifact)
