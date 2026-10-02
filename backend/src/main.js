const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const env = require("./config/env");
const connectDB = require("./db/connect");

const {
  errorHandler,
} = require("./common/middleware");

const { ok } = require("./common/http");

const {
  UPLOAD_DIR,
} = require("./common/upload");

const {
  initRealtime,
} = require("./realtime/socket.gateway");

/*
 * Application routes
 */
const authRoutes =
  require("./modules/auth/routes");

const profilesRoutes =
  require("./modules/profiles/routes");

const discoveryRoutes =
  require("./modules/discovery/routes");

const matchingRoutes =
  require("./modules/matching/routes");

const requirementsRoutes =
  require("./modules/requirements/routes");

const opportunitiesRoutes =
  require("./modules/opportunities/routes");

const connectionsRoutes =
  require("./modules/connections/routes");

const appointmentsRoutes =
  require("./modules/appointments/routes");

const messagingRoutes =
  require("./modules/messaging/routes");

const notificationsRoutes =
  require("./modules/notifications/routes");

const verificationRoutes =
  require("./modules/verification/routes");

const reportsRoutes =
  require("./modules/reports/routes");

const adminRoutes =
  require("./modules/admin/routes");

/*
 * New Pharmacy / role-based dashboard routes
 */
const dashboardRoutes =
  require("./modules/dashboard/routes");

const app = express();

/*
 * Required behind reverse proxies such as:
 * Render, Railway, nginx, etc.
 */
app.set("trust proxy", 1);

/*
 * Security middleware
 */
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

/*
 * CORS
 */
app.use(
  cors({
    origin: env.corsOrigins,
    credentials: true,
  })
);

/*
 * JSON body parsing
 */
app.use(
  express.json({
    limit: "2mb",
  })
);

/*
 * Global API rate limiting
 */
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

/*
 * Uploaded files
 */
app.use(
  "/uploads",
  express.static(UPLOAD_DIR)
);

/*
 * Health check
 */
app.get(
  "/api/v1/health",
  (_req, res) =>
    ok(res, {
      status: "ok",
      time: new Date().toISOString(),
    })
);

/*
 * Authentication
 */
app.use(
  "/api/v1/auth",
  authRoutes
);

/*
 * Profiles
 */
app.use(
  "/api/v1/profiles",
  profilesRoutes
);

/*
 * Discovery
 */
app.use(
  "/api/v1/discover",
  discoveryRoutes
);

/*
 * Matching
 */
app.use(
  "/api/v1/matching",
  matchingRoutes
);

/*
 * Requirements
 */
app.use(
  "/api/v1/requirements",
  requirementsRoutes
);

/*
 * Opportunities
 */
app.use(
  "/api/v1/opportunities",
  opportunitiesRoutes
);

/*
 * Connections
 */
app.use(
  "/api/v1/connections",
  connectionsRoutes
);

/*
 * Appointments
 */
app.use(
  "/api/v1/appointments",
  appointmentsRoutes
);

/*
 * Messaging
 *
 * This exposes /conversations under
 * the /api/v1 prefix.
 */
app.use(
  "/api/v1",
  messagingRoutes
);

/*
 * Notifications
 */
app.use(
  "/api/v1/notifications",
  notificationsRoutes
);

/*
 * Verification
 */
app.use(
  "/api/v1/verification",
  verificationRoutes
);

/*
 * Reports
 */
app.use(
  "/api/v1/reports",
  reportsRoutes
);

/*
 * Admin
 */
app.use(
  "/api/v1/admin",
  adminRoutes
);

/*
 * Role-based dashboards
 *
 * Pharmacy:
 * GET /api/v1/dashboard/pharmacy
 */
app.use(
  "/api/v1/dashboard",
  dashboardRoutes
);

/*
 * 404 handler
 */
app.use(
  (req, res) => {
    res.status(404).json({
      success: false,
      data: null,
      error: {
        code: "NOT_FOUND",
        message:
          `No route for ${req.method} ${req.path}`,
      },
      meta: null,
    });
  }
);

/*
 * Global error handler
 */
app.use(errorHandler);

/*
 * HTTP server
 */
const httpServer =
  http.createServer(app);

/*
 * Realtime / Socket.IO
 */
initRealtime(httpServer);

/*
 * Database + server startup
 */
connectDB().then(() => {
  httpServer.listen(
    env.port,
    () => {
      // eslint-disable-next-line no-console
      console.log(
        `PharmX API listening on http://localhost:${env.port} (${env.nodeEnv})`
      );
    }
  );
});