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
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../src/app"));
const entities_1 = require("../src/domain/entities");
const fileStorageService_1 = require("../src/infrastructure/external-services/fileStorageService");
const queueService_1 = require("../src/infrastructure/queue/queueService");
require("./setup");
describe("Document Management API", () => {
    // Mock data
    const mockUser = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        email: "user@example.com",
        firstName: "Test",
        lastName: "User",
        role: entities_1.UserRole.USER,
        isActive: true,
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        updatedAt: new Date("2024-01-01T00:00:00.000Z"),
    };
    const mockAdmin = {
        id: "550e8400-e29b-41d4-a716-446655440001",
        email: "admin@example.com",
        firstName: "Test",
        lastName: "Admin",
        role: entities_1.UserRole.ADMIN,
        isActive: true,
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        updatedAt: new Date("2024-01-01T00:00:00.000Z"),
    };
    const mockDocument = {
        id: "550e8400-e29b-41d4-a716-446655440002",
        userId: mockUser.id,
        documentType: entities_1.DocumentType.PASSPORT,
        documentUrl: "http://test.com/documents/test-document.pdf",
        fileName: "test-document.pdf",
        fileSize: 1024,
        mimeType: "application/pdf",
        cloudinaryPublicId: "test-public-id",
        status: entities_1.DocumentStatus.PENDING,
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        updatedAt: new Date("2024-01-01T00:00:00.000Z"),
        destroy: jest.fn(),
    };
    const validUserToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJyb2xlIjoidXNlciIsImlhdCI6MTYzOTc1NDQwMCwiZXhwIjoxNjM5ODQwODAwfQ.test";
    const validAdminToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDEiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNjM5NzU0NDAwLCJleHAiOjE2Mzk4NDA4MDB9.admin";
    beforeEach(() => {
        jest.clearAllMocks();
        // Setup default user mocks
        entities_1.User.findByPk.mockImplementation((id) => {
            if (id === mockUser.id)
                return Promise.resolve(mockUser);
            if (id === mockAdmin.id)
                return Promise.resolve(mockAdmin);
            return Promise.resolve(null);
        });
    });
    describe("POST /api/v1/documents", () => {
        const mockFile = {
            fieldname: "document",
            originalname: "test-document.pdf",
            encoding: "7bit",
            mimetype: "application/pdf",
            buffer: Buffer.from("test file content"),
            size: 1024,
        };
        describe("Successful document upload", () => {
            it("should upload document successfully with valid data", () => __awaiter(void 0, void 0, void 0, function* () {
                const mockCreatedDocument = Object.assign(Object.assign({}, mockDocument), { toJSON: () => mockDocument });
                entities_1.Document.create.mockResolvedValue(mockCreatedDocument);
                fileStorageService_1.fileStorageService.uploadFile.mockResolvedValue({
                    fileName: mockDocument.fileName,
                    fileUrl: mockDocument.documentUrl,
                    fileSize: mockDocument.fileSize,
                    cloudinaryPublicId: mockDocument.cloudinaryPublicId,
                });
                queueService_1.queueService.publishDocumentVerification.mockResolvedValue(true);
                const response = yield (0, supertest_1.default)(app_1.default)
                    .post("/api/v1/documents")
                    .set("Authorization", `Bearer ${validUserToken}`)
                    .field("documentType", entities_1.DocumentType.PASSPORT)
                    .attach("document", mockFile.buffer, mockFile.originalname);
                expect(response.status).toBe(201);
                expect(response.body).toMatchObject({
                    success: true,
                    message: "Document uploaded successfully and queued for verification",
                    data: expect.objectContaining({
                        documentType: entities_1.DocumentType.PASSPORT,
                        status: entities_1.DocumentStatus.PENDING,
                        userId: mockUser.id,
                        fileName: expect.any(String),
                        fileSize: expect.any(Number),
                    }),
                });
                expect(fileStorageService_1.fileStorageService.uploadFile).toHaveBeenCalledWith(expect.objectContaining({
                    buffer: mockFile.buffer,
                    originalName: mockFile.originalname,
                    mimeType: mockFile.mimetype,
                }));
                expect(queueService_1.queueService.publishDocumentVerification).toHaveBeenCalledWith(expect.objectContaining({
                    documentId: mockDocument.id,
                }));
            }));
            it("should upload different document types successfully", () => __awaiter(void 0, void 0, void 0, function* () {
                const documentTypes = [
                    entities_1.DocumentType.DRIVERS_LICENSE,
                    entities_1.DocumentType.NATIONAL_ID,
                    entities_1.DocumentType.UTILITY_BILL,
                    entities_1.DocumentType.BANK_STATEMENT,
                    entities_1.DocumentType.OTHER,
                ];
                for (const documentType of documentTypes) {
                    const mockDoc = Object.assign(Object.assign({}, mockDocument), { documentType });
                    entities_1.Document.create.mockResolvedValue(Object.assign(Object.assign({}, mockDoc), { toJSON: () => mockDoc }));
                    const response = yield (0, supertest_1.default)(app_1.default)
                        .post("/api/v1/documents")
                        .set("Authorization", `Bearer ${validUserToken}`)
                        .field("documentType", documentType)
                        .attach("document", mockFile.buffer, mockFile.originalname);
                    expect(response.status).toBe(201);
                    expect(response.body.data.documentType).toBe(documentType);
                }
            }));
        });
        describe("Authentication and authorization", () => {
            it("should reject request without authentication", () => __awaiter(void 0, void 0, void 0, function* () {
                const response = yield (0, supertest_1.default)(app_1.default)
                    .post("/api/v1/documents")
                    .field("documentType", entities_1.DocumentType.PASSPORT)
                    .attach("document", mockFile.buffer, mockFile.originalname);
                expect(response.status).toBe(401);
                expect(response.body).toMatchObject({
                    success: false,
                    message: "Access token required",
                });
            }));
            it("should reject request with invalid token", () => __awaiter(void 0, void 0, void 0, function* () {
                const response = yield (0, supertest_1.default)(app_1.default)
                    .post("/api/v1/documents")
                    .set("Authorization", "Bearer invalid-token")
                    .field("documentType", entities_1.DocumentType.PASSPORT)
                    .attach("document", mockFile.buffer, mockFile.originalname);
                expect(response.status).toBe(401);
                expect(response.body).toMatchObject({
                    success: false,
                    message: "Invalid or expired token",
                });
            }));
        });
        describe("Validation errors", () => {
            it("should reject request without file", () => __awaiter(void 0, void 0, void 0, function* () {
                const response = yield (0, supertest_1.default)(app_1.default)
                    .post("/api/v1/documents")
                    .set("Authorization", `Bearer ${validUserToken}`)
                    .field("documentType", entities_1.DocumentType.PASSPORT);
                expect(response.status).toBe(400);
                expect(response.body).toMatchObject({
                    success: false,
                    message: "No file uploaded. Please upload a document",
                });
            }));
            it("should reject request without document type", () => __awaiter(void 0, void 0, void 0, function* () {
                const response = yield (0, supertest_1.default)(app_1.default)
                    .post("/api/v1/documents")
                    .set("Authorization", `Bearer ${validUserToken}`)
                    .attach("document", mockFile.buffer, mockFile.originalname);
                expect(response.status).toBe(400);
                expect(response.body).toMatchObject({
                    success: false,
                    message: "Validation error",
                });
            }));
            it("should reject request with invalid document type", () => __awaiter(void 0, void 0, void 0, function* () {
                const response = yield (0, supertest_1.default)(app_1.default)
                    .post("/api/v1/documents")
                    .set("Authorization", `Bearer ${validUserToken}`)
                    .field("documentType", "invalid_type")
                    .attach("document", mockFile.buffer, mockFile.originalname);
                expect(response.status).toBe(400);
                expect(response.body).toMatchObject({
                    success: false,
                    message: "Validation error",
                });
            }));
        });
        describe("File upload errors", () => {
            it("should handle file storage service errors", () => __awaiter(void 0, void 0, void 0, function* () {
                fileStorageService_1.fileStorageService.uploadFile.mockRejectedValue(new Error("File upload failed"));
                const response = yield (0, supertest_1.default)(app_1.default)
                    .post("/api/v1/documents")
                    .set("Authorization", `Bearer ${validUserToken}`)
                    .field("documentType", entities_1.DocumentType.PASSPORT)
                    .attach("document", mockFile.buffer, mockFile.originalname);
                expect(response.status).toBe(500);
                expect(response.body).toMatchObject({
                    success: false,
                    message: "Internal server error",
                });
            }));
        });
    });
    describe("GET /api/v1/documents", () => {
        describe("Successful document retrieval", () => {
            it("should return user documents with pagination", () => __awaiter(void 0, void 0, void 0, function* () {
                const mockDocuments = [mockDocument];
                const mockResult = {
                    count: 1,
                    rows: mockDocuments,
                };
                entities_1.Document.findAndCountAll.mockResolvedValue(mockResult);
                const response = yield (0, supertest_1.default)(app_1.default)
                    .get("/api/v1/documents")
                    .set("Authorization", `Bearer ${validUserToken}`);
                expect(response.status).toBe(200);
                expect(response.body).toMatchObject({
                    success: true,
                    data: {
                        documents: expect.arrayContaining([
                            expect.objectContaining({
                                id: mockDocument.id,
                                documentType: mockDocument.documentType,
                                status: mockDocument.status,
                            }),
                        ]),
                        total: 1,
                        totalPages: 1,
                    },
                });
                expect(entities_1.Document.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
                    where: { userId: mockUser.id },
                    limit: 10,
                    offset: 0,
                    order: [["createdAt", "DESC"]],
                }));
            }));
            it("should support pagination parameters", () => __awaiter(void 0, void 0, void 0, function* () {
                entities_1.Document.findAndCountAll.mockResolvedValue({
                    count: 0,
                    rows: [],
                });
                const response = yield (0, supertest_1.default)(app_1.default)
                    .get("/api/v1/documents")
                    .set("Authorization", `Bearer ${validUserToken}`)
                    .query({ page: 2, limit: 5 });
                expect(response.status).toBe(200);
                expect(entities_1.Document.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
                    limit: 5,
                    offset: 5, // (page - 1) * limit = (2 - 1) * 5 = 5
                }));
            }));
            it("should support status filtering", () => __awaiter(void 0, void 0, void 0, function* () {
                entities_1.Document.findAndCountAll.mockResolvedValue({
                    count: 0,
                    rows: [],
                });
                const response = yield (0, supertest_1.default)(app_1.default)
                    .get("/api/v1/documents")
                    .set("Authorization", `Bearer ${validUserToken}`)
                    .query({ status: entities_1.DocumentStatus.VERIFIED });
                expect(response.status).toBe(200);
                expect(entities_1.Document.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
                    where: {
                        userId: mockUser.id,
                        status: entities_1.DocumentStatus.VERIFIED,
                    },
                }));
            }));
            it("should support document type filtering", () => __awaiter(void 0, void 0, void 0, function* () {
                entities_1.Document.findAndCountAll.mockResolvedValue({
                    count: 0,
                    rows: [],
                });
                const response = yield (0, supertest_1.default)(app_1.default)
                    .get("/api/v1/documents")
                    .set("Authorization", `Bearer ${validUserToken}`)
                    .query({ documentType: entities_1.DocumentType.PASSPORT });
                expect(response.status).toBe(200);
                expect(entities_1.Document.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
                    where: {
                        userId: mockUser.id,
                        documentType: entities_1.DocumentType.PASSPORT,
                    },
                }));
            }));
        });
        describe("Authentication failures", () => {
            it("should reject request without authentication", () => __awaiter(void 0, void 0, void 0, function* () {
                const response = yield (0, supertest_1.default)(app_1.default).get("/api/v1/documents");
                expect(response.status).toBe(401);
                expect(response.body).toMatchObject({
                    success: false,
                    message: "Access token required",
                });
            }));
        });
        describe("Validation errors", () => {
            it("should reject invalid pagination parameters", () => __awaiter(void 0, void 0, void 0, function* () {
                const response = yield (0, supertest_1.default)(app_1.default)
                    .get("/api/v1/documents")
                    .set("Authorization", `Bearer ${validUserToken}`)
                    .query({ page: 0, limit: 101 });
                expect(response.status).toBe(400);
                expect(response.body).toMatchObject({
                    success: false,
                    message: "Validation error",
                });
            }));
            it("should reject invalid status filter", () => __awaiter(void 0, void 0, void 0, function* () {
                const response = yield (0, supertest_1.default)(app_1.default)
                    .get("/api/v1/documents")
                    .set("Authorization", `Bearer ${validUserToken}`)
                    .query({ status: "INVALID_STATUS" });
                expect(response.status).toBe(400);
                expect(response.body).toMatchObject({
                    success: false,
                    message: "Validation error",
                });
            }));
        });
    });
    describe("DELETE /api/v1/documents/:id", () => {
        describe("Successful document deletion", () => {
            it("should delete user's document successfully", () => __awaiter(void 0, void 0, void 0, function* () {
                const mockDocumentToDelete = Object.assign(Object.assign({}, mockDocument), { destroy: jest.fn().mockResolvedValue(true) });
                entities_1.Document.findOne.mockResolvedValue(mockDocumentToDelete);
                fileStorageService_1.fileStorageService.deleteFile.mockResolvedValue(true);
                const response = yield (0, supertest_1.default)(app_1.default)
                    .delete(`/api/v1/documents/${mockDocument.id}`)
                    .set("Authorization", `Bearer ${validUserToken}`);
                expect(response.status).toBe(200);
                expect(response.body).toMatchObject({
                    success: true,
                    message: "Document deleted successfully",
                });
                expect(entities_1.Document.findOne).toHaveBeenCalledWith({
                    where: { id: mockDocument.id, userId: mockUser.id },
                });
                expect(fileStorageService_1.fileStorageService.deleteFile).toHaveBeenCalledWith(mockDocument.cloudinaryPublicId);
                expect(mockDocumentToDelete.destroy).toHaveBeenCalled();
            }));
        });
        describe("Document not found", () => {
            it("should return 404 for non-existent document", () => __awaiter(void 0, void 0, void 0, function* () {
                entities_1.Document.findOne.mockResolvedValue(null);
                const response = yield (0, supertest_1.default)(app_1.default)
                    .delete(`/api/v1/documents/${mockDocument.id}`)
                    .set("Authorization", `Bearer ${validUserToken}`);
                expect(response.status).toBe(404);
                expect(response.body).toMatchObject({
                    success: false,
                    message: "Document not found",
                });
            }));
            it("should not allow user to delete another user's document", () => __awaiter(void 0, void 0, void 0, function* () {
                // Document exists but belongs to different user
                entities_1.Document.findOne.mockResolvedValue(null);
                const response = yield (0, supertest_1.default)(app_1.default)
                    .delete(`/api/v1/documents/${mockDocument.id}`)
                    .set("Authorization", `Bearer ${validUserToken}`);
                expect(response.status).toBe(404);
                expect(entities_1.Document.findOne).toHaveBeenCalledWith({
                    where: { id: mockDocument.id, userId: mockUser.id },
                });
            }));
        });
        describe("Validation errors", () => {
            it("should reject invalid document ID format", () => __awaiter(void 0, void 0, void 0, function* () {
                const response = yield (0, supertest_1.default)(app_1.default)
                    .delete("/api/v1/documents/invalid-id")
                    .set("Authorization", `Bearer ${validUserToken}`);
                expect(response.status).toBe(400);
                expect(response.body).toMatchObject({
                    success: false,
                    message: "Invalid document ID",
                });
            }));
        });
    });
    describe("Admin Endpoints", () => {
        describe("GET /api/v1/admin/documents", () => {
            describe("Successful admin document retrieval", () => {
                it("should return all documents for admin users", () => __awaiter(void 0, void 0, void 0, function* () {
                    const mockDocuments = [mockDocument];
                    const mockResult = {
                        count: 1,
                        rows: mockDocuments,
                    };
                    // Mock admin user authentication
                    entities_1.User.findByPk.mockResolvedValue(mockAdmin);
                    entities_1.Document.findAndCountAll.mockResolvedValue(mockResult);
                    const response = yield (0, supertest_1.default)(app_1.default)
                        .get("/api/v1/admin/documents")
                        .set("Authorization", `Bearer ${validAdminToken}`);
                    expect(response.status).toBe(200);
                    expect(response.body).toMatchObject({
                        success: true,
                        data: {
                            documents: expect.arrayContaining([
                                expect.objectContaining({
                                    id: mockDocument.id,
                                    documentType: mockDocument.documentType,
                                }),
                            ]),
                            total: 1,
                        },
                    });
                    // Admin should see all documents, not filtered by userId
                    expect(entities_1.Document.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
                        where: {},
                        include: expect.arrayContaining([
                            expect.objectContaining({ model: entities_1.User }),
                        ]),
                    }));
                }));
                it("should support admin filtering by user ID", () => __awaiter(void 0, void 0, void 0, function* () {
                    entities_1.User.findByPk.mockResolvedValue(mockAdmin);
                    entities_1.Document.findAndCountAll.mockResolvedValue({
                        count: 0,
                        rows: [],
                    });
                    const response = yield (0, supertest_1.default)(app_1.default)
                        .get("/api/v1/admin/documents")
                        .set("Authorization", `Bearer ${validAdminToken}`)
                        .query({ userId: mockUser.id });
                    expect(response.status).toBe(200);
                    // Note: This depends on your implementation of admin filtering
                }));
            });
            describe("Access control", () => {
                it("should reject non-admin users", () => __awaiter(void 0, void 0, void 0, function* () {
                    // Mock regular user trying to access admin endpoint
                    entities_1.User.findByPk.mockResolvedValue(mockUser);
                    const response = yield (0, supertest_1.default)(app_1.default)
                        .get("/api/v1/admin/documents")
                        .set("Authorization", `Bearer ${validUserToken}`);
                    expect(response.status).toBe(403);
                    expect(response.body).toMatchObject({
                        success: false,
                        message: "Insufficient permissions",
                    });
                }));
                it("should reject unauthenticated requests", () => __awaiter(void 0, void 0, void 0, function* () {
                    const response = yield (0, supertest_1.default)(app_1.default).get("/api/v1/admin/documents");
                    expect(response.status).toBe(401);
                    expect(response.body).toMatchObject({
                        success: false,
                        message: "Access token required",
                    });
                }));
            });
        });
        describe("GET /api/v1/admin/documents/stats", () => {
            it("should return document statistics for admin", () => __awaiter(void 0, void 0, void 0, function* () {
                entities_1.User.findByPk.mockResolvedValue(mockAdmin);
                // Mock document statistics
                const mockStats = {
                    totalDocuments: 10,
                    statusBreakdown: [
                        { status: entities_1.DocumentStatus.PENDING, count: 5 },
                        { status: entities_1.DocumentStatus.VERIFIED, count: 3 },
                        { status: entities_1.DocumentStatus.FAILED, count: 2 },
                    ],
                    typeBreakdown: [
                        { documentType: entities_1.DocumentType.PASSPORT, count: 4 },
                        { documentType: entities_1.DocumentType.DRIVERS_LICENSE, count: 3 },
                        { documentType: entities_1.DocumentType.NATIONAL_ID, count: 3 },
                    ],
                };
                // Mock the getDocumentStats method in DocumentUseCase
                jest.doMock("../src/application/use-cases/DocumentUseCase", () => ({
                    DocumentUseCase: jest.fn().mockImplementation(() => ({
                        getDocumentStats: jest.fn().mockResolvedValue(mockStats),
                    })),
                }));
                const response = yield (0, supertest_1.default)(app_1.default)
                    .get("/api/v1/admin/documents/stats")
                    .set("Authorization", `Bearer ${validAdminToken}`);
                expect(response.status).toBe(200);
                expect(response.body).toMatchObject({
                    success: true,
                    data: expect.objectContaining({
                        totalDocuments: expect.any(Number),
                        statusBreakdown: expect.any(Array),
                        typeBreakdown: expect.any(Array),
                    }),
                });
            }));
        });
        describe("GET /api/v1/admin/users", () => {
            it("should return all users for admin", () => __awaiter(void 0, void 0, void 0, function* () {
                entities_1.User.findByPk.mockResolvedValue(mockAdmin);
                const mockUsers = [mockUser, mockAdmin];
                const mockResult = {
                    users: mockUsers,
                    total: 2,
                    totalPages: 1,
                };
                // Mock AuthUseCase getAllUsers method
                jest.doMock("../src/application/use-cases/AuthUseCase", () => ({
                    AuthUseCase: jest.fn().mockImplementation(() => ({
                        getAllUsers: jest.fn().mockResolvedValue(mockResult),
                    })),
                }));
                const response = yield (0, supertest_1.default)(app_1.default)
                    .get("/api/v1/admin/users")
                    .set("Authorization", `Bearer ${validAdminToken}`);
                expect(response.status).toBe(200);
                expect(response.body).toMatchObject({
                    success: true,
                    data: expect.objectContaining({
                        users: expect.any(Array),
                        total: expect.any(Number),
                    }),
                });
            }));
        });
    });
});
