import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./configs/swagger";

import authRoutes from "./presentation/routes/authRoutes";
import documentRoutes from "./presentation/routes/documentRoutes";
import adminRoutes from "./presentation/routes/adminRoutes";

import { connectDatabase } from "./infrastructure/database/connection";
import { redisService } from "./infrastructure/external-services/redisService";
import { queueService } from "./infrastructure/queue/queueService";
import { fileStorageService } from "./infrastructure/external-services/fileStorageService";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ extended: true, limit: "30mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/health", async (req, res) => {
  try {
    const health = {
      timestamp: new Date().toISOString(),
      status: "ok",
      services: {
        database: "connected",
        redis: (await redisService.ping()) ? "connected" : "disconnected",
        rabbitmq: queueService.isHealthy() ? "connected" : "disconnected",
        cloudinary: fileStorageService.isHealthy()
          ? "connected"
          : "disconnected",
      },
    };

    res.status(200).json(health);
  } catch (error) {
    res.status(500).json({
      timestamp: new Date().toISOString(),
      status: "error",
      message: "Health check failed",
    });
  }
});

app.use(
  "/api/v1/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customSiteTitle: "Document Verification API",
    customfavIcon: "/favicon.ico",
    customCss: ".swagger-ui .topbar { display: none }",
    swaggerOptions: {
      persistAuthorization: true,
    },
  })
);

app.get("/api/v1/docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/documents", documentRoutes);
app.use("/api/v1/admin", adminRoutes);

app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Global error handler:", err);

    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Internal server error",
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  }
);

app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

export const initializeServices = async () => {
  try {
    console.log("Initializing services...");

    await connectDatabase();

    await redisService.connect();

    await queueService.connect();

    await fileStorageService.connect();

    console.log("All services initialized successfully");
  } catch (error) {
    console.error("Failed to initialize services:", error);
    process.exit(1);
  }
};

export const gracefulShutdown = async () => {
  console.log("Shutting down gracefully...");

  try {
    await redisService.disconnect();
    await queueService.disconnect();
    await fileStorageService.disconnect();
    console.log("Services disconnected successfully");
  } catch (error) {
    console.error("Error during shutdown:", error);
  }

  process.exit(0);
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

export default app;
