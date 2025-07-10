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
exports.DocumentUseCase = void 0;
const entities_1 = require("../../domain/entities");
const fileStorageService_1 = require("../../infrastructure/external-services/fileStorageService");
const queueService_1 = require("../../infrastructure/queue/queueService");
const redisService_1 = require("../../infrastructure/external-services/redisService");
const config_1 = require("../../configs/config");
class DocumentUseCase {
    uploadDocument(uploadData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const uploadResult = yield fileStorageService_1.fileStorageService.uploadFile(uploadData.buffer, uploadData.originalName, uploadData.mimeType, uploadData.userId);
                const document = yield entities_1.Document.create({
                    userId: uploadData.userId,
                    documentType: uploadData.documentType,
                    documentUrl: uploadResult.secureUrl,
                    fileName: uploadData.originalName,
                    fileSize: uploadResult.bytes,
                    mimeType: uploadData.mimeType,
                    cloudinaryPublicId: uploadResult.publicId,
                });
                yield queueService_1.queueService.publishDocumentVerification(document.id);
                return document;
            }
            catch (error) {
                console.error("Upload document error:", error);
                throw error;
            }
        });
    }
    getUserDocuments(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, options = {}) {
            try {
                const { page = 1, limit = 10, status, documentType } = options;
                const offset = (page - 1) * limit;
                const whereClause = { userId };
                if (status)
                    whereClause.status = status;
                if (documentType)
                    whereClause.documentType = documentType;
                const { count, rows } = yield entities_1.Document.findAndCountAll({
                    where: whereClause,
                    limit,
                    offset,
                    order: [["createdAt", "DESC"]],
                });
                return {
                    documents: rows,
                    total: count,
                    totalPages: Math.ceil(count / limit),
                };
            }
            catch (error) {
                console.error("Get user documents error:", error);
                throw error;
            }
        });
    }
    getDocumentById(documentId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const cacheKey = `document:${documentId}`;
                const cachedDocument = yield redisService_1.redisService.get(cacheKey);
                if (cachedDocument) {
                    const document = JSON.parse(cachedDocument);
                    if (!userId || document.userId === userId) {
                        return document;
                    }
                }
                const whereClause = { id: documentId };
                if (userId)
                    whereClause.userId = userId;
                const document = yield entities_1.Document.findOne({
                    where: whereClause,
                    include: [{ model: entities_1.User, as: "user" }],
                });
                if (document) {
                    yield redisService_1.redisService.set(cacheKey, JSON.stringify(document), config_1.config.documentCacheTTL);
                }
                return document;
            }
            catch (error) {
                console.error("Get document by ID error:", error);
                throw error;
            }
        });
    }
    getAllDocuments() {
        return __awaiter(this, arguments, void 0, function* (options = {}) {
            try {
                const { page = 1, limit = 10, status, documentType } = options;
                const offset = (page - 1) * limit;
                const whereClause = {};
                if (status)
                    whereClause.status = status;
                if (documentType)
                    whereClause.documentType = documentType;
                const { count, rows } = yield entities_1.Document.findAndCountAll({
                    where: whereClause,
                    include: [{ model: entities_1.User, as: "user" }],
                    limit,
                    offset,
                    order: [["createdAt", "DESC"]],
                });
                return {
                    documents: rows,
                    total: count,
                    totalPages: Math.ceil(count / limit),
                };
            }
            catch (error) {
                console.error("Get all documents error:", error);
                throw error;
            }
        });
    }
    getDocumentStats() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const [total, pending, verified, failed] = yield Promise.all([
                    entities_1.Document.count(),
                    entities_1.Document.count({ where: { status: entities_1.DocumentStatus.PENDING } }),
                    entities_1.Document.count({ where: { status: entities_1.DocumentStatus.VERIFIED } }),
                    entities_1.Document.count({ where: { status: entities_1.DocumentStatus.FAILED } }),
                ]);
                return { total, pending, verified, failed };
            }
            catch (error) {
                console.error("Get document stats error:", error);
                throw error;
            }
        });
    }
    verifyDocument(documentId, isVerified, details, rejectionReason) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const document = yield entities_1.Document.findByPk(documentId);
                if (!document) {
                    throw new Error("Document not found");
                }
                const updateData = {
                    status: isVerified ? entities_1.DocumentStatus.VERIFIED : entities_1.DocumentStatus.FAILED,
                    verificationDetails: details,
                    rejectionReason: !isVerified ? rejectionReason : null,
                    verifiedAt: isVerified ? new Date() : null,
                };
                yield document.update(updateData);
                const cacheKey = `document:${documentId}`;
                yield redisService_1.redisService.delete(cacheKey);
                return document;
            }
            catch (error) {
                console.error("Verify document error:", error);
                throw error;
            }
        });
    }
}
exports.DocumentUseCase = DocumentUseCase;
