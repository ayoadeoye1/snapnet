"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyDocumentSchema = exports.documentIdSchema = exports.getDocumentsQuerySchema = exports.uploadDocumentSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const entities_1 = require("../../domain/entities");
exports.uploadDocumentSchema = joi_1.default.object({
    documentType: joi_1.default.string()
        .valid(...Object.values(entities_1.DocumentType))
        .required()
        .messages({
        "any.only": "Invalid document type",
        "any.required": "Document type is required",
    }),
});
exports.getDocumentsQuerySchema = joi_1.default.object({
    page: joi_1.default.number().integer().min(1).optional().default(1).messages({
        "number.base": "Page must be a number",
        "number.integer": "Page must be an integer",
        "number.min": "Page must be at least 1",
    }),
    limit: joi_1.default.number()
        .integer()
        .min(1)
        .max(100)
        .optional()
        .default(10)
        .messages({
        "number.base": "Limit must be a number",
        "number.integer": "Limit must be an integer",
        "number.min": "Limit must be at least 1",
        "number.max": "Limit cannot exceed 100",
    }),
    status: joi_1.default.string()
        .valid(...Object.values(entities_1.DocumentStatus))
        .optional()
        .messages({
        "any.only": "Invalid document status",
    }),
    documentType: joi_1.default.string()
        .valid(...Object.values(entities_1.DocumentType))
        .optional()
        .messages({
        "any.only": "Invalid document type",
    }),
});
exports.documentIdSchema = joi_1.default.object({
    id: joi_1.default.string().uuid().required().messages({
        "string.guid": "Document ID must be a valid UUID",
        "any.required": "Document ID is required",
    }),
});
exports.verifyDocumentSchema = joi_1.default.object({
    isVerified: joi_1.default.boolean().required().messages({
        "any.required": "Verification status is required",
    }),
    verificationDetails: joi_1.default.string().optional().allow("").messages({
        "string.base": "Verification details must be a string",
    }),
    rejectionReason: joi_1.default.string()
        .when("isVerified", {
        is: false,
        then: joi_1.default.required(),
        otherwise: joi_1.default.optional(),
    })
        .messages({
        "any.required": "Rejection reason is required when document is not verified",
        "string.base": "Rejection reason must be a string",
    }),
});
