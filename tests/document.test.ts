import request from "supertest";
import app from "../src/app";
import {
  User,
  Document,
  UserRole,
  DocumentType,
  DocumentStatus,
} from "../src/domain/entities";
import { fileStorageService } from "../src/infrastructure/external-services/fileStorageService";
import { queueService } from "../src/infrastructure/queue/queueService";
import "./setup";

describe("Document Management API", () => {
  // Mock data
  const mockUser = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    email: "user@example.com",
    firstName: "Test",
    lastName: "User",
    role: UserRole.USER,
    isActive: true,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };

  const mockAdmin = {
    id: "550e8400-e29b-41d4-a716-446655440001",
    email: "admin@example.com",
    firstName: "Test",
    lastName: "Admin",
    role: UserRole.ADMIN,
    isActive: true,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };

  const mockDocument = {
    id: "550e8400-e29b-41d4-a716-446655440002",
    userId: mockUser.id,
    documentType: DocumentType.PASSPORT,
    documentUrl: "http://test.com/documents/test-document.pdf",
    fileName: "test-document.pdf",
    fileSize: 1024,
    mimeType: "application/pdf",
    cloudinaryPublicId: "test-public-id",
    status: DocumentStatus.PENDING,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
    destroy: jest.fn(),
  };

  const validUserToken =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJyb2xlIjoidXNlciIsImlhdCI6MTYzOTc1NDQwMCwiZXhwIjoxNjM5ODQwODAwfQ.test";
  const validAdminToken =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDEiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNjM5NzU0NDAwLCJleHAiOjE2Mzk4NDA4MDB9.admin";

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default user mocks
    (User.findByPk as jest.Mock).mockImplementation((id: string) => {
      if (id === mockUser.id) return Promise.resolve(mockUser);
      if (id === mockAdmin.id) return Promise.resolve(mockAdmin);
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
      it("should upload document successfully with valid data", async () => {
        const mockCreatedDocument = {
          ...mockDocument,
          toJSON: () => mockDocument,
        };

        (Document.create as jest.Mock).mockResolvedValue(mockCreatedDocument);
        (fileStorageService.uploadFile as jest.Mock).mockResolvedValue({
          fileName: mockDocument.fileName,
          fileUrl: mockDocument.documentUrl,
          fileSize: mockDocument.fileSize,
          cloudinaryPublicId: mockDocument.cloudinaryPublicId,
        });
        (
          queueService.publishDocumentVerification as jest.Mock
        ).mockResolvedValue(true);

        const response = await request(app)
          .post("/api/v1/documents")
          .set("Authorization", `Bearer ${validUserToken}`)
          .field("documentType", DocumentType.PASSPORT)
          .attach("document", mockFile.buffer, mockFile.originalname);

        expect(response.status).toBe(201);
        expect(response.body).toMatchObject({
          success: true,
          message: "Document uploaded successfully and queued for verification",
          data: expect.objectContaining({
            documentType: DocumentType.PASSPORT,
            status: DocumentStatus.PENDING,
            userId: mockUser.id,
            fileName: expect.any(String),
            fileSize: expect.any(Number),
          }),
        });

        expect(fileStorageService.uploadFile).toHaveBeenCalledWith(
          expect.objectContaining({
            buffer: mockFile.buffer,
            originalName: mockFile.originalname,
            mimeType: mockFile.mimetype,
          })
        );
        expect(queueService.publishDocumentVerification).toHaveBeenCalledWith(
          expect.objectContaining({
            documentId: mockDocument.id,
          })
        );
      });

      it("should upload different document types successfully", async () => {
        const documentTypes = [
          DocumentType.DRIVERS_LICENSE,
          DocumentType.NATIONAL_ID,
          DocumentType.UTILITY_BILL,
          DocumentType.BANK_STATEMENT,
          DocumentType.OTHER,
        ];

        for (const documentType of documentTypes) {
          const mockDoc = { ...mockDocument, documentType };
          (Document.create as jest.Mock).mockResolvedValue({
            ...mockDoc,
            toJSON: () => mockDoc,
          });

          const response = await request(app)
            .post("/api/v1/documents")
            .set("Authorization", `Bearer ${validUserToken}`)
            .field("documentType", documentType)
            .attach("document", mockFile.buffer, mockFile.originalname);

          expect(response.status).toBe(201);
          expect(response.body.data.documentType).toBe(documentType);
        }
      });
    });

    describe("Authentication and authorization", () => {
      it("should reject request without authentication", async () => {
        const response = await request(app)
          .post("/api/v1/documents")
          .field("documentType", DocumentType.PASSPORT)
          .attach("document", mockFile.buffer, mockFile.originalname);

        expect(response.status).toBe(401);
        expect(response.body).toMatchObject({
          success: false,
          message: "Access token required",
        });
      });

      it("should reject request with invalid token", async () => {
        const response = await request(app)
          .post("/api/v1/documents")
          .set("Authorization", "Bearer invalid-token")
          .field("documentType", DocumentType.PASSPORT)
          .attach("document", mockFile.buffer, mockFile.originalname);

        expect(response.status).toBe(401);
        expect(response.body).toMatchObject({
          success: false,
          message: "Invalid or expired token",
        });
      });
    });

    describe("Validation errors", () => {
      it("should reject request without file", async () => {
        const response = await request(app)
          .post("/api/v1/documents")
          .set("Authorization", `Bearer ${validUserToken}`)
          .field("documentType", DocumentType.PASSPORT);

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({
          success: false,
          message: "No file uploaded. Please upload a document",
        });
      });

      it("should reject request without document type", async () => {
        const response = await request(app)
          .post("/api/v1/documents")
          .set("Authorization", `Bearer ${validUserToken}`)
          .attach("document", mockFile.buffer, mockFile.originalname);

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({
          success: false,
          message: "Validation error",
        });
      });

      it("should reject request with invalid document type", async () => {
        const response = await request(app)
          .post("/api/v1/documents")
          .set("Authorization", `Bearer ${validUserToken}`)
          .field("documentType", "invalid_type")
          .attach("document", mockFile.buffer, mockFile.originalname);

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({
          success: false,
          message: "Validation error",
        });
      });
    });

    describe("File upload errors", () => {
      it("should handle file storage service errors", async () => {
        (fileStorageService.uploadFile as jest.Mock).mockRejectedValue(
          new Error("File upload failed")
        );

        const response = await request(app)
          .post("/api/v1/documents")
          .set("Authorization", `Bearer ${validUserToken}`)
          .field("documentType", DocumentType.PASSPORT)
          .attach("document", mockFile.buffer, mockFile.originalname);

        expect(response.status).toBe(500);
        expect(response.body).toMatchObject({
          success: false,
          message: "Internal server error",
        });
      });
    });
  });

  describe("GET /api/v1/documents", () => {
    describe("Successful document retrieval", () => {
      it("should return user documents with pagination", async () => {
        const mockDocuments = [mockDocument];
        const mockResult = {
          count: 1,
          rows: mockDocuments,
        };

        (Document.findAndCountAll as jest.Mock).mockResolvedValue(mockResult);

        const response = await request(app)
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

        expect(Document.findAndCountAll).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { userId: mockUser.id },
            limit: 10,
            offset: 0,
            order: [["createdAt", "DESC"]],
          })
        );
      });

      it("should support pagination parameters", async () => {
        (Document.findAndCountAll as jest.Mock).mockResolvedValue({
          count: 0,
          rows: [],
        });

        const response = await request(app)
          .get("/api/v1/documents")
          .set("Authorization", `Bearer ${validUserToken}`)
          .query({ page: 2, limit: 5 });

        expect(response.status).toBe(200);
        expect(Document.findAndCountAll).toHaveBeenCalledWith(
          expect.objectContaining({
            limit: 5,
            offset: 5, // (page - 1) * limit = (2 - 1) * 5 = 5
          })
        );
      });

      it("should support status filtering", async () => {
        (Document.findAndCountAll as jest.Mock).mockResolvedValue({
          count: 0,
          rows: [],
        });

        const response = await request(app)
          .get("/api/v1/documents")
          .set("Authorization", `Bearer ${validUserToken}`)
          .query({ status: DocumentStatus.VERIFIED });

        expect(response.status).toBe(200);
        expect(Document.findAndCountAll).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              userId: mockUser.id,
              status: DocumentStatus.VERIFIED,
            },
          })
        );
      });

      it("should support document type filtering", async () => {
        (Document.findAndCountAll as jest.Mock).mockResolvedValue({
          count: 0,
          rows: [],
        });

        const response = await request(app)
          .get("/api/v1/documents")
          .set("Authorization", `Bearer ${validUserToken}`)
          .query({ documentType: DocumentType.PASSPORT });

        expect(response.status).toBe(200);
        expect(Document.findAndCountAll).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              userId: mockUser.id,
              documentType: DocumentType.PASSPORT,
            },
          })
        );
      });
    });

    describe("Authentication failures", () => {
      it("should reject request without authentication", async () => {
        const response = await request(app).get("/api/v1/documents");

        expect(response.status).toBe(401);
        expect(response.body).toMatchObject({
          success: false,
          message: "Access token required",
        });
      });
    });

    describe("Validation errors", () => {
      it("should reject invalid pagination parameters", async () => {
        const response = await request(app)
          .get("/api/v1/documents")
          .set("Authorization", `Bearer ${validUserToken}`)
          .query({ page: 0, limit: 101 });

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({
          success: false,
          message: "Validation error",
        });
      });

      it("should reject invalid status filter", async () => {
        const response = await request(app)
          .get("/api/v1/documents")
          .set("Authorization", `Bearer ${validUserToken}`)
          .query({ status: "INVALID_STATUS" });

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({
          success: false,
          message: "Validation error",
        });
      });
    });
  });

  describe("DELETE /api/v1/documents/:id", () => {
    describe("Successful document deletion", () => {
      it("should delete user's document successfully", async () => {
        const mockDocumentToDelete = {
          ...mockDocument,
          destroy: jest.fn().mockResolvedValue(true),
        };

        (Document.findOne as jest.Mock).mockResolvedValue(mockDocumentToDelete);
        (fileStorageService.deleteFile as jest.Mock).mockResolvedValue(true);

        const response = await request(app)
          .delete(`/api/v1/documents/${mockDocument.id}`)
          .set("Authorization", `Bearer ${validUserToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          success: true,
          message: "Document deleted successfully",
        });

        expect(Document.findOne).toHaveBeenCalledWith({
          where: { id: mockDocument.id, userId: mockUser.id },
        });
        expect(fileStorageService.deleteFile).toHaveBeenCalledWith(
          mockDocument.cloudinaryPublicId
        );
        expect(mockDocumentToDelete.destroy).toHaveBeenCalled();
      });
    });

    describe("Document not found", () => {
      it("should return 404 for non-existent document", async () => {
        (Document.findOne as jest.Mock).mockResolvedValue(null);

        const response = await request(app)
          .delete(`/api/v1/documents/${mockDocument.id}`)
          .set("Authorization", `Bearer ${validUserToken}`);

        expect(response.status).toBe(404);
        expect(response.body).toMatchObject({
          success: false,
          message: "Document not found",
        });
      });

      it("should not allow user to delete another user's document", async () => {
        // Document exists but belongs to different user
        (Document.findOne as jest.Mock).mockResolvedValue(null);

        const response = await request(app)
          .delete(`/api/v1/documents/${mockDocument.id}`)
          .set("Authorization", `Bearer ${validUserToken}`);

        expect(response.status).toBe(404);
        expect(Document.findOne).toHaveBeenCalledWith({
          where: { id: mockDocument.id, userId: mockUser.id },
        });
      });
    });

    describe("Validation errors", () => {
      it("should reject invalid document ID format", async () => {
        const response = await request(app)
          .delete("/api/v1/documents/invalid-id")
          .set("Authorization", `Bearer ${validUserToken}`);

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({
          success: false,
          message: "Invalid document ID",
        });
      });
    });
  });

  describe("Admin Endpoints", () => {
    describe("GET /api/v1/admin/documents", () => {
      describe("Successful admin document retrieval", () => {
        it("should return all documents for admin users", async () => {
          const mockDocuments = [mockDocument];
          const mockResult = {
            count: 1,
            rows: mockDocuments,
          };

          // Mock admin user authentication
          (User.findByPk as jest.Mock).mockResolvedValue(mockAdmin);
          (Document.findAndCountAll as jest.Mock).mockResolvedValue(mockResult);

          const response = await request(app)
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
          expect(Document.findAndCountAll).toHaveBeenCalledWith(
            expect.objectContaining({
              where: {},
              include: expect.arrayContaining([
                expect.objectContaining({ model: User }),
              ]),
            })
          );
        });

        it("should support admin filtering by user ID", async () => {
          (User.findByPk as jest.Mock).mockResolvedValue(mockAdmin);
          (Document.findAndCountAll as jest.Mock).mockResolvedValue({
            count: 0,
            rows: [],
          });

          const response = await request(app)
            .get("/api/v1/admin/documents")
            .set("Authorization", `Bearer ${validAdminToken}`)
            .query({ userId: mockUser.id });

          expect(response.status).toBe(200);
          // Note: This depends on your implementation of admin filtering
        });
      });

      describe("Access control", () => {
        it("should reject non-admin users", async () => {
          // Mock regular user trying to access admin endpoint
          (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

          const response = await request(app)
            .get("/api/v1/admin/documents")
            .set("Authorization", `Bearer ${validUserToken}`);

          expect(response.status).toBe(403);
          expect(response.body).toMatchObject({
            success: false,
            message: "Insufficient permissions",
          });
        });

        it("should reject unauthenticated requests", async () => {
          const response = await request(app).get("/api/v1/admin/documents");

          expect(response.status).toBe(401);
          expect(response.body).toMatchObject({
            success: false,
            message: "Access token required",
          });
        });
      });
    });

    describe("GET /api/v1/admin/documents/stats", () => {
      it("should return document statistics for admin", async () => {
        (User.findByPk as jest.Mock).mockResolvedValue(mockAdmin);

        // Mock document statistics
        const mockStats = {
          totalDocuments: 10,
          statusBreakdown: [
            { status: DocumentStatus.PENDING, count: 5 },
            { status: DocumentStatus.VERIFIED, count: 3 },
            { status: DocumentStatus.FAILED, count: 2 },
          ],
          typeBreakdown: [
            { documentType: DocumentType.PASSPORT, count: 4 },
            { documentType: DocumentType.DRIVERS_LICENSE, count: 3 },
            { documentType: DocumentType.NATIONAL_ID, count: 3 },
          ],
        };

        // Mock the getDocumentStats method in DocumentUseCase
        jest.doMock("../src/application/use-cases/DocumentUseCase", () => ({
          DocumentUseCase: jest.fn().mockImplementation(() => ({
            getDocumentStats: jest.fn().mockResolvedValue(mockStats),
          })),
        }));

        const response = await request(app)
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
      });
    });

    describe("GET /api/v1/admin/users", () => {
      it("should return all users for admin", async () => {
        (User.findByPk as jest.Mock).mockResolvedValue(mockAdmin);

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

        const response = await request(app)
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
      });
    });
  });
});
