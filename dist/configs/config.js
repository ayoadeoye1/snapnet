"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    port: process.env.PORT || 8000,
    nodeEnv: process.env.NODE_ENV || "development",
    database: {
        host: process.env.DB_HOST || "localhost",
        port: parseInt(process.env.DB_PORT || "3306"),
        name: process.env.DB_NAME || "snapnet_db",
        username: process.env.DB_USER || "snapnet_user",
        password: process.env.DB_PASSWORD || "snapnet_password",
        url: process.env.DB_URL ||
            "mysql://snapnet_user:snapnet_password@localhost:3306/snapnet_db",
    },
    redis: {
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT || "6379"),
        url: process.env.REDIS_URL || "redis://localhost:6379",
        password: process.env.REDIS_PASSWORD || undefined,
    },
    rabbitmq: {
        host: process.env.RABBITMQ_HOST || "localhost",
        port: parseInt(process.env.RABBITMQ_PORT || "5672"),
        username: process.env.RABBITMQ_USER || "admin",
        password: process.env.RABBITMQ_PASSWORD || "password",
        url: process.env.RABBITMQ_URL || "amqp://admin:password@localhost:5672",
    },
    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME || "dqgjkptj6",
        apiKey: process.env.CLOUDINARY_API_KEY || "753316692577171",
        apiSecret: process.env.CLOUDINARY_API_SECRET || "",
        folder: process.env.CLOUDINARY_FOLDER || "snapnet-documents",
    },
    jwt: {
        secret: process.env.JWT_SECRET ||
            "your-super-secret-jwt-key-change-this-in-production",
        expiresIn: process.env.JWT_EXPIRES_IN || "24h",
    },
    documentVerificationDelay: parseInt(process.env.DOCUMENT_VERIFICATION_DELAY || "2000"),
    documentCacheTTL: parseInt(process.env.DOCUMENT_CACHE_TTL || "600"),
};
