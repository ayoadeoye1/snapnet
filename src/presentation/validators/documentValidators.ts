import Joi from "joi";
import { DocumentType, DocumentStatus } from "../../domain/entities";

export const uploadDocumentSchema = Joi.object({
  documentType: Joi.string()
    .valid(...Object.values(DocumentType))
    .required()
    .messages({
      "any.only": "Invalid document type",
      "any.required": "Document type is required",
    }),
});

export const getDocumentsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1).messages({
    "number.base": "Page must be a number",
    "number.integer": "Page must be an integer",
    "number.min": "Page must be at least 1",
  }),
  limit: Joi.number()
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
  status: Joi.string()
    .valid(...Object.values(DocumentStatus))
    .optional()
    .messages({
      "any.only": "Invalid document status",
    }),
  documentType: Joi.string()
    .valid(...Object.values(DocumentType))
    .optional()
    .messages({
      "any.only": "Invalid document type",
    }),
});

export const documentIdSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    "string.guid": "Document ID must be a valid UUID",
    "any.required": "Document ID is required",
  }),
});

export const verifyDocumentSchema = Joi.object({
  isVerified: Joi.boolean().required().messages({
    "any.required": "Verification status is required",
  }),
  verificationDetails: Joi.string().optional().allow("").messages({
    "string.base": "Verification details must be a string",
  }),
  rejectionReason: Joi.string()
    .when("isVerified", {
      is: false,
      then: Joi.required(),
      otherwise: Joi.optional(),
    })
    .messages({
      "any.required":
        "Rejection reason is required when document is not verified",
      "string.base": "Rejection reason must be a string",
    }),
});
