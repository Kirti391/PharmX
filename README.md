# PharmX — Pharma Ecosystem Platform (MERN Stack)

A full-stack MERN (MongoDB, Express, React, Node) implementation of the pharma ecosystem platform:
Pharma Companies ↔ Medical Representatives (MR/Independent) ↔ Stockists/Distributors ↔ Pharmacies,
connected through discovery, smart matching, appointments with disruption handling, real-time
messaging, and an admin verification workflow.

This is a MERN rebuild of an earlier SQLite/Next.js version of the same product — same feature set,
same data model, ported onto MongoDB + Mongoose on the backend and plain React (Vite) + React Router
on the frontend. **No OTP/SMS verification step** — signup activates the account immediately, since
OTP delivery would need a real SMS provider anyway (see `backend/src/modules/auth/service.js` for
where that would plug in later if you want it).

```
pharmx/
├── backend/    Express + Mongoose API, Socket.IO
└── frontend/   React (Vite) + React Router + Tailwind v4
```

---

## 1. Quick start

Requires Node.js 18+ and a running MongoDB instance (local `mongod`, or point `MONGODB_URI` at a
MongoDB Atlas cluster — either works with zero code changes).

### Backend

```bash
cd backend
npm install
npm run seed     # creates demo accounts + sample requirement/opportunity
npm run dev       # http://localhost:4000
```

### Frontend (in a second terminal)

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

Open http://localhost:5173. Log in with any of the seeded demo accounts (password for all:
`Password123!`):

| Role | Email |
|---|---|
| Admin | `admin@pharmx.dev` |
| Pharma Company | `company1@pharmx.dev` |
| MR (company-affiliated) | `mr1@pharmx.dev` |
| Independent MR | `mr2@pharmx.dev` |
| Pharmacy | `pharmacy1@pharmx.dev` |
| Pharmacy (pending verification) | `pending.pharmacy@pharmx.dev` |
| Stockist | `stockist1@pharmx.dev` |
| Distributor | `distributor1@pharmx.dev` |

Or sign up fresh from the landing page — since there's no OTP step, the account is usable immediately.

---

## 2. What's real vs. what's simplified

**Fully implemented, same feature set as the original build:**
- JWT auth (access + rotating refresh tokens), per-role signup, password reset — no OTP step (see above)
- Role-specific profiles (MR, Pharma Company, Pharmacy, Stockist/Distributor) with edit forms
- Discovery/search across all four profile types with filters
- Explainable matching engine (category + territory + availability scoring) for requirements and opportunities
- Requirements marketplace (pharmacies post, matching fires notifications automatically)
- Opportunities marketplace (companies post, MRs apply, companies shortlist/accept/reject)
- Connections (request/accept/decline)
- Appointments: booking, running-late/emergency/cancel/complete status updates, full reschedule
  negotiation (propose → auto-suggested alternative slots → other party confirms)
- Real-time chat (Socket.IO) and real-time notification delivery
- Admin console: user verification/reject/suspend, document review, audit log, analytics overview
- File uploads (profile images, verification documents) served locally

**Deliberately simplified:**
- **No OTP verification** (explicit design choice for this build — see above)
- **File storage**: local disk (`backend/uploads/`) instead of S3/Cloudinary
- **Categories**: a shared constant list rather than an admin-editable database table
- **Matching engine**: transparent rule-based scoring, not a learned/AI model

---

## 3. Design system

Color palette (as supplied):

| Token | Hex | Usage |
|---|---|---|
| `navy` | `#112D32` | Backgrounds, sidebar, hero sections |
| `tealdeep` | `#254E58` | Secondary panels, accents on dark backgrounds |
| `sage` | `#88BDBC` | Primary actions, links, active states |
| `taupedark` | `#4F4A41` | Body text, borders |
| `taupe` | `#6E6658` | Secondary/muted text |

Typography: **Plus Jakarta Sans** for headings/display text, **Inter** for body text — loaded via a
Google Fonts `<link>` in `frontend/index.html` (not a build-time font import, so the production build
never depends on reaching Google Fonts at build time).

Iconography: [lucide-react](https://lucide.dev), matching the original design principle of abstract
network/pharma motifs (pill capsules, building/network icons) rather than literal clinical clip-art.
The landing page's hero illustration is original inline SVG (a molecule/network motif), not a stock
photo.

Tailwind v4 is configured CSS-first via `@theme` in `frontend/src/index.css` — there's no
`tailwind.config.js` in this version (that's a v3-era file; v4 replaced it with this approach).

---

## 4. Environment variables

**backend/.env**:
```
MONGODB_URI=mongodb://localhost:27017/pharmx
JWT_ACCESS_SECRET=dev_access_secret_change_me
JWT_REFRESH_SECRET=dev_refresh_secret_change_me
PORT=4000
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```
Production-only variables (see `backend/src/config/env.js`):
```
UPLOAD_DIR=/data/uploads      # points uploaded files at a persistent volume
PUBLIC_URL=https://your-backend-url   # makes uploaded-file URLs resolve correctly behind a proxy
```

**frontend/.env**:
```
VITE_API_URL=http://localhost:4000/api/v1
VITE_SOCKET_URL=http://localhost:4000
```

---

## 5. How this was verified

MongoDB itself couldn't be provisioned in the sandbox this was built in (no path to MongoDB's
binaries from that environment — the same category of restriction that affected an earlier
Prisma/PostgreSQL attempt on a related project). So verification here happened in layers:

1. **Syntax check** — every backend `.js` file passed `node --check`.
2. **Import/require resolution** — every route, service, and model file was `require()`'d in isolation
   and loaded without error (catches typo'd paths, missing exports, circular-require issues).
3. **Full app boot test** — `node src/main.js` was run for real: Express assembled, all 13 route
   modules mounted, Socket.IO gateway initialized, and it failed at exactly the expected point —
   `ECONNREFUSED 127.0.0.1:27017` — confirming everything *before* the database connection is correct.
4. **Frontend production build** — `npm run build` completed with zero errors across all 24 pages;
   the dev server was also started and each route confirmed to return `200`.

**What this means for you:** the code is structurally sound and every request/response shape between
frontend and backend was manually cross-checked against the actual route handlers — but the actual
database read/write behavior (does a signup really persist, does matching really score correctly
against real documents) has not been exercised against a live MongoDB instance. That's the first
thing to confirm on your machine: `npm run seed`, then log in and click through the core loop (post a
requirement as `pharmacy1@pharmx.dev`, confirm `mr1@pharmx.dev` gets a live notification). If that
works, everything downstream almost certainly does too, since it exercises the database, the matching
engine, and the realtime pipeline all at once.

---

## 6. Production build

```bash
cd backend && npm start          # after npm install
cd frontend && npm run build && npm run preview   # or serve dist/ with any static host
```
