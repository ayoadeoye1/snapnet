import { Response } from "express";
import { DocumentUseCase } from "../../application/use-cases/DocumentUseCase";
import { AuthUseCase } from "../../application/use-cases/AuthUseCase";
import {
  getDocumentsQuerySchema,
  documentIdSchema,
} from "../validators/documentValidators";
import { getUsersQuerySchema } from "../validators/authValidators";
import { AuthenticatedRequest } from "../middleware/auth";

export class AdminController {
  constructor(
    private documentUseCase: DocumentUseCase,
    private authUseCase: AuthUseCase
  ) {}

  async getAllDocuments(
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

      const result = await this.documentUseCase.getAllDocuments(value);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("Get all documents controller error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async getDocumentById(
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

      const document = await this.documentUseCase.getDocumentById(value.id);

      if (!document) {
        res.status(404).json({
          success: false,
          message: "Document not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: document,
      });
    } catch (error: any) {
      console.error("Admin get document by ID controller error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async getDocumentStats(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const stats = await this.documentUseCase.getDocumentStats();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error("Get document stats controller error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async getAllUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { error, value } = getUsersQuerySchema.validate(req.query);
      if (error) {
        res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.details.map((detail) => detail.message),
        });
        return;
      }

      const result = await this.authUseCase.getAllUsers(
        value.page,
        value.limit,
        value.role
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("Get all users controller error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
}
