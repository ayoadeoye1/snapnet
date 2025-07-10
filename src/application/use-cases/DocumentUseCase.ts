import {
  Document,
  DocumentType,
  DocumentStatus,
  User,
} from "../../domain/entities";
import { fileStorageService } from "../../infrastructure/external-services/fileStorageService";
import { queueService } from "../../infrastructure/queue/queueService";
import { redisService } from "../../infrastructure/external-services/redisService";
import { config } from "../../configs/config";

export interface DocumentUploadData {
  userId: string;
  documentType: DocumentType;
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  size: number;
}

export interface DocumentListOptions {
  page?: number;
  limit?: number;
  status?: DocumentStatus;
  documentType?: DocumentType;
}

export class DocumentUseCase {
  async uploadDocument(uploadData: DocumentUploadData): Promise<Document> {
    try {
      const uploadResult = await fileStorageService.uploadFile(
        uploadData.buffer,
        uploadData.originalName,
        uploadData.mimeType,
        uploadData.userId
      );

      const document = await Document.create({
        userId: uploadData.userId,
        documentType: uploadData.documentType,
        documentUrl: uploadResult.secureUrl,
        fileName: uploadData.originalName,
        fileSize: uploadResult.bytes,
        mimeType: uploadData.mimeType,
        cloudinaryPublicId: uploadResult.publicId,
      });

      await queueService.publishDocumentVerification(document.id);

      return document;
    } catch (error) {
      console.error("Upload document error:", error);
      throw error;
    }
  }

  async getUserDocuments(
    userId: string,
    options: DocumentListOptions = {}
  ): Promise<{ documents: Document[]; total: number; totalPages: number }> {
    try {
      const { page = 1, limit = 10, status, documentType } = options;
      const offset = (page - 1) * limit;

      const whereClause: any = { userId };
      if (status) whereClause.status = status;
      if (documentType) whereClause.documentType = documentType;

      const { count, rows } = await Document.findAndCountAll({
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
    } catch (error) {
      console.error("Get user documents error:", error);
      throw error;
    }
  }

  async getDocumentById(
    documentId: string,
    userId?: string
  ): Promise<Document | null> {
    try {
      const cacheKey = `document:${documentId}`;
      const cachedDocument = await redisService.get(cacheKey);

      if (cachedDocument) {
        const document = JSON.parse(cachedDocument);
        if (!userId || document.userId === userId) {
          return document;
        }
      }

      const whereClause: any = { id: documentId };
      if (userId) whereClause.userId = userId;

      const document = await Document.findOne({
        where: whereClause,
        include: [{ model: User, as: "user" }],
      });

      if (document) {
        await redisService.set(
          cacheKey,
          JSON.stringify(document),
          config.documentCacheTTL
        );
      }

      return document;
    } catch (error) {
      console.error("Get document by ID error:", error);
      throw error;
    }
  }

  async getAllDocuments(
    options: DocumentListOptions = {}
  ): Promise<{ documents: Document[]; total: number; totalPages: number }> {
    try {
      const { page = 1, limit = 10, status, documentType } = options;
      const offset = (page - 1) * limit;

      const whereClause: any = {};
      if (status) whereClause.status = status;
      if (documentType) whereClause.documentType = documentType;

      const { count, rows } = await Document.findAndCountAll({
        where: whereClause,
        include: [{ model: User, as: "user" }],
        limit,
        offset,
        order: [["createdAt", "DESC"]],
      });

      return {
        documents: rows,
        total: count,
        totalPages: Math.ceil(count / limit),
      };
    } catch (error) {
      console.error("Get all documents error:", error);
      throw error;
    }
  }

  async getDocumentStats(): Promise<{
    total: number;
    pending: number;
    verified: number;
    failed: number;
  }> {
    try {
      const [total, pending, verified, failed] = await Promise.all([
        Document.count(),
        Document.count({ where: { status: DocumentStatus.PENDING } }),
        Document.count({ where: { status: DocumentStatus.VERIFIED } }),
        Document.count({ where: { status: DocumentStatus.FAILED } }),
      ]);

      return { total, pending, verified, failed };
    } catch (error) {
      console.error("Get document stats error:", error);
      throw error;
    }
  }

  async verifyDocument(
    documentId: string,
    isVerified: boolean,
    details?: string,
    rejectionReason?: string
  ): Promise<Document> {
    try {
      const document = await Document.findByPk(documentId);
      if (!document) {
        throw new Error("Document not found");
      }

      const updateData: any = {
        status: isVerified ? DocumentStatus.VERIFIED : DocumentStatus.FAILED,
        verificationDetails: details,
        rejectionReason: !isVerified ? rejectionReason : null,
        verifiedAt: isVerified ? new Date() : null,
      };

      await document.update(updateData);

      const cacheKey = `document:${documentId}`;
      await redisService.delete(cacheKey);

      return document;
    } catch (error) {
      console.error("Verify document error:", error);
      throw error;
    }
  }
}
