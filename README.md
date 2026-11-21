# PharmUnis — Pharma Ecosystem Platform

PharmUnis is a full-stack MERN platform connecting pharmaceutical companies, medical representatives (MRs), pharmacies, stockists/distributors, and doctors. It provides role-specific profiles and dashboards, professional discovery, business opportunities, pharmacy requirements, appointments, messaging, and administrative verification workflows.

The application uses MongoDB and Mongoose on the backend, and React, Vite, React Router, and Tailwind CSS v4 on the frontend. Accounts are active immediately after signup; this build does not use OTP/SMS verification.

```text
pharmx/
├── backend/    Express + Mongoose API and Socket.IO
└── frontend/   React + Vite + React Router + Tailwind CSS v4
```

## Quick start

### Prerequisites

- Node.js 18 or newer
- MongoDB, running locally or available through MongoDB Atlas

### Start the backend

```bash
cd backend
npm install
npm run seed
npm run dev
```

The API listens on `http://localhost:4000` by default.

### Start the frontend

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

Vite serves the frontend at `http://localhost:5173`. The frontend uses `http://localhost:4000/api/v1` as its default API URL. Set `VITE_API_URL` when the API is hosted elsewhere.

### Environment configuration

The backend loads environment variables from `backend/.env` using `dotenv`. In development, it defaults to a local `pharmx` database and development JWT secrets. For deployment, configure at least:

```dotenv
NODE_ENV=production
PORT=4000
MONGODB_URI=mongodb://...
JWT_ACCESS_SECRET=<strong-random-secret>
JWT_REFRESH_SECRET=<different-strong-random-secret>
CORS_ORIGIN=https://your-frontend.example
```

Optional backend settings include `PUBLIC_URL` for externally accessible upload URLs and `UPLOAD_DIR` for choosing the local upload directory. Never use development JWT secrets in production.

## Demo data

`npm run seed` in `backend/` creates or updates the primary demo accounts and sample records. It is idempotent and refuses to run when `NODE_ENV=production`. The demo login password is `Password123!`.

| Role | Demo email |
|---|---|
| Admin | `admin@pharmx.dev` |
| Pharma company | `company1@pharmx.dev` |
| MR | `mr1@pharmx.dev` |
| Independent MR | `mr2@pharmx.dev` |
| Pharmacy | `pharmacy1@pharmx.dev` |
| Pending-verification pharmacy | `pending.pharmacy@pharmx.dev` |
| Stockist | `stockist1@pharmx.dev` |
| Distributor | `distributor1@pharmx.dev` |
| Doctor | `doctor1@pharmx.dev` |

Admin sign-in is at `/admin/login`. Admin accounts are provisioned by an existing administrator or the development seed; public signup does not create administrators.

For a larger fictional network, run `npm run seed:demo` from `backend/`. It adds five demo users per supported role, profiles, requirements, connections, doctor appointments, and conversations without deleting existing records. These accounts use `PharmUnisDemo!2026` and email addresses in the form `demo.<role>.<number>@pharmx.dev`, such as `demo.doctor.01@pharmx.dev`. The demo seed only runs outside production and targets local MongoDB by default. To explicitly allow a dedicated remote non-production database, set `PHARMX_ALLOW_REMOTE_DEMO_SEED=true`.

Seeded verification records use an explicitly labeled placeholder file, not a real licence or identity document.

## Features

- **Authentication and accounts:** JWT access tokens with rotating refresh tokens, role-based signup, password reset, and immediate activation without OTP.
- **Role-specific profiles and dashboards:** Editable MR, pharma company, pharmacy, stockist/distributor, and doctor profiles. Profile image uploads are supported; doctors can manage their professional details, communication preferences, and appointment settings.
- **Discovery:** Search and filter pharma companies, MRs, pharmacies, stockists/distributors, and doctors.
- **Requirements and opportunities:** Pharmacies can post requirements; companies can publish opportunities for MRs. Company users can manage their opportunities, including editing, closing, and deleting them. Descriptions are formatted for readable posting and viewing.
- **Matching and notifications:** Explainable, rule-based matching uses categories, territory, and availability to identify relevant requirements and opportunities and notify suitable users.
- **Connections:** Users can request, accept, or decline professional connections. Duplicate requests in the same direction are prevented at the database layer.
- **Appointments:** Booking, rescheduling negotiation, running-late and emergency updates, cancellation, and completion. Doctor communications and appointment requests are consent-based.
- **Company authorizations:** Company-to-MR authorizations are scoped by product category, territory, and expiry.
- **Lead management:** Role-scoped lead pipelines with audited stage changes and follow-up reminders for companies, MRs, and verified distributors.
- **Products and distribution profiles:** Company-managed draft/published product catalogues and discoverable C&F agent profiles. The platform does not provide ordering, inventory, payments, or prescription workflows.
- **Messaging:** Real-time chat through Socket.IO, sender-only message editing, soft deletion visible to both participants, and real-time notifications.
- **Administration:** Separately throttled admin sign-in, user status management, document verification, company–MR authorization review, reports and reasoned decisions, audit trail, admin activity, and in-app notifications.
- **Uploads:** Profile images and verification documents are stored on local disk under `backend/uploads/` by default.

## Simplifications and limitations

- There is no OTP/SMS verification; adding it requires an SMS provider.
- Uploads use local disk storage rather than S3 or Cloudinary. Configure persistent storage and a suitable backup strategy before production use.
- Product categories come from shared application constants rather than an admin-managed database.
- Matching is transparent rule-based scoring, not an AI/learned model.
- Admin sign-in is rate-limited and audited, but this build does not include TOTP/SMS two-factor authentication, CAPTCHA, trusted-device/session management, granular admin roles, privacy/deletion request workflows, automated licence checks, or system configuration.
- Admin activity is for operational review and must not be used for commercial prospecting.

## Design and frontend stack

The frontend uses React 19, Vite, React Router, Tailwind CSS v4, and `lucide-react`. Tailwind v4 theme tokens are defined CSS-first in `frontend/src/index.css`; there is no Tailwind v3 configuration file. Typography and brand styling are defined in the frontend HTML and CSS.

## Validation

From `frontend/`, run the production build and linter:

```bash
npm run build
npm run lint
```

Backend tests use Node's built-in test runner and are located in `backend/test/`:

```bash
cd backend
node --test
```

Run the application against a live MongoDB instance to validate database persistence, seed data, matching, and realtime workflows end to end.
