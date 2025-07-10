"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUploadedFile = exports.handleUploadError = exports.uploadSingle = void 0;
const multer_1 = __importDefault(require("multer"));
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const storage = multer_1.default.memoryStorage();
const fileFilter = (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error("Invalid file type. Only images and PDF documents are allowed."));
    }
};
const upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZE,
    },
});
exports.uploadSingle = upload.single("document");
const handleUploadError = (error, req, res, next) => {
    if (error instanceof multer_1.default.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
            res.status(400).json({
                success: false,
                message: "File too large. Maximum size is 10MB.",
            });
            return;
        }
        if (error.code === "LIMIT_UNEXPECTED_FILE") {
            res.status(400).json({
                success: false,
                message: "Unexpected file field. Use 'document' as the field name.",
            });
            return;
        }
    }
    if (error.message.includes("Invalid file type")) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
        return;
    }
    res.status(500).json({
        success: false,
        message: "File upload error",
    });
};
exports.handleUploadError = handleUploadError;
const validateUploadedFile = (req, res, next) => {
    if (!req.file) {
        res.status(400).json({
            success: false,
            message: "No file uploaded",
        });
        return;
    }
    if (!req.file.buffer || req.file.size === 0) {
        res.status(400).json({
            success: false,
            message: "Empty file uploaded",
        });
        return;
    }
    next();
};
exports.validateUploadedFile = validateUploadedFile;
