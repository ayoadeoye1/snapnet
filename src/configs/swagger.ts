import swaggerJsdoc from "swagger-jsdoc";
import { config } from "./config";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Document Verification API",
      version: "1.0.0",
      description: `Snapnet Test - Document Verification API.`,
    },
    servers: [
      {
        url: `http://localhost:${config.port}/api/v1`,
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT token",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "User unique identifier",
            },
            email: {
              type: "string",
              format: "email",
              description: "User email address",
            },
            firstName: {
              type: "string",
              description: "User first name",
              nullable: true,
            },
            lastName: {
              type: "string",
              description: "User last name",
              nullable: true,
            },
            role: {
              type: "string",
              enum: ["user", "admin"],
              description: "User role",
            },
            isActive: {
              type: "boolean",
              description: "Whether the user account is active",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Account creation timestamp",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Last update timestamp",
            },
          },
        },
        Document: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "Document unique identifier",
            },
            userId: {
              type: "string",
              format: "uuid",
              description: "Owner user ID",
            },
            documentType: {
              type: "string",
              enum: [
                "passport",
                "drivers_license",
                "national_id",
                "utility_bill",
                "bank_statement",
                "other",
              ],
              description: "Type of document",
            },
            documentUrl: {
              type: "string",
              format: "uri",
              description: "URL to access the document file",
            },
            fileName: {
              type: "string",
              description: "Original file name",
            },
            fileSize: {
              type: "integer",
              description: "File size in bytes",
            },
            mimeType: {
              type: "string",
              description: "File MIME type",
            },
            cloudinaryPublicId: {
              type: "string",
              description: "Cloudinary public ID for file management",
              nullable: true,
            },
            status: {
              type: "string",
              enum: ["PENDING", "VERIFIED", "FAILED"],
              description: "Document verification status",
            },
            verificationDetails: {
              type: "string",
              description: "Details about the verification process",
              nullable: true,
            },
            rejectionReason: {
              type: "string",
              description: "Reason for rejection if status is FAILED",
              nullable: true,
            },
            verifiedAt: {
              type: "string",
              format: "date-time",
              description: "Timestamp when document was verified",
              nullable: true,
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Document upload timestamp",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Last update timestamp",
            },
            user: {
              $ref: "#/components/schemas/User",
              description:
                "Document owner information (included in some responses)",
            },
          },
        },
        Error: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            message: {
              type: "string",
              description: "Error message",
            },
            errors: {
              type: "array",
              items: {
                type: "string",
              },
              description: "Detailed error messages (for validation errors)",
            },
          },
        },
        SuccessResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              description: "Success message",
            },
            data: {
              type: "object",
              description: "Response data",
            },
          },
        },
        PaginatedResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            data: {
              type: "object",
              properties: {
                total: {
                  type: "integer",
                  description: "Total number of items",
                },
                totalPages: {
                  type: "integer",
                  description: "Total number of pages",
                },
                currentPage: {
                  type: "integer",
                  description: "Current page number",
                },
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: "Authentication",
        description: "User authentication and authorization endpoints",
      },
      {
        name: "Documents",
        description: "Document upload and management endpoints",
      },
      {
        name: "Admin",
        description: "Administrative endpoints (admin access required)",
      },
    ],
  },
  apis: [
    "./src/presentation/controllers/*.ts",
    "./src/presentation/routes/*.ts",
    "./src/controllers/*.ts",
    "./src/routes/*.ts",
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
