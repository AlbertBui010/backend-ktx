import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import roomRoutes from "./routes/room.routes.js";
import studentRoutes from "./routes/student.routes.js";
import topicRoutes from "./routes/topic.routes.js";
import registrationRoutes from "./routes/registration.routes.js";
import nhanVienRoutes from "./routes/nhanVien.routes.js";
import phanBoPhongRoutes from "./routes/phanBoPhong.routes.js";
import { connectDatabase } from "./config/database.config.js";
import { connectRedis } from "./config/redis.config.js";
import { emailUtils } from "./utils/email.util.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database and Redis connections
const initializeConnections = async () => {
  try {
    await connectDatabase();
    await connectRedis();

    // Test email connection
    await emailUtils.testConnection();

    console.log("✅ All connections initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize connections:", error);
    process.exit(1);
  }
};

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(morgan("dev"));

// Routes
app.use("/api", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/topics", topicRoutes);
app.use("/api/staff", nhanVienRoutes);
app.use("/api/room-allocations", phanBoPhongRoutes);


// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    error: {
      code: 500,
      message: "Internal Server Error",
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    },
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 404,
      message: "Route not found",
    },
  });
});

// Start server
const startServer = async () => {
  await initializeConnections();

  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
  });
};

startServer();
