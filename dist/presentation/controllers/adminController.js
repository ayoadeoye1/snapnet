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
exports.AdminController = void 0;
const documentValidators_1 = require("../validators/documentValidators");
const authValidators_1 = require("../validators/authValidators");
class AdminController {
    constructor(documentUseCase, authUseCase) {
        this.documentUseCase = documentUseCase;
        this.authUseCase = authUseCase;
    }
    getAllDocuments(req, res) {
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
                const result = yield this.documentUseCase.getAllDocuments(value);
                res.status(200).json({
                    success: true,
                    data: result,
                });
            }
            catch (error) {
                console.error("Get all documents controller error:", error);
                res.status(500).json({
                    success: false,
                    message: "Internal server error",
                });
            }
        });
    }
    getDocumentById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { error, value } = documentValidators_1.documentIdSchema.validate(req.params);
                if (error) {
                    res.status(400).json({
                        success: false,
                        message: "Invalid document ID",
                    });
                    return;
                }
                const document = yield this.documentUseCase.getDocumentById(value.id);
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
            }
            catch (error) {
                console.error("Admin get document by ID controller error:", error);
                res.status(500).json({
                    success: false,
                    message: "Internal server error",
                });
            }
        });
    }
    getDocumentStats(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const stats = yield this.documentUseCase.getDocumentStats();
                res.status(200).json({
                    success: true,
                    data: stats,
                });
            }
            catch (error) {
                console.error("Get document stats controller error:", error);
                res.status(500).json({
                    success: false,
                    message: "Internal server error",
                });
            }
        });
    }
    getAllUsers(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { error, value } = authValidators_1.getUsersQuerySchema.validate(req.query);
                if (error) {
                    res.status(400).json({
                        success: false,
                        message: "Validation error",
                        errors: error.details.map((detail) => detail.message),
                    });
                    return;
                }
                const result = yield this.authUseCase.getAllUsers(value.page, value.limit, value.role);
                res.status(200).json({
                    success: true,
                    data: result,
                });
            }
            catch (error) {
                console.error("Get all users controller error:", error);
                res.status(500).json({
                    success: false,
                    message: "Internal server error",
                });
            }
        });
    }
}
exports.AdminController = AdminController;
