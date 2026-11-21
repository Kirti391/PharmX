# 💊 PharmUnis – The Pharma Ecosystem Network

### 🌐 A Full-Stack MERN-Based Pharmaceutical Professional Networking Platform

**PharmUnis** is a centralised digital platform designed to connect pharmaceutical companies, Medical Representatives (MRs), pharmacies, stockists, distributors, and registered doctors. It simplifies professional networking, business collaboration, opportunity discovery, appointment management, and communication within the pharmaceutical industry.

---

## 📌 Table of Contents

- [🌟 About the Project](#-about-the-project)
- [🎯 Project Objectives](#-project-objectives)
- [🛠️ Technology Stack](#️-technology-stack)
- [🏗️ System Architecture](#️-system-architecture)
- [👥 User Roles](#-user-roles)
- [✨ Key Features](#-key-features)
- [📂 Project Structure](#-project-structure)
- [⚙️ Installation and Setup](#️-installation-and-setup)
- [🔐 Demo Accounts](#-demo-accounts)
- [🔧 Environment Variables](#-environment-variables)
- [🧪 Testing](#-testing)
- [⚠️ Current Limitations](#️-current-limitations)
- [🚀 Future Enhancements](#-future-enhancements)
- [💡 Project Significance](#-project-significance)

---

## 🌟 About the Project

**PharmUnis – The Pharma Ecosystem Network** is a full-stack web application developed to bring different stakeholders of the pharmaceutical industry onto one unified digital platform.

The platform provides role-based profiles and dashboards that enable users to:

- Connect with pharmaceutical professionals and businesses.
- Discover companies, Medical Representatives, pharmacies, and distributors.
- Publish business requirements and professional opportunities.
- Manage company–MR authorisations.
- Schedule and manage doctor appointments.
- Communicate through real-time messaging.
- Receive relevant notifications and updates.
- Manage professional leads and follow-ups.

PharmUnis aims to make pharmaceutical networking more organised, accessible, and efficient.

## 🎯 Project Objectives

- 🌐 Establish a common digital networking platform for pharmaceutical stakeholders.
- 👤 Enable users to create and manage role-specific professional profiles.
- 🔍 Improve the discovery of pharmaceutical companies, MRs, pharmacies, and distributors.
- 📢 Provide a structured system for publishing business requirements and professional opportunities.
- 🤝 Support professional connections and company–MR authorisation.
- 📅 Simplify appointment scheduling and follow-up coordination.
- 📄 Provide document verification and administrative management.
- 🔒 Maintain secure, role-based access to platform functionalities.

## 🛠️ Technology Stack

PharmUnis is developed using the **MERN Stack**, along with additional frontend, authentication, and real-time communication technologies.

| Technology | Category | Purpose |
|---|---|---|
| 🍃 MongoDB | Database | Stores application and user data |
| Mongoose | ODM | Manages MongoDB schemas and operations |
| 🟢 Node.js | Runtime | Executes backend JavaScript |
| Express.js | Backend Framework | Handles REST APIs and server-side operations |
| ⚛️ React.js | Frontend Library | Builds interactive user interfaces |
| ⚡ Vite | Build Tool | Provides fast development and production builds |
| React Router | Routing | Manages frontend navigation |
| 🎨 Tailwind CSS v4 | CSS Framework | Provides responsive UI styling |
| 🔐 JWT | Authentication | Supports secure authentication and access control |
| 🔄 Socket.IO | Real-Time Communication | Supports messaging and real-time notifications |
| Git | Version Control | Tracks source-code changes |
| GitHub | Repository Hosting | Stores and manages project source code |

## 🏗️ System Architecture

PharmUnis follows a **client-server architecture** based on the MERN stack.

### 💻 Frontend

- Developed using React.js and Vite.
- Uses React Router for navigation.
- Uses Tailwind CSS v4 for responsive UI design.
- Communicates with backend REST APIs.

### ⚙️ Backend

- Developed using Node.js and Express.js.
- Provides REST API endpoints.
- Handles authentication, authorisation, application logic, and data processing.
- Uses Socket.IO for real-time communication.

### 🗄️ Database

- MongoDB is used for data storage.
- Mongoose manages database schemas, models, and operations.

### 🔄 Architecture Flow

```text
                  👥 USERS
                     |
                     v
              ⚛️ REACT FRONTEND
                 (React + Vite)
                     |
                     v
                  REST APIs
                     |
                     v
             🟢 NODE.JS + EXPRESS
                  BACKEND
                     |
               +-----+-----+
               |           |
               v           v
           🍃 MONGODB   🔄 SOCKET.IO
            DATABASE   REAL-TIME
                       SERVICES
```

## 👥 User Roles

PharmUnis supports multiple user roles, each with dedicated functionalities.

| User Role | Description |
|---|---|
| 🛡️ Administrator | Manages users, verification, complaints, authorisations, and platform activities. |
| 🏢 Pharmaceutical Company | Manages company profiles, discovers MRs, publishes opportunities, and handles authorisations. |
| 👨‍⚕️ Medical Representative (MR) | Creates professional profiles, discovers opportunities, and connects with companies and pharmacies. |
| 🤝 Independent MR | Discovers professional opportunities and builds independent professional connections. |
| 💊 Pharmacy / Chemist | Discovers pharmaceutical companies and distributors and posts business requirements. |
| 🚚 Stockist / Distributor | Creates business profiles and connects with pharmacies and pharmaceutical companies. |
| 🩺 Registered Doctor | Manages professional information, communication preferences, and appointment settings. |

## ✨ Key Features

### 🔐 1. Authentication and Account Management

- Role-based user registration and login.
- JWT access-token authentication.
- Rotating refresh-token mechanism.
- Password reset functionality.
- Immediate account activation after signup.
- Separate administrator login and access control.

### 👤 2. Role-Based Profiles and Dashboards

- Separate dashboards for different user roles.
- Editable professional and business profiles.
- Profile image uploads.
- Doctor professional details and communication preferences.
- Role-specific platform functionalities.

### 🔍 3. Professional Discovery

- Search pharmaceutical companies, MRs, pharmacies, stockists, distributors, and doctors.
- Filter profiles by location, experience, categories, and availability.
- Discover relevant professional and business connections.

### 📢 4. Requirements and Opportunities

- Pharmacies can publish business requirements.
- Pharmaceutical companies can publish opportunities for MRs.
- Companies can edit, close, and delete their opportunities.
- Relevant users can discover matching requirements and opportunities.

### 🎯 5. Matching and Notifications

- Rule-based matching based on categories, territory, and availability.
- Identification of relevant requirements and opportunities.
- Notifications for suitable users.

### 🤝 6. Professional Connections

- Send professional connection requests.
- Accept or decline incoming requests.
- Prevent duplicate connection requests in the same direction.
- Manage professional connections.

### 📅 7. Appointment Management

- Create appointment requests.
- Accept or decline appointment requests.
- Request appointment rescheduling.
- Manage running-late and emergency updates.
- Cancel and complete appointments.
- Support consent-based doctor communication and appointment requests.

### 🏢 8. Company–MR Authorisation

- Manage company-to-MR authorisations.
- Define authorisation by product category.
- Manage territory-specific authorisations.
- Maintain authorisation expiry details.

### 📊 9. Lead Management

- Role-based lead management pipelines.
- Track lead stages.
- Maintain audited stage changes.
- Manage follow-up reminders for companies, MRs, and verified distributors.

### 📦 10. Products and Distribution Profiles

- Company-managed product catalogues.
- Draft and published product listings.
- Discoverable C&F agent profiles.
- Product and distribution-related professional discovery.

### 💬 11. Real-Time Messaging

- Real-time communication using Socket.IO.
- Sender-only message editing.
- Soft deletion of messages visible to both participants.
- Real-time notifications.

### 🛡️ 12. Administration

- Separate administrator login.
- User status management.
- Document verification.
- Company–MR authorisation review.
- Complaint management.
- Reports and reasoned administrative decisions.
- Audit trail and administrator activity monitoring.
- In-app administrative notifications.

### 📁 13. File Uploads

- Profile image uploads.
- Professional and business verification document uploads.
- Local file storage under `backend/uploads/` by default.

## 📂 Project Structure

High-level overview of the project directory:

```text
pharmx/
│
├── backend/
│   ├── Express.js application
│   ├── Mongoose models
│   ├── API routes and controllers
│   ├── Authentication and middleware
│   ├── Socket.IO services
│   ├── Upload handling
│   ├── Seed scripts
│   └── test/
│
├── frontend/
│   ├── React application
│   ├── Components
│   ├── Pages
│   ├── Routing
│   ├── Styling
│   └── Vite configuration
│
└── README.md
```

> 📌 Note: This is a high-level directory overview. Individual filenames and subdirectories may vary.

## ⚙️ Installation and Setup

Follow the steps below to run PharmUnis locally.

### 📋 Prerequisites

Make sure the following tools are installed:

- [Node.js](https://nodejs.org/) 18 or newer.
- [MongoDB](https://www.mongodb.com/) installed locally or MongoDB Atlas.
- npm (Node Package Manager).
- [Git](https://git-scm.com/).

### 1️⃣ Clone the Repository

```bash
git clone <your-repository-url>
cd pharmx
```

### 2️⃣ Backend Setup

Navigate to the backend directory:

```bash
cd backend
npm install
```

Create a `.env` file inside the backend directory:

```env
NODE_ENV=development
PORT=4000

MONGODB_URI=mongodb://127.0.0.1:27017/pharmx

JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret

CORS_ORIGIN=http://localhost:5173
```

Start the backend:

```bash
npm run seed
npm run dev
```

The backend API will run at:

```text
http://localhost:4000
```

### 3️⃣ Frontend Setup

Open another terminal and navigate to the frontend directory:

```bash
cd frontend
npm install
npm run dev
```

The frontend will run at:

```text
http://localhost:5173
```

### 🔗 Default API URL

The default backend API URL is:

```text
http://localhost:4000/api/v1
```

To use a different API URL, configure `VITE_API_URL` in the frontend environment.

## 🔐 Demo Accounts

The backend seed command creates or updates the primary demonstration accounts and sample records.

Run the following command from the backend directory:

```bash
npm run seed
```

### 🔑 Default Demo Password

```text
Password123!
```

### 👥 Demo Login Credentials

| Role | Email |
|---|---|
| 🛡️ Administrator | `admin@pharmx.dev` |
| 🏢 Pharmaceutical Company | `company1@pharmx.dev` |
| 👨‍⚕️ Medical Representative | `mr1@pharmx.dev` |
| 🤝 Independent MR | `mr2@pharmx.dev` |
| 💊 Pharmacy | `pharmacy1@pharmx.dev` |
| ⏳ Pending-verification Pharmacy | `pending.pharmacy@pharmx.dev` |
| 🚚 Stockist | `stockist1@pharmx.dev` |
| 📦 Distributor | `distributor1@pharmx.dev` |
| 🩺 Doctor | `doctor1@pharmx.dev` |

### 🛡️ Administrator Login

Administrator login is available at:

```text
/admin/login
```

> Administrator accounts are created through an existing administrator or the development seed. Public registration does not create administrator accounts.

### 🌐 Additional Demo Data

To generate a larger fictional pharmaceutical network, run:

```bash
npm run seed:demo
```

This command adds five demonstration users per supported role, along with sample profiles, requirements, connections, doctor appointments, and conversations.

**Additional Demo Account Details:**

- 🔑 Password: `PharmUnisDemo!2026`
- 📧 Email format: `demo.<role>.<number>@pharmx.dev`
- 📝 Example: `demo.doctor.01@pharmx.dev`

> ⚠️ The demo seed runs only outside production and targets local MongoDB by default. To explicitly allow a dedicated remote non-production database, configure `PHARMX_ALLOW_REMOTE_DEMO_SEED=true`.

> 📄 Seeded verification records use clearly labelled placeholder files, not genuine identity or licence documents.

## 🔧 Environment Variables

The backend loads environment variables from `backend/.env` using `dotenv`.

| Variable | Description |
|---|---|
| `NODE_ENV` | Application environment |
| `PORT` | Backend server port |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_ACCESS_SECRET` | Secret for access tokens |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens |
| `CORS_ORIGIN` | Permitted frontend origin |
| `PUBLIC_URL` | Optional externally accessible upload URL |
| `UPLOAD_DIR` | Optional local upload directory |

### 🔒 Production Configuration Recommendations

- Use strong, unique JWT secrets.
- Never expose secrets in frontend code.
- Configure the correct frontend origin.
- Use persistent file storage.
- Protect uploaded documents.
- Use secure deployment and database configurations.

## 🧪 Testing

### 💻 Frontend Testing

Run the following commands from the frontend directory:

```bash
npm run build
npm run lint
```

- `npm run build` – Checks the production build.
- `npm run lint` – Checks frontend code quality.

### ⚙️ Backend Testing

Backend tests use Node.js's built-in test runner.

Execute from the backend directory:

```bash
node --test
```

The application should also be tested against a live MongoDB instance to validate:

- Database persistence.
- Authentication.
- Seeded records.
- Matching workflows.
- Real-time communication.

## ⚠️ Current Limitations

The current implementation has the following limitations:

1. **No OTP/SMS Verification:** User accounts become active immediately after signup. OTP/SMS verification is not included.
2. **Local File Storage:** Uploaded files are stored locally rather than using cloud storage services such as AWS S3 or Cloudinary.
3. **Rule-Based Matching:** Matching uses predefined rules involving categories, territory, and availability rather than AI or machine learning.
4. **Fixed Product Categories:** Product categories are maintained using shared application constants rather than an administrator-managed database.
5. **Limited Administrator Security:** TOTP/SMS two-factor authentication, CAPTCHA, trusted-device management, and granular administrator roles are not included.
6. **No Automated Licence Verification:** Document verification requires administrative review.
7. **No Commercial Transaction Workflow:** Medicine ordering, inventory management, payment processing, and prescription management are not included.

## 🚀 Future Enhancements

Potential future developments include:

- 📱 OTP-based email and mobile verification.
- ☁️ Cloud-based document and image storage.
- 🤖 AI-assisted professional and business matching.
- 📊 Advanced analytics and reporting dashboards.
- 📄 Automated licence validation and expiry reminders.
- 🔐 Enhanced administrator security with two-factor authentication.
- 📈 Improved lead tracking and follow-up automation.
- 🔍 Advanced search and recommendation capabilities.
- 📲 Dedicated mobile application development.
- 🛡️ Additional privacy and account-management controls.

## 💡 Project Significance

PharmUnis provides a centralised digital networking environment for the pharmaceutical ecosystem.

By bringing pharmaceutical companies, Medical Representatives, pharmacies, distributors, and registered doctors onto a common platform, it aims to improve:

- Professional discovery.
- Industry communication.
- Business coordination.
- Opportunity sharing.
- Appointment management.
- Professional networking.

The project demonstrates the practical application of modern full-stack web development technologies, database management, authentication, real-time communication, and role-based access control to address a real-world industry coordination problem.

## 🎓 Project Information

| Category | Details |
|---|---|
| 💊 Project Name | PharmUnis – The Pharma Ecosystem Network |
| 📌 Project Type | Full-Stack Web Application |
| 🛠️ Architecture | MERN Stack |
| 💻 Frontend | React.js, Vite, Tailwind CSS v4 |
| ⚙️ Backend | Node.js, Express.js |
| 🗄️ Database | MongoDB |
| 🔐 Authentication | JWT |
| 💬 Real-Time Communication | Socket.IO |

---

<p align="center">

### 💊 PharmUnis – Connecting the Pharmaceutical Ecosystem 🌐

**Bridging Professionals. Empowering Businesses. Connecting Healthcare.**

</p>
