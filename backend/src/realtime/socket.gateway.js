const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const env = require("../config/env");
const { realtimeBus } = require("./bus");

function initRealtime(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: env.corsOrigins, credentials: true },
    path: "/socket.io",
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("UNAUTHENTICATED"));
    try {
      const payload = jwt.verify(token, env.jwtAccessSecret);
      socket.data.user = payload;
      next();
    } catch {
      next(new Error("INVALID_TOKEN"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user;
    socket.join(`user:${user.sub}`);

    socket.on("join:conversation", ({ conversationId }) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on("typing:start", ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit("typing:start", { userId: user.sub, conversationId });
    });

    socket.on("typing:stop", ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit("typing:stop", { userId: user.sub, conversationId });
    });
  });

  realtimeBus.on("notification:new", (evt) => {
    io.to(`user:${evt.userId}`).emit("notification:new", evt.payload);
  });

  realtimeBus.on("message:new", (evt) => {
    for (const userId of evt.userIds) io.to(`user:${userId}`).emit("message:new", evt.payload);
  });

  realtimeBus.on("appointment:updated", (evt) => {
    for (const userId of evt.userIds) io.to(`user:${userId}`).emit("appointment:updated", evt.payload);
  });

  realtimeBus.on("connection:request", (evt) => {
    io.to(`user:${evt.userId}`).emit("connection:request", evt.payload);
  });

  return io;
}

module.exports = { initRealtime };
