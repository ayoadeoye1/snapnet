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
exports.fileStorageService = void 0;
const cloudinary_1 = require("cloudinary");
const config_1 = require("../../configs/config");
class FileStorageService {
    constructor() {
        this.initialized = false;
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.initialized)
                return;
            // Configure Cloudinary
            cloudinary_1.v2.config({
                cloud_name: config_1.config.cloudinary.cloudName,
                api_key: config_1.config.cloudinary.apiKey,
                api_secret: config_1.config.cloudinary.apiSecret,
            });
            this.initialized = true;
            console.log("Cloudinary configured successfully");
        });
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.initialize();
        });
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            // Cloudinary doesn't require explicit disconnection
            console.log("Cloudinary service disconnected");
        });
    }
    uploadFile(fileBuffer, fileName, mimeType, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.initialize();
            try {
                // Create a unique public ID for the file
                const timestamp = Date.now();
                const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
                const publicId = `${config_1.config.cloudinary.folder}/${userId}/${timestamp}_${sanitizedFileName}`;
                // Determine resource type based on MIME type
                const resourceType = mimeType.startsWith("image/") ? "image" : "raw";
                // Upload to Cloudinary
                const uploadResult = yield new Promise((resolve, reject) => {
                    cloudinary_1.v2.uploader
                        .upload_stream({
                        public_id: publicId,
                        resource_type: resourceType,
                        folder: config_1.config.cloudinary.folder,
                        use_filename: true,
                        unique_filename: false,
                        overwrite: false,
                    }, (error, result) => {
                        if (error) {
                            reject(error);
                        }
                        else {
                            resolve(result);
                        }
                    })
                        .end(fileBuffer);
                });
                console.log(`File uploaded to Cloudinary: ${uploadResult.public_id}`);
                return {
                    url: uploadResult.url,
                    publicId: uploadResult.public_id,
                    secureUrl: uploadResult.secure_url,
                    format: uploadResult.format,
                    resourceType: uploadResult.resource_type,
                    bytes: uploadResult.bytes,
                };
            }
            catch (error) {
                console.error("Failed to upload file to Cloudinary:", error);
                throw new Error(`File upload failed: ${error}`);
            }
        });
    }
    getFileUrl(publicId, options) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.initialize();
            try {
                const optimizedUrl = cloudinary_1.v2.url(publicId, Object.assign({ fetch_format: "auto", quality: "auto", secure: true }, options));
                return optimizedUrl;
            }
            catch (error) {
                console.error("Failed to generate file URL:", error);
                throw new Error(`URL generation failed: ${error}`);
            }
        });
    }
    getOptimizedImageUrl(publicId_1, width_1, height_1) {
        return __awaiter(this, arguments, void 0, function* (publicId, width, height, crop = "auto") {
            yield this.initialize();
            try {
                const transformedUrl = cloudinary_1.v2.url(publicId, {
                    crop,
                    gravity: "auto",
                    width,
                    height,
                    fetch_format: "auto",
                    quality: "auto",
                    secure: true,
                });
                return transformedUrl;
            }
            catch (error) {
                console.error("Failed to generate optimized image URL:", error);
                throw new Error(`Optimized URL generation failed: ${error}`);
            }
        });
    }
    getThumbnailUrl(publicId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getOptimizedImageUrl(publicId, 200, 200, "fill");
        });
    }
    isHealthy() {
        return this.initialized;
    }
    getStorageInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.initialize();
            try {
                const usage = yield cloudinary_1.v2.api.usage();
                return {
                    service: "cloudinary",
                    cloudName: config_1.config.cloudinary.cloudName,
                    usage: {
                        credits: usage.credits,
                        usedCredits: usage.credits_usage,
                        objects: usage.objects,
                        bandwidth: usage.bandwidth,
                        storage: usage.storage,
                    },
                };
            }
            catch (error) {
                console.error("Failed to get storage info:", error);
                return {
                    service: "cloudinary",
                    cloudName: config_1.config.cloudinary.cloudName,
                    error: "Unable to fetch usage information",
                };
            }
        });
    }
}
exports.fileStorageService = new FileStorageService();
