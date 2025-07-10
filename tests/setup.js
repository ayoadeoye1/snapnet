"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
// Load test environment variables
dotenv_1.default.config({ path: ".env.test" });
// Set test environment
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret-key-for-testing";
process.env.DB_NAME = "snapnet_test_db";
// Mock database models
jest.mock("../src/domain/entities", () => {
    const mockUser = {
        id: "test-user-id",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        role: "user",
        isActive: true,
        comparePassword: jest.fn(),
        update: jest.fn(),
        destroy: jest.fn(),
    };
    const mockDocument = {
        id: "test-document-id",
        userId: "test-user-id",
        documentType: "passport",
        documentUrl: "http://test.com/document.pdf",
        fileName: "test.pdf",
        fileSize: 1024,
        mimeType: "application/pdf",
        status: "PENDING",
        createdAt: new Date(),
        updatedAt: new Date(),
        destroy: jest.fn(),
    };
    return {
        User: {
            findOne: jest.fn(),
            findByPk: jest.fn(),
            create: jest.fn(),
            findAndCountAll: jest.fn(),
            destroy: jest.fn(),
        },
        Document: {
            findOne: jest.fn(),
            findByPk: jest.fn(),
            create: jest.fn(),
            findAndCountAll: jest.fn(),
            destroy: jest.fn(),
        },
        UserRole: {
            USER: "user",
            ADMIN: "admin",
        },
        DocumentType: {
            PASSPORT: "passport",
            DRIVERS_LICENSE: "drivers_license",
            NATIONAL_ID: "national_id",
            UTILITY_BILL: "utility_bill",
            BANK_STATEMENT: "bank_statement",
            OTHER: "other",
        },
        DocumentStatus: {
            PENDING: "PENDING",
            VERIFIED: "VERIFIED",
            FAILED: "FAILED",
        },
        connectDatabase: jest.fn(),
    };
});
// Mock external services
jest.mock("../src/infrastructure/external-services/redisService", () => ({
    redisService: {
        connect: jest.fn(),
        disconnect: jest.fn(),
        ping: jest.fn().mockResolvedValue(true),
        set: jest.fn(),
        get: jest.fn().mockResolvedValue(null),
        delete: jest.fn(),
    },
}));
jest.mock("../src/infrastructure/queue/queueService", () => ({
    queueService: {
        connect: jest.fn(),
        disconnect: jest.fn(),
        isHealthy: jest.fn().mockReturnValue(true),
        publishDocumentVerification: jest.fn().mockResolvedValue(true),
        consumeDocumentVerification: jest.fn(),
    },
}));
jest.mock("../src/infrastructure/external-services/fileStorageService", () => ({
    fileStorageService: {
        initialize: jest.fn(),
        healthCheck: jest.fn().mockResolvedValue(true),
        uploadFile: jest.fn().mockResolvedValue({
            fileName: "test-file.pdf",
            fileUrl: "http://test.com/documents/test-file.pdf",
            fileSize: 1024,
            cloudinaryPublicId: "test-public-id",
        }),
        deleteFile: jest.fn(),
    },
}));
// Mock database connection
jest.mock("../src/infrastructure/database/connection", () => ({
    connectDatabase: jest.fn(),
    sequelize: {
        close: jest.fn(),
    },
}));
// Global test setup
beforeAll(() => {
    // Suppress console.error and console.log in tests unless needed
    jest.spyOn(console, "error").mockImplementation(() => { });
    jest.spyOn(console, "log").mockImplementation(() => { });
});
// Global test cleanup
afterAll(() => {
    jest.restoreAllMocks();
});
