const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const env = require("./config/env");
const connectDB = require("./db/connect");
const { errorHandler } = require("./common/middleware");
const { ok } = require("./common/http");
const { UPLOAD_DIR } = require("./common/upload");
const { initRealtime } = require("./realtime/socket.gateway");

const authRoutes = require("./modules/auth/routes");
const profilesRoutes = require("./modules/profiles/routes");
const discoveryRoutes = require("./modules/discovery/routes");
const matchingRoutes = require("./modules/matching/routes");
const requirementsRoutes = require("./modules/requirements/routes");
const opportunitiesRoutes = require("./modules/opportunities/routes");
const connectionsRoutes = require("./modules/connections/routes");
const appointmentsRoutes = require("./modules/appointments/routes");
const messagingRoutes = require("./modules/messaging/routes");
const notificationsRoutes = require("./modules/notifications/routes");
const verificationRoutes = require("./modules/verification/routes");
const reportsRoutes = require("./modules/reports/routes");
const adminRoutes = require("./modules/admin/routes");

const app = express();

// Required behind any reverse proxy (Render, Railway, nginx, etc.) so
// express-rate-limit and req.ip/req.protocol see the real client, not the proxy.
app.set("trust proxy", 1);

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: env.corsOrigins, credentials: true }));
app.use(express.json({ limit: "2mb" }));

app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use("/uploads", express.static(UPLOAD_DIR));

app.get("/api/v1/health", (_req, res) => ok(res, { status: "ok", time: new Date().toISOString() }));

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/profiles", profilesRoutes);
app.use("/api/v1/discover", discoveryRoutes);
app.use("/api/v1/matching", matchingRoutes);
app.use("/api/v1/requirements", requirementsRoutes);
app.use("/api/v1/opportunities", opportunitiesRoutes);
app.use("/api/v1/connections", connectionsRoutes);
app.use("/api/v1/appointments", appointmentsRoutes);
app.use("/api/v1", messagingRoutes); // exposes /conversations under the v1 prefix
app.use("/api/v1/notifications", notificationsRoutes);
app.use("/api/v1/verification", verificationRoutes);
app.use("/api/v1/reports", reportsRoutes);
app.use("/api/v1/admin", adminRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    data: null,
    error: { code: "NOT_FOUND", message: `No route for ${req.method} ${req.path}` },
    meta: null,
  });
});

app.use(errorHandler);

const httpServer = http.createServer(app);
initRealtime(httpServer);

connectDB().then(() => {
  httpServer.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`PharmX API listening on http://localhost:${env.port} (${env.nodeEnv})`);
  });
});
