import { DocumentUseCase } from "../application/use-cases/DocumentUseCase";
import {
  queueService,
  DocumentVerificationMessage,
} from "../infrastructure/queue/queueService";
import { config } from "../configs/config";

class DocumentWorker {
  private documentUseCase: DocumentUseCase;

  constructor() {
    this.documentUseCase = new DocumentUseCase();
  }

  async start(): Promise<void> {
    try {
      await queueService.connect();

      await queueService.consumeDocumentVerification(
        this.processDocumentVerification.bind(this)
      );

      console.log("Document worker started successfully");
    } catch (error) {
      console.error("Failed to start document worker:", error);
      throw error;
    }
  }

  private async processDocumentVerification(
    message: DocumentVerificationMessage
  ): Promise<void> {
    try {
      console.log(`Processing document verification: ${message.documentId}`);

      await new Promise((resolve) =>
        setTimeout(resolve, config.documentVerificationDelay)
      );

      const isVerified = Math.random() > 0.3;
      const verificationDetails = isVerified
        ? "Document verified successfully"
        : undefined;
      const rejectionReason = !isVerified
        ? "Document quality is insufficient for verification"
        : undefined;

      await this.documentUseCase.verifyDocument(
        message.documentId,
        isVerified,
        verificationDetails,
        rejectionReason
      );

      console.log(
        `Document ${message.documentId} verification completed: ${
          isVerified ? "VERIFIED" : "FAILED"
        }`
      );
    } catch (error) {
      console.error("Error processing document verification:", error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      await queueService.disconnect();
      console.log("Document worker stopped");
    } catch (error) {
      console.error("Error stopping document worker:", error);
    }
  }
}

export const documentWorker = new DocumentWorker();
