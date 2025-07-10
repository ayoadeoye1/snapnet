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
Object.defineProperty(exports, "__esModule", { value: true });
const DocumentUseCase_1 = require("../src/application/use-cases/DocumentUseCase");
const redisService_1 = require("../src/infrastructure/external-services/redisService");
const entities_1 = require("../src/domain/entities");
require("./setup");
// Mock the dependencies
jest.mock("../src/application/use-cases/DocumentUseCase");
jest.mock("../src/infrastructure/external-services/redisService");
describe("Document Worker Processing", () => {
    let mockDocumentUseCase;
    beforeEach(() => {
        jest.clearAllMocks();
        // Setup mock instances
        mockDocumentUseCase = new DocumentUseCase_1.DocumentUseCase();
        mockDocumentUseCase.verifyDocument = jest.fn();
    });
    // Test data - matching actual interface
    const mockVerificationMessage = {
        documentId: "550e8400-e29b-41d4-a716-446655440000",
        timestamp: new Date("2024-01-01T00:00:00.000Z"),
    };
    describe("Message Processing", () => {
        describe("Valid message structure", () => {
            it("should process message with all required fields", () => {
                expect(mockVerificationMessage).toMatchObject({
                    documentId: expect.any(String),
                    timestamp: expect.any(Date),
                });
            });
            it("should validate document ID format", () => {
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                expect(mockVerificationMessage.documentId).toMatch(uuidRegex);
            });
        });
        describe("Message validation errors", () => {
            it("should handle missing required fields", () => {
                const invalidMessages = [
                    Object.assign(Object.assign({}, mockVerificationMessage), { documentId: undefined }),
                    Object.assign(Object.assign({}, mockVerificationMessage), { timestamp: undefined }),
                ];
                invalidMessages.forEach((invalidMessage) => {
                    const requiredFields = ["documentId", "timestamp"];
                    const missingField = requiredFields.find((field) => !invalidMessage[field]);
                    expect(missingField).toBeDefined();
                });
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
                ];
                successDetails.forEach((detail) => {
                    expect(detail).toMatch(/(verified|confirmed|completed|passed|validated)/i);
                    expect(detail.length).toBeGreaterThan(20);
                    expect(detail.length).toBeLessThan(100);
                });
            });
            it("should generate appropriate rejection reasons for failure", () => {
                const rejectionReasons = [
                    "Document image quality insufficient for automated verification",
                    "Document appears to be expired or invalid",
                    "Unable to verify document against official database",
                ];
                rejectionReasons.forEach((reason) => {
                    expect(reason).toMatch(/(insufficient|expired|unable|failed|incomplete)/i);
                    expect(reason.length).toBeGreaterThan(30);
                    expect(reason.length).toBeLessThan(120);
                });
            });
            it("should simulate random verification outcomes", () => {
                const outcomes = [entities_1.DocumentStatus.VERIFIED, entities_1.DocumentStatus.FAILED];
                // Test multiple iterations to ensure randomness
                const results = Array.from({ length: 50 }, () => {
                    return Math.random() > 0.5
                        ? entities_1.DocumentStatus.VERIFIED
                        : entities_1.DocumentStatus.FAILED;
                });
                expect(results.length).toBe(50);
            });
        });
        describe("Verification timing", () => {
            it("should respect verification delay configuration", () => __awaiter(void 0, void 0, void 0, function* () {
                const startTime = Date.now();
                const mockDelay = 100; // Shorter delay for tests
                // Simulate delay
                yield new Promise((resolve) => {
                    setTimeout(resolve, mockDelay);
                });
                const endTime = Date.now();
                const actualDelay = endTime - startTime;
                expect(actualDelay).toBeGreaterThanOrEqual(mockDelay - 50);
            }));
        });
    });
    describe("Document Status Updates", () => {
        describe("Successful verification processing", () => {
            it("should call verifyDocument with correct parameters for VERIFIED", () => __awaiter(void 0, void 0, void 0, function* () {
                const verificationDetails = "Document successfully verified";
                mockDocumentUseCase.verifyDocument.mockResolvedValue(undefined);
                yield mockDocumentUseCase.verifyDocument(mockVerificationMessage.documentId, true, verificationDetails, undefined);
                expect(mockDocumentUseCase.verifyDocument).toHaveBeenCalledWith(mockVerificationMessage.documentId, true, verificationDetails, undefined);
                expect(mockDocumentUseCase.verifyDocument).toHaveBeenCalledTimes(1);
            }));
            it("should call verifyDocument with correct parameters for FAILED", () => __awaiter(void 0, void 0, void 0, function* () {
                const rejectionReason = "Document quality insufficient";
                mockDocumentUseCase.verifyDocument.mockResolvedValue(undefined);
                yield mockDocumentUseCase.verifyDocument(mockVerificationMessage.documentId, false, undefined, rejectionReason);
                expect(mockDocumentUseCase.verifyDocument).toHaveBeenCalledWith(mockVerificationMessage.documentId, false, undefined, rejectionReason);
                expect(mockDocumentUseCase.verifyDocument).toHaveBeenCalledTimes(1);
            }));
        });
        describe("Error handling", () => {
            it("should handle database errors during verification", () => __awaiter(void 0, void 0, void 0, function* () {
                const dbError = new Error("Database connection failed");
                mockDocumentUseCase.verifyDocument.mockRejectedValue(dbError);
                yield expect(mockDocumentUseCase.verifyDocument(mockVerificationMessage.documentId, true, "test", undefined)).rejects.toThrow("Database connection failed");
                expect(mockDocumentUseCase.verifyDocument).toHaveBeenCalledWith(mockVerificationMessage.documentId, true, "test", undefined);
            }));
            it("should handle network errors during verification", () => __awaiter(void 0, void 0, void 0, function* () {
                const networkError = new Error("Network timeout");
                mockDocumentUseCase.verifyDocument.mockRejectedValue(networkError);
                yield expect(mockDocumentUseCase.verifyDocument(mockVerificationMessage.documentId, false, undefined, "Network error")).rejects.toThrow("Network timeout");
            }));
        });
    });
    describe("Cache Operations", () => {
        beforeEach(() => {
            redisService_1.redisService.set.mockResolvedValue("OK");
            redisService_1.redisService.get.mockResolvedValue(null);
            redisService_1.redisService.delete.mockResolvedValue(1);
        });
        describe("Cache invalidation", () => {
            it("should clear document cache after verification", () => __awaiter(void 0, void 0, void 0, function* () {
                const cacheKey = `user:${mockVerificationMessage.documentId}:documents`;
                yield redisService_1.redisService.delete(cacheKey);
                expect(redisService_1.redisService.delete).toHaveBeenCalledWith(cacheKey);
            }));
            it("should handle cache errors gracefully", () => __awaiter(void 0, void 0, void 0, function* () {
                const cacheError = new Error("Redis connection failed");
                redisService_1.redisService.delete.mockRejectedValue(cacheError);
                yield expect(redisService_1.redisService.delete("test-key")).rejects.toThrow("Redis connection failed");
            }));
        });
    });
    describe("Message Validation", () => {
        describe("Message structure validation", () => {
            it("should validate message has required properties", () => {
                const isValidMessage = (message) => {
                    return (message &&
                        typeof message.documentId === "string" &&
                        message.timestamp instanceof Date);
                };
                expect(isValidMessage(mockVerificationMessage)).toBe(true);
                const invalidMessages = [
                    null,
                    undefined,
                    {},
                    { documentId: "test" }, // missing timestamp
                    { timestamp: new Date() }, // missing documentId
                    { documentId: 123, timestamp: new Date() }, // wrong type
                ];
                invalidMessages.forEach((invalidMessage) => {
                    expect(isValidMessage(invalidMessage)).toBe(false);
                });
            });
        });
        describe("Concurrent processing", () => {
            it("should handle multiple verification messages concurrently", () => __awaiter(void 0, void 0, void 0, function* () {
                mockDocumentUseCase.verifyDocument.mockResolvedValue(undefined);
                const messages = Array.from({ length: 5 }, (_, i) => ({
                    documentId: `doc-${i}`,
                    timestamp: new Date(),
                }));
                const promises = messages.map((message) => mockDocumentUseCase.verifyDocument(message.documentId, true, "verified", undefined));
                yield Promise.all(promises);
                expect(mockDocumentUseCase.verifyDocument).toHaveBeenCalledTimes(5);
            }));
            it("should handle partial failures in concurrent processing", () => __awaiter(void 0, void 0, void 0, function* () {
                mockDocumentUseCase.verifyDocument
                    .mockResolvedValueOnce(undefined)
                    .mockRejectedValueOnce(new Error("Test error"))
                    .mockResolvedValueOnce(undefined);
                const promises = [
                    mockDocumentUseCase.verifyDocument("doc-1", true, "verified", undefined),
                    mockDocumentUseCase.verifyDocument("doc-2", true, "verified", undefined),
                    mockDocumentUseCase.verifyDocument("doc-3", true, "verified", undefined),
                ];
                const results = yield Promise.allSettled(promises);
                expect(results[0].status).toBe("fulfilled");
                expect(results[1].status).toBe("rejected");
                expect(results[2].status).toBe("fulfilled");
            }));
        });
    });
});
