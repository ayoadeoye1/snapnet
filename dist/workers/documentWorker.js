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
exports.documentWorker = void 0;
const DocumentUseCase_1 = require("../application/use-cases/DocumentUseCase");
const queueService_1 = require("../infrastructure/queue/queueService");
const config_1 = require("../configs/config");
class DocumentWorker {
    constructor() {
        this.documentUseCase = new DocumentUseCase_1.DocumentUseCase();
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield queueService_1.queueService.connect();
                yield queueService_1.queueService.consumeDocumentVerification(this.processDocumentVerification.bind(this));
                console.log("Document worker started successfully");
            }
            catch (error) {
                console.error("Failed to start document worker:", error);
                throw error;
            }
        });
    }
    processDocumentVerification(message) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log(`Processing document verification: ${message.documentId}`);
                yield new Promise((resolve) => setTimeout(resolve, config_1.config.documentVerificationDelay));
                const isVerified = Math.random() > 0.3;
                const verificationDetails = isVerified
                    ? "Document verified successfully"
                    : undefined;
                const rejectionReason = !isVerified
                    ? "Document quality is insufficient for verification"
                    : undefined;
                yield this.documentUseCase.verifyDocument(message.documentId, isVerified, verificationDetails, rejectionReason);
                console.log(`Document ${message.documentId} verification completed: ${isVerified ? "VERIFIED" : "FAILED"}`);
            }
            catch (error) {
                console.error("Error processing document verification:", error);
                throw error;
            }
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield queueService_1.queueService.disconnect();
                console.log("Document worker stopped");
            }
            catch (error) {
                console.error("Error stopping document worker:", error);
            }
        });
    }
}
exports.documentWorker = new DocumentWorker();
