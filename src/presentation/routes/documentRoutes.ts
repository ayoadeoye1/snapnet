import { Router } from "express";
import { DocumentController } from "../controllers/documentController";
import { DocumentUseCase } from "../../application/use-cases/DocumentUseCase";
import { authenticateToken, requireUserOnly } from "../middleware/auth";
import {
  uploadSingle,
  handleUploadError,
  validateUploadedFile,
} from "../middleware/upload";

const documentUseCase = new DocumentUseCase();
const documentController = new DocumentController(documentUseCase);

const router = Router();

router.use(authenticateToken);
router.use(requireUserOnly);

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
router.post(
  "/",
  uploadSingle,
  handleUploadError,
  validateUploadedFile,
  documentController.uploadDocument.bind(documentController)
);

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

/**
 * @swagger
 * /documents/{id}:
 *   delete:
 *     tags: [Documents]
 *     summary: Delete document
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Document ID
 *     responses:
 *       200:
 *         description: Document deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: Document not found
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
router.delete(
  "/:id",
  documentController.deleteDocument.bind(documentController)
);

export default router;
