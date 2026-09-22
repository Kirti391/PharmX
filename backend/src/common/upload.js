const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const env = require("../config/env");

const UPLOAD_DIR = env.uploadDir || path.join(__dirname, "..", "..", "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || "";
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

function fileUrl(req, filename) {
  const base = env.publicUrl || `${req.protocol}://${req.get("host")}`;
  return `${base}/uploads/${filename}`;
}

module.exports = { upload, fileUrl, UPLOAD_DIR };
