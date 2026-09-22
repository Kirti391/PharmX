const mongoose = require("mongoose");
const env = require("../config/env");

async function connectDB() {
  try {
    await mongoose.connect(env.mongoUri);
    // eslint-disable-next-line no-console
    console.log("MongoDB connected:", mongoose.connection.name);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("MongoDB connection failed:", err.message);
    process.exit(1); // no point serving requests against a database we can't reach
  }
}

module.exports = connectDB;
