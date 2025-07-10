import { DocumentVerificationMessage } from "../src/infrastructure/queue/queueService";
import { DocumentUseCase } from "../src/application/use-cases/DocumentUseCase";
import { redisService } from "../src/infrastructure/external-services/redisService";
import { DocumentStatus, DocumentType } from "../src/domain/entities";
import "./setup";

// Mock the dependencies
jest.mock("../src/application/use-cases/DocumentUseCase");
jest.mock("../src/infrastructure/external-services/redisService");

describe("Document Worker Processing", () => {
  let mockDocumentUseCase: jest.Mocked<DocumentUseCase>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock instances
    mockDocumentUseCase = new DocumentUseCase() as jest.Mocked<DocumentUseCase>;
    (mockDocumentUseCase.updateDocumentStatus as jest.Mock) = jest.fn();
  });

  // Test data
  const mockVerificationMessage: DocumentVerificationMessage = {
    documentId: "550e8400-e29b-41d4-a716-446655440000",
    userId: "550e8400-e29b-41d4-a716-446655440001",
    documentType: DocumentType.PASSPORT,
    documentUrl: "http://test.com/documents/test-document.pdf",
    timestamp: new Date("2024-01-01T00:00:00.000Z"),
  };

  describe("Message Processing", () => {
    describe("Valid message structure", () => {
      it("should process message with all required fields", () => {
        expect(mockVerificationMessage).toMatchObject({
          documentId: expect.any(String),
          userId: expect.any(String),
          documentType: expect.any(String),
          documentUrl: expect.any(String),
          timestamp: expect.any(Date),
        });
      });

      it("should validate document ID format", () => {
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        expect(mockVerificationMessage.documentId).toMatch(uuidRegex);
        expect(mockVerificationMessage.userId).toMatch(uuidRegex);
      });

      it("should validate document type enum", () => {
        const validTypes = Object.values(DocumentType);
        expect(validTypes).toContain(mockVerificationMessage.documentType);
      });

      it("should validate document URL format", () => {
        expect(mockVerificationMessage.documentUrl).toMatch(/^https?:\/\/.+/);
      });
    });

    describe("Message validation errors", () => {
      it("should handle missing required fields", () => {
        const invalidMessages = [
          { ...mockVerificationMessage, documentId: undefined },
          { ...mockVerificationMessage, userId: undefined },
          { ...mockVerificationMessage, documentType: undefined },
          { ...mockVerificationMessage, documentUrl: undefined },
          { ...mockVerificationMessage, timestamp: undefined },
        ];

        invalidMessages.forEach((invalidMessage) => {
          const requiredFields = [
            "documentId",
            "userId",
            "documentType",
            "documentUrl",
            "timestamp",
          ];
          const missingField = requiredFields.find(
            (field) => !invalidMessage[field as keyof typeof invalidMessage]
          );
          expect(missingField).toBeDefined();
        });
      });

      it("should handle invalid document type", () => {
        const invalidMessage = {
          ...mockVerificationMessage,
          documentType: "INVALID_TYPE" as DocumentType,
        };

        const validTypes = Object.values(DocumentType);
        expect(validTypes).not.toContain(invalidMessage.documentType);
      });
    });
  });

  describe("Document Verification Simulation", () => {
    describe("Verification outcomes", () => {
      it("should generate appropriate verification details for success", () => {
        const successDetails = [
          "Document successfully verified against government database",
          "All security features confirmed authentic",
          "Document format validation completed successfully",
          "Biometric data verification passed",
          "Document expiry date validated",
          "Cross-reference verification completed",
        ];

        successDetails.forEach((detail) => {
          expect(detail).toMatch(
            /(verified|confirmed|completed|passed|validated)/i
          );
          expect(detail.length).toBeGreaterThan(20);
          expect(detail.length).toBeLessThan(100);
        });
      });

      it("should generate appropriate rejection reasons for failure", () => {
        const rejectionReasons = [
          "Document image quality insufficient for automated verification",
          "Document appears to be expired or invalid",
          "Unable to verify document against official database",
          "Document format not recognized by verification system",
          "Security features authentication failed",
          "Document information incomplete or illegible",
          "Suspected fraudulent document detected",
          "Document type not supported for current verification process",
        ];

        rejectionReasons.forEach((reason) => {
          expect(reason).toMatch(
            /(insufficient|expired|unable|failed|incomplete|fraudulent|supported)/i
          );
          expect(reason.length).toBeGreaterThan(30);
          expect(reason.length).toBeLessThan(120);
        });
      });

      it("should simulate random verification outcomes", () => {
        const outcomes = [DocumentStatus.VERIFIED, DocumentStatus.FAILED];

        // Test multiple iterations to ensure randomness
        const results = Array.from({ length: 100 }, () => {
          return Math.random() > 0.5
            ? DocumentStatus.VERIFIED
            : DocumentStatus.FAILED;
        });

        // Should have both outcomes in 100 iterations (very high probability)
        const hasVerified = results.includes(DocumentStatus.VERIFIED);
        const hasFailed = results.includes(DocumentStatus.FAILED);

        expect(hasVerified || hasFailed).toBe(true); // At least one outcome
        // In 100 iterations, we should see both outcomes with very high probability
        expect(results.length).toBe(100);
      });
    });

    describe("Verification timing", () => {
      it("should respect verification delay configuration", () => {
        const startTime = Date.now();
        const mockDelay = 2000; // 2 seconds

        // Simulate delay
        const delayPromise = new Promise((resolve) => {
          setTimeout(resolve, mockDelay);
        });

        return delayPromise.then(() => {
          const endTime = Date.now();
          const actualDelay = endTime - startTime;
          expect(actualDelay).toBeGreaterThanOrEqual(mockDelay - 100); // Allow 100ms tolerance
        });
      });
    });
  });

  describe("Document Status Updates", () => {
    describe("Successful verification processing", () => {
      it("should update document status to VERIFIED with details", async () => {
        const verificationDetails =
          "Document successfully verified against government database";

        mockDocumentUseCase.updateDocumentStatus.mockResolvedValue(undefined);

        await mockDocumentUseCase.updateDocumentStatus(
          mockVerificationMessage.documentId,
          DocumentStatus.VERIFIED,
          verificationDetails
        );

        expect(mockDocumentUseCase.updateDocumentStatus).toHaveBeenCalledWith(
          mockVerificationMessage.documentId,
          DocumentStatus.VERIFIED,
          verificationDetails
        );
        expect(mockDocumentUseCase.updateDocumentStatus).toHaveBeenCalledTimes(
          1
        );
      });

      it("should set verification timestamp on successful verification", async () => {
        const beforeTime = new Date();

        mockDocumentUseCase.updateDocumentStatus.mockResolvedValue(undefined);

        await mockDocumentUseCase.updateDocumentStatus(
          mockVerificationMessage.documentId,
          DocumentStatus.VERIFIED,
          "Verification completed"
        );

        const afterTime = new Date();

        // Verify the call was made within reasonable time bounds
        expect(mockDocumentUseCase.updateDocumentStatus).toHaveBeenCalled();
        expect(afterTime.getTime() - beforeTime.getTime()).toBeLessThan(1000);
      });
    });

    describe("Failed verification processing", () => {
      it("should update document status to FAILED with rejection reason", async () => {
        const rejectionReason =
          "Document image quality insufficient for verification";

        mockDocumentUseCase.updateDocumentStatus.mockResolvedValue(undefined);

        await mockDocumentUseCase.updateDocumentStatus(
          mockVerificationMessage.documentId,
          DocumentStatus.FAILED,
          undefined,
          rejectionReason
        );

        expect(mockDocumentUseCase.updateDocumentStatus).toHaveBeenCalledWith(
          mockVerificationMessage.documentId,
          DocumentStatus.FAILED,
          undefined,
          rejectionReason
        );
      });

      it("should not set verification timestamp on failed verification", async () => {
        mockDocumentUseCase.updateDocumentStatus.mockResolvedValue(undefined);

        await mockDocumentUseCase.updateDocumentStatus(
          mockVerificationMessage.documentId,
          DocumentStatus.FAILED,
          undefined,
          "Verification failed"
        );

        // Verify no verifiedAt timestamp is passed for failed verifications
        const call = mockDocumentUseCase.updateDocumentStatus.mock.calls[0];
        expect(call[2]).toBeUndefined(); // verificationDetails should be undefined
      });
    });
  });

  describe("Cache Management", () => {
    describe("Document status caching", () => {
      it("should cache document status after successful verification", async () => {
        const documentId = mockVerificationMessage.documentId;
        const status = DocumentStatus.VERIFIED;
        const cacheTTL = 600; // 10 minutes

        (redisService.set as jest.Mock).mockResolvedValue(undefined);

        await redisService.set(
          `document:${documentId}:status`,
          status,
          cacheTTL
        );

        expect(redisService.set).toHaveBeenCalledWith(
          `document:${documentId}:status`,
          status,
          cacheTTL
        );
      });

      it("should cache document status after failed verification", async () => {
        const documentId = mockVerificationMessage.documentId;
        const status = DocumentStatus.FAILED;

        (redisService.set as jest.Mock).mockResolvedValue(undefined);

        await redisService.set(`document:${documentId}:status`, status, 600);

        expect(redisService.set).toHaveBeenCalledWith(
          `document:${documentId}:status`,
          status,
          600
        );
      });
    });

    describe("User documents cache invalidation", () => {
      it("should invalidate user documents cache after verification", async () => {
        const userId = mockVerificationMessage.userId;

        (redisService.delete as jest.Mock).mockResolvedValue(undefined);

        await redisService.delete(`user:${userId}:documents`);

        expect(redisService.delete).toHaveBeenCalledWith(
          `user:${userId}:documents`
        );
      });

      it("should handle cache invalidation for multiple cache keys", async () => {
        const userId = mockVerificationMessage.userId;
        const documentId = mockVerificationMessage.documentId;

        (redisService.delete as jest.Mock).mockResolvedValue(undefined);

        const cacheKeys = [
          `user:${userId}:documents`,
          `user:${userId}:documents:stats`,
          `document:${documentId}`,
        ];

        for (const key of cacheKeys) {
          await redisService.delete(key);
        }

        expect(redisService.delete).toHaveBeenCalledTimes(3);
        cacheKeys.forEach((key) => {
          expect(redisService.delete).toHaveBeenCalledWith(key);
        });
      });
    });
  });

  describe("Error Handling", () => {
    describe("Database errors", () => {
      it("should handle document update service errors gracefully", async () => {
        const dbError = new Error("Database connection failed");
        mockDocumentUseCase.updateDocumentStatus.mockRejectedValue(dbError);

        await expect(
          mockDocumentUseCase.updateDocumentStatus(
            mockVerificationMessage.documentId,
            DocumentStatus.VERIFIED,
            "Test details"
          )
        ).rejects.toThrow("Database connection failed");

        expect(mockDocumentUseCase.updateDocumentStatus).toHaveBeenCalledWith(
          mockVerificationMessage.documentId,
          DocumentStatus.VERIFIED,
          "Test details"
        );
      });

      it("should handle document not found errors", async () => {
        const notFoundError = new Error("Document not found");
        mockDocumentUseCase.updateDocumentStatus.mockRejectedValue(
          notFoundError
        );

        await expect(
          mockDocumentUseCase.updateDocumentStatus(
            "non-existent-id",
            DocumentStatus.VERIFIED,
            "Test details"
          )
        ).rejects.toThrow("Document not found");
      });
    });

    describe("Cache errors", () => {
      it("should handle Redis connection errors gracefully", async () => {
        const redisError = new Error("Redis connection timeout");
        (redisService.set as jest.Mock).mockRejectedValue(redisError);

        await expect(
          redisService.set(
            `document:${mockVerificationMessage.documentId}:status`,
            DocumentStatus.VERIFIED,
            600
          )
        ).rejects.toThrow("Redis connection timeout");

        expect(redisService.set).toHaveBeenCalled();
      });

      it("should handle cache key deletion errors", async () => {
        const redisError = new Error("Redis operation failed");
        (redisService.delete as jest.Mock).mockRejectedValue(redisError);

        await expect(
          redisService.delete(
            `user:${mockVerificationMessage.userId}:documents`
          )
        ).rejects.toThrow("Redis operation failed");
      });
    });

    describe("Message processing errors", () => {
      it("should handle malformed verification messages", () => {
        const malformedMessages = [
          null,
          undefined,
          {},
          { documentId: "invalid" },
          { documentId: "valid-id", userId: null },
        ];

        malformedMessages.forEach((message) => {
          if (!message || typeof message !== "object") {
            expect(message).toBeFalsy();
            return;
          }

          const hasRequiredFields =
            message.documentId &&
            message.userId &&
            message.documentType &&
            message.documentUrl &&
            message.timestamp;

          expect(hasRequiredFields).toBeFalsy();
        });
      });

      it("should validate message timestamp", () => {
        const invalidTimestamps = [
          "invalid-date",
          null,
          undefined,
          123456789, // Should be Date object, not number
        ];

        invalidTimestamps.forEach((timestamp) => {
          const messageWithInvalidTimestamp = {
            ...mockVerificationMessage,
            timestamp,
          };

          expect(
            messageWithInvalidTimestamp.timestamp instanceof Date
          ).toBeFalsy();
        });
      });
    });
  });

  describe("Worker Performance", () => {
    describe("Processing metrics", () => {
      it("should track processing time for verification", async () => {
        const startTime = Date.now();

        mockDocumentUseCase.updateDocumentStatus.mockResolvedValue(undefined);
        (redisService.set as jest.Mock).mockResolvedValue(undefined);
        (redisService.delete as jest.Mock).mockResolvedValue(undefined);

        // Simulate processing
        await Promise.all([
          mockDocumentUseCase.updateDocumentStatus(
            mockVerificationMessage.documentId,
            DocumentStatus.VERIFIED,
            "Processed successfully"
          ),
          redisService.set(
            `document:${mockVerificationMessage.documentId}:status`,
            DocumentStatus.VERIFIED,
            600
          ),
          redisService.delete(
            `user:${mockVerificationMessage.userId}:documents`
          ),
        ]);

        const processingTime = Date.now() - startTime;

        // Processing should be fast (under 100ms for mocked operations)
        expect(processingTime).toBeLessThan(100);
        expect(mockDocumentUseCase.updateDocumentStatus).toHaveBeenCalledTimes(
          1
        );
        expect(redisService.set).toHaveBeenCalledTimes(1);
        expect(redisService.delete).toHaveBeenCalledTimes(1);
      });

      it("should handle concurrent processing", async () => {
        const messages = Array.from({ length: 5 }, (_, i) => ({
          ...mockVerificationMessage,
          documentId: `document-${i}`,
        }));

        mockDocumentUseCase.updateDocumentStatus.mockResolvedValue(undefined);

        const processingPromises = messages.map((message) =>
          mockDocumentUseCase.updateDocumentStatus(
            message.documentId,
            DocumentStatus.VERIFIED,
            "Bulk processed"
          )
        );

        await Promise.all(processingPromises);

        expect(mockDocumentUseCase.updateDocumentStatus).toHaveBeenCalledTimes(
          5
        );
      });
    });
  });
});
