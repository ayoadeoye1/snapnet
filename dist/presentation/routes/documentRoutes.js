"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const documentController_1 = require("../controllers/documentController");
const DocumentUseCase_1 = require("../../application/use-cases/DocumentUseCase");
const auth_1 = require("../middleware/auth");
const upload_1 = require("../middleware/upload");
const documentUseCase = new DocumentUseCase_1.DocumentUseCase();
const documentController = new documentController_1.DocumentController(documentUseCase);
const router = (0, express_1.Router)();
router.use(auth_1.authenticateToken);
router.use(auth_1.requireUserOnly);
/**
 * @swagger
 * /documents:
 *   post:
 *     tags: [Documents]
 *     summary: Upload a new document
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - document
 *               - documentType
 *             properties:
 *               document:
 *                 type: string
 *                 format: binary
 *                 description: Document file to upload
 *               documentType:
 *                 type: string
 *                 enum: [passport, drivers_license, national_id, utility_bill, bank_statement, other]
 *                 description: Type of document being uploaded
 *     responses:
 *       201:
 *         description: Document uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Document'
 *       400:
 *         description: Invalid file or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/", upload_1.uploadSingle, upload_1.handleUploadError, upload_1.validateUploadedFile, documentController.uploadDocument.bind(documentController));
/**
 * @swagger
 * /documents:
 *   get:
 *     tags: [Documents]
 *     summary: Get user's documents
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, VERIFIED, FAILED]
 *         description: Filter by document status
 *       - in: query
 *         name: documentType
 *         schema:
 *           type: string
 *           enum: [passport, drivers_license, national_id, utility_bill, bank_statement, other]
 *         description: Filter by document type
 *     responses:
 *       200:
 *         description: Documents retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         documents:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Document'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/", documentController.getUserDocuments.bind(documentController));
exports.default = router;
