const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const path = require("path");

require("dotenv").config();

// Database
const { connectDB, sequelize } = require("./config/database");

// Load all models and associations
require("./models");

// Error handling
const { errorHandler, notFound } = require("./middleware/errorHandler");

// Import routes
const authRoutes = require("./routes/authRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const designationRoutes = require("./routes/designationRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const leaveRoutes = require("./routes/leaveRoutes");
const payrollRoutes = require("./routes/payrollRoutes");
const taskRoutes = require("./routes/taskRoutes");
const announcementRoutes = require("./routes/announcementRoutes");
const documentRoutes = require("./routes/documentRoutes");
const recruitmentRoutes = require("./routes/recruitmentRoutes");
const performanceRoutes = require("./routes/performanceRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const notificationPreferencesRoutes = require("./routes/notificationPreferencesRoutes");
const companyRoutes = require("./routes/companyRoutes");
const reportRoutes = require("./routes/reportRoutes");
const timesheetRoutes = require("./routes/timesheetRoutes");

const app = express();

// ============================================
// SECURITY MIDDLEWARE
// ============================================

app.use(helmet());

app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? [process.env.APP_URL, process.env.FRONTEND_URL].filter(Boolean)
        : ["http://localhost:5173", "http://localhost:3000"],

    credentials: true,

    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],

    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ============================================
// RATE LIMITING
// ============================================

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  max: 20,

  message: {
    success: false,
    message: "Too many attempts, please try again later.",
  },

  skipSuccessfulRequests: true,
});

app.use("/api/auth/login", authLimiter);

// ============================================
// BODY PARSING
// ============================================

app.use(
  express.json({
    limit: "10mb",
  }),
);

app.use(
  express.urlencoded({
    extended: true,
  }),
);

// ============================================
// LOGGING
// ============================================

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ============================================
// STATIC FILES
// ============================================

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ============================================
// API ROUTES
// ============================================

app.use("/api/auth", authRoutes);

app.use("/api/employees", employeeRoutes);

app.use("/api/departments", departmentRoutes);

app.use("/api/designations", designationRoutes);

app.use("/api/attendance", attendanceRoutes);

app.use("/api/leaves", leaveRoutes);

app.use("/api/payroll", payrollRoutes);

app.use("/api/tasks", taskRoutes);

app.use("/api/announcements", announcementRoutes);

app.use("/api/documents", documentRoutes);

app.use("/api/recruitment", recruitmentRoutes);

app.use("/api/performance", performanceRoutes);

app.use("/api/dashboard", dashboardRoutes);

app.use("/api/notifications", notificationRoutes);

app.use("/api/notifications", notificationPreferencesRoutes);

app.use("/api/company", companyRoutes);

app.use("/api/reports", reportRoutes);

app.use("/api/timesheets", timesheetRoutes);

// ============================================
// HEALTH CHECK
// ============================================

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "HRMS API is running",
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// SWAGGER API DOCUMENTATION
// ============================================

const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",

    info: {
      title: "HRMS API Documentation",
      version: "1.0.0",
      description: "Enterprise HR Management System REST API",

      contact: {
        name: "HRMS Team",
        email: "support@hrms.com",
      },
    },

    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}`,
        description: "Development server",
      },
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },

    security: [
      {
        bearerAuth: [],
      },
    ],
  },

  apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
  }),
);

// ============================================
// SERVE FRONTEND IN PRODUCTION
// ============================================

if (process.env.NODE_ENV === "production") {
  const frontendDist = path.join(__dirname, "..", "frontend", "dist");

  app.use(express.static(frontendDist));

  // SPA fallback
  app.get("*", (req, res, next) => {
    if (req.originalUrl.startsWith("/api")) {
      return next();
    }

    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

// ============================================
// ERROR HANDLING
// ============================================

app.use(notFound);

app.use(errorHandler);

// ============================================
// DATABASE + SERVER START
// ============================================

const DEFAULT_PORT = Number(process.env.PORT) || 5000;

const startServer = async () => {
  try {
    // 1. Connect to MySQL
    await connectDB();

    console.log("Database connection verified.");

    // 2. Automatically create missing tables
    await sequelize.sync();

    console.log("All HRMS tables synced successfully.");

    // 3. Start server
    const tryListen = (port) => {
      const server = app.listen(port, () => {
        console.log("\n========================================");

        console.log(`  HRMS Server running on port ${port}`);

        console.log(`  Environment: ${process.env.NODE_ENV || "development"}`);

        console.log(`  API: http://localhost:${port}/api`);

        console.log(`  Docs: http://localhost:${port}/api/docs`);

        console.log("========================================\n");
      });

      server.on("error", (err) => {
        if (err.code === "EADDRINUSE") {
          console.warn(`\n⚠️ Port ${port} is already in use.`);

          if (port < DEFAULT_PORT + 10) {
            console.log(`Trying port ${port + 1}...`);

            tryListen(port + 1);
          } else {
            console.error(
              "All nearby ports are in use. Please stop the other process or set a different PORT in .env",
            );

            process.exit(1);
          }
        } else {
          console.error("Server error:", err);

          process.exit(1);
        }
      });
    };

    tryListen(DEFAULT_PORT);
  } catch (error) {
    console.error("❌ Failed to start HRMS server:", error.message);

    process.exit(1);
  }
};

startServer();

module.exports = app;
