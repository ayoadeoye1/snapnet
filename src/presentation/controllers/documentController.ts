import { Response } from "express";
import { DocumentUseCase } from "../../application/use-cases/DocumentUseCase";
import {
  uploadDocumentSchema,
  getDocumentsQuerySchema,
  documentIdSchema,
} from "../validators/documentValidators";
import { AuthenticatedRequest } from "../middleware/auth";

export class DocumentController {
  constructor(private documentUseCase: DocumentUseCase) {}

  async uploadDocument(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { error, value } = uploadDocumentSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.details.map((detail) => detail.message),
        });
        return;
      }

      if (!req.file) {
        res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
        return;
      }

      const document = await this.documentUseCase.uploadDocument({
        userId: req.userId!,
        documentType: value.documentType,
        buffer: req.file.buffer,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
      });

      res.status(201).json({
        success: true,
        message: "Document uploaded successfully and queued for verification",
        data: document,
      });
    } catch (error: any) {
      console.error("Upload document controller error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async getUserDocuments(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { error, value } = getDocumentsQuerySchema.validate(req.query);
      if (error) {
        res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.details.map((detail) => detail.message),
        });
        return;
      }

      const result = await this.documentUseCase.getUserDocuments(
        req.userId!,
        value
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("Get user documents controller error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async deleteDocument(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { error, value } = documentIdSchema.validate(req.params);
      if (error) {
        res.status(400).json({
          success: false,
          message: "Invalid document ID",
        });
        return;
      }

      await this.documentUseCase.deleteDocument(value.id, req.userId!);

      res.status(200).json({
        success: true,
        message: "Document deleted successfully",
      });
    } catch (error: any) {
      console.error("Delete document controller error:", error);

      if (error.message === "Document not found") {
        res.status(404).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    }
  }
}
