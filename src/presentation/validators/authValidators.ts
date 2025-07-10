import Joi from "joi";
import { UserRole } from "../../domain/entities";

export const signupSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
  }),
  password: Joi.string().min(6).required().messages({
    "string.min": "Password must be at least 6 characters long",
    "any.required": "Password is required",
  }),
  firstName: Joi.string().optional().allow("").messages({
    "string.base": "First name must be a string",
  }),
  lastName: Joi.string().optional().allow("").messages({
    "string.base": "Last name must be a string",
  }),
  role: Joi.string()
    .valid(...Object.values(UserRole))
    .optional()
    .messages({
      "any.only": "Role must be either 'user' or 'admin'",
    }),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
  }),
  password: Joi.string().required().messages({
    "any.required": "Password is required",
  }),
});

export const updateProfileSchema = Joi.object({
  firstName: Joi.string().optional().allow("").messages({
    "string.base": "First name must be a string",
  }),
  lastName: Joi.string().optional().allow("").messages({
    "string.base": "Last name must be a string",
  }),
})
  .min(1)
  .messages({
    "object.min": "At least one field must be provided for update",
  });

export const updatePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    "any.required": "Current password is required",
  }),
  newPassword: Joi.string().min(6).required().messages({
    "string.min": "New password must be at least 6 characters long",
    "any.required": "New password is required",
  }),
});

export const getUsersQuerySchema = Joi.object({
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
  role: Joi.string()
    .valid(...Object.values(UserRole))
    .optional()
    .messages({
      "any.only": "Role must be either 'user' or 'admin'",
    }),
});
