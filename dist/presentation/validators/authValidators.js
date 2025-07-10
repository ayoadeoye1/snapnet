"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsersQuerySchema = exports.updatePasswordSchema = exports.updateProfileSchema = exports.loginSchema = exports.signupSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const entities_1 = require("../../domain/entities");
exports.signupSchema = joi_1.default.object({
    email: joi_1.default.string().email().required().messages({
        "string.email": "Please provide a valid email address",
        "any.required": "Email is required",
    }),
    password: joi_1.default.string().min(6).required().messages({
        "string.min": "Password must be at least 6 characters long",
        "any.required": "Password is required",
    }),
    firstName: joi_1.default.string().optional().allow("").messages({
        "string.base": "First name must be a string",
    }),
    lastName: joi_1.default.string().optional().allow("").messages({
        "string.base": "Last name must be a string",
    }),
    role: joi_1.default.string()
        .valid(...Object.values(entities_1.UserRole))
        .optional()
        .messages({
        "any.only": "Role must be either 'user' or 'admin'",
    }),
});
exports.loginSchema = joi_1.default.object({
    email: joi_1.default.string().email().required().messages({
        "string.email": "Please provide a valid email address",
        "any.required": "Email is required",
    }),
    password: joi_1.default.string().required().messages({
        "any.required": "Password is required",
    }),
});
exports.updateProfileSchema = joi_1.default.object({
    firstName: joi_1.default.string().optional().allow("").messages({
        "string.base": "First name must be a string",
    }),
    lastName: joi_1.default.string().optional().allow("").messages({
        "string.base": "Last name must be a string",
    }),
})
    .min(1)
    .messages({
    "object.min": "At least one field must be provided for update",
});
exports.updatePasswordSchema = joi_1.default.object({
    currentPassword: joi_1.default.string().required().messages({
        "any.required": "Current password is required",
    }),
    newPassword: joi_1.default.string().min(6).required().messages({
        "string.min": "New password must be at least 6 characters long",
        "any.required": "New password is required",
    }),
});
exports.getUsersQuerySchema = joi_1.default.object({
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
    role: joi_1.default.string()
        .valid(...Object.values(entities_1.UserRole))
        .optional()
        .messages({
        "any.only": "Role must be either 'user' or 'admin'",
    }),
});
