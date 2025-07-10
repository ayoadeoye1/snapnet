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
exports.DocumentController = void 0;
const documentValidators_1 = require("../validators/documentValidators");
class DocumentController {
    constructor(documentUseCase) {
        this.documentUseCase = documentUseCase;
    }
    uploadDocument(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { error, value } = documentValidators_1.uploadDocumentSchema.validate(req.body);
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
                const document = yield this.documentUseCase.uploadDocument({
                    userId: req.userId,
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
            }
            catch (error) {
                console.error("Upload document controller error:", error);
                res.status(500).json({
                    success: false,
                    message: "Internal server error",
                });
            }
        });
    }
    getUserDocuments(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { error, value } = documentValidators_1.getDocumentsQuerySchema.validate(req.query);
                if (error) {
                    res.status(400).json({
                        success: false,
                        message: "Validation error",
                        errors: error.details.map((detail) => detail.message),
                    });
                    return;
                }
                const result = yield this.documentUseCase.getUserDocuments(req.userId, value);
                res.status(200).json({
                    success: true,
                    data: result,
                });
            }
            catch (error) {
                console.error("Get user documents controller error:", error);
                res.status(500).json({
                    success: false,
                    message: "Internal server error",
                });
            }
        });
    }
}
exports.DocumentController = DocumentController;
