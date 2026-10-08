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



Or sign up fresh from the landing page — since there's no OTP step, the account is usable immediately.
Doctors and distributor/stockist accounts can register through the role selector. Administrator access
is available at `/admin/login`; admin accounts are provisioned by an existing administrator or the
development seed and cannot be created through public signup.

Run `npm run seed` again at any time to restore the demo accounts' shared password and add any
missing sample records. The idempotent development fixtures include products, open requirements
and opportunities, responses and applications, accepted/pending connections, appointments,
messages, notifications, an MR lead/follow-up, and a pending verification review. Demo
verification screens link to a clearly labeled placeholder file, not a real licence or identity
document. The seed command refuses to run with `NODE_ENV=production`.

For a larger test network, run `npm run seed:demo` from `backend/`. This additive seed creates
five fictional accounts for each role, complete role profiles, pharmacy requirements, accepted
connections, doctor appointment requests and confirmed appointments, and messaging conversations.
It is idempotent and does not delete existing records. All demo accounts use
`PharmXDemo!2026`; their emails follow `demo.<role>.<number>@pharmx.dev` (for example,
`demo.doctor.01@pharmx.dev`). The seed only runs outside production and only against local
MongoDB by default. Setting `PHARMX_ALLOW_REMOTE_DEMO_SEED=true` explicitly permits a dedicated
remote non-production database.

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
- Verified company-to-MR authorization scoped by product category, territory, and expiry
- Role-scoped lead pipelines with audited stage changes and follow-up reminders for companies,
  MRs, and verified distributors
- Company-managed, draft/publish product catalogues and discoverable C&F agent profiles; no
  ordering, inventory, payments, or prescription workflow
- Consent-based professional appointment requests and communications for verified doctors
- Real-time chat (Socket.IO), with sender-only message editing and soft deletion visible to both
  participants, plus real-time notification delivery
- Admin console: separately throttled admin sign-in; platform overview; role/status user filters,
  suspend/restore actions; document verification queue; company–MR authorization review; reports
  and reasoned decisions; filtered audit trail; admin account activity; and in-app notifications
- File uploads (profile images, verification documents) served locally

**Deliberately simplified:**
- **No OTP verification** (explicit design choice for this build — see above)
- **File storage**: local disk (`backend/uploads/`) instead of S3/Cloudinary
- **Categories**: a shared constant list rather than an admin-editable database table
- **Matching engine**: transparent rule-based scoring, not a learned/AI model
- **Admin security and operations**: admin sign-in is rate-limited and audited, but TOTP/SMS
  two-factor authentication, CAPTCHA, trusted-device/session management, granular admin roles,
  assignment/task workflows, privacy/deletion requests, licence automation, and system
  configuration are not implemented. Admin activity is limited to operational review and must
  not be used for commercial prospecting.

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


## 4. How this was verified

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


