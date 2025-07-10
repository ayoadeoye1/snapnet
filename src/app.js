"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gracefulShutdown = exports.initializeServices = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const path_1 = __importDefault(require("path"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_1 = require("./configs/swagger");
const authRoutes_1 = __importDefault(require("./presentation/routes/authRoutes"));
const documentRoutes_1 = __importDefault(require("./presentation/routes/documentRoutes"));
const adminRoutes_1 = __importDefault(require("./presentation/routes/adminRoutes"));
const connection_1 = require("./infrastructure/database/connection");
const redisService_1 = require("./infrastructure/external-services/redisService");
const queueService_1 = require("./infrastructure/queue/queueService");
const fileStorageService_1 = require("./infrastructure/external-services/fileStorageService");
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express_1.default.json({ limit: "30mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "30mb" }));
app.use(express_1.default.static(path_1.default.join(__dirname, "public")));
app.get("/health", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const health = {
            timestamp: new Date().toISOString(),
            status: "ok",
            services: {
                database: "connected",
                redis: (yield redisService_1.redisService.ping()) ? "connected" : "disconnected",
                rabbitmq: queueService_1.queueService.isHealthy() ? "connected" : "disconnected",
                cloudinary: fileStorageService_1.fileStorageService.isHealthy()
                    ? "connected"
                    : "disconnected",
            },
        };
        res.status(200).json(health);
    }
    catch (error) {
        res.status(500).json({
            timestamp: new Date().toISOString(),
            status: "error",
            message: "Health check failed",
        });
    }
}));
app.use("/api/v1/docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec, {
    explorer: true,
    customSiteTitle: "Document Verification API",
    customfavIcon: "/favicon.ico",
    customCss: ".swagger-ui .topbar { display: none }",
    swaggerOptions: {
        persistAuthorization: true,
    },
}));
app.get("/api/v1/docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swagger_1.swaggerSpec);
});
app.use("/api/v1/auth", authRoutes_1.default);
app.use("/api/v1/documents", documentRoutes_1.default);
app.use("/api/v1/admin", adminRoutes_1.default);
app.use((err, req, res, next) => {
    console.error("Global error handler:", err);
    res.status(err.status || 500).json(Object.assign({ success: false, message: err.message || "Internal server error" }, (process.env.NODE_ENV === "development" && { stack: err.stack })));
});
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
    });
});
const initializeServices = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("Initializing services...");
        yield (0, connection_1.connectDatabase)();
        yield redisService_1.redisService.connect();
        yield queueService_1.queueService.connect();
        yield fileStorageService_1.fileStorageService.connect();
        console.log("All services initialized successfully");
    }
    catch (error) {
        console.error("Failed to initialize services:", error);
        process.exit(1);
    }
});
exports.initializeServices = initializeServices;
const gracefulShutdown = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Shutting down gracefully...");
    try {
        yield redisService_1.redisService.disconnect();
        yield queueService_1.queueService.disconnect();
        yield fileStorageService_1.fileStorageService.disconnect();
        console.log("Services disconnected successfully");
    }
    catch (error) {
        console.error("Error during shutdown:", error);
    }
    process.exit(0);
});
exports.gracefulShutdown = gracefulShutdown;
process.on("SIGTERM", exports.gracefulShutdown);
process.on("SIGINT", exports.gracefulShutdown);
exports.default = app;
