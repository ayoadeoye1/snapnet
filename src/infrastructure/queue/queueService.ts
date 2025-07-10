import amqp from "amqplib";
import { config } from "../../configs/config";

export interface DocumentVerificationMessage {
  documentId: string;
  timestamp: Date;
}

class QueueService {
  private connection: any;
  private channel: any;
  private readonly DOCUMENT_VERIFICATION_QUEUE = "document_verification";

  async connect(): Promise<void> {
    try {
      this.connection = await amqp.connect(config.rabbitmq.url);

      this.connection.on("error", (error: any) => {
        console.error("RabbitMQ connection error:", error);
      });

      this.connection.on("close", () => {
        console.log("RabbitMQ connection closed");
      });

      this.channel = await this.connection.createChannel();

      await this.channel.assertQueue(this.DOCUMENT_VERIFICATION_QUEUE, {
        durable: true,
      });

      console.log("Connected to RabbitMQ");
    } catch (error) {
      console.error("Failed to connect to RabbitMQ:", error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }

      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }

      console.log("Disconnected from RabbitMQ");
    } catch (error) {
      console.error("Error disconnecting from RabbitMQ:", error);
    }
  }

  async publishDocumentVerification(documentId: string): Promise<void> {
    if (!this.channel) {
      throw new Error("RabbitMQ channel not available");
    }

    try {
      const message: DocumentVerificationMessage = {
        documentId,
        timestamp: new Date(),
      };

      const messageBuffer = Buffer.from(JSON.stringify(message));

      const sent = this.channel.sendToQueue(
        this.DOCUMENT_VERIFICATION_QUEUE,
        messageBuffer,
        {
          persistent: true,
        }
      );

      if (!sent) {
        throw new Error("Failed to send message to queue");
      }

      console.log(
        `Document verification job queued for document: ${documentId}`
      );
    } catch (error) {
      console.error("Failed to publish document verification message:", error);
      throw error;
    }
  }

  async consumeDocumentVerification(
    callback: (message: DocumentVerificationMessage) => Promise<void>
  ): Promise<void> {
    if (!this.channel) {
      throw new Error("RabbitMQ channel not available");
    }

    try {
      await this.channel.prefetch(1);

      await this.channel.consume(
        this.DOCUMENT_VERIFICATION_QUEUE,
        async (msg: any) => {
          if (!msg) return;

          try {
            const message: DocumentVerificationMessage = JSON.parse(
              msg.content.toString()
            );

            await callback(message);

            this.channel!.ack(msg);
            console.log(
              `Processed document verification: ${message.documentId}`
            );
          } catch (error) {
            console.error("Failed to process document verification:", error);
            this.channel!.nack(msg, false, false);
          }
        },
        {
          noAck: false,
        }
      );

      console.log("Started consuming document verification messages");
    } catch (error) {
      console.error("Failed to start consuming messages:", error);
      throw error;
    }
  }

  async getQueueInfo(
    queueName: string = this.DOCUMENT_VERIFICATION_QUEUE
  ): Promise<any> {
    if (!this.channel) {
      throw new Error("RabbitMQ channel not available");
    }

    try {
      return await this.channel.checkQueue(queueName);
    } catch (error) {
      console.error("Failed to get queue info:", error);
      throw error;
    }
  }

  async purgeQueue(
    queueName: string = this.DOCUMENT_VERIFICATION_QUEUE
  ): Promise<void> {
    if (!this.channel) {
      throw new Error("RabbitMQ channel not available");
    }

    try {
      await this.channel.purgeQueue(queueName);
      console.log(`Queue '${queueName}' purged successfully`);
    } catch (error) {
      console.error("Failed to purge queue:", error);
      throw error;
    }
  }

  isHealthy(): boolean {
    return this.connection !== null && this.channel !== null;
  }

  async republishFailedMessages(): Promise<void> {
    console.log("Republishing failed messages feature not implemented yet");
  }

  async setupDeadLetterQueue(): Promise<void> {
    if (!this.channel) {
      throw new Error("RabbitMQ channel not available");
    }

    try {
      const deadLetterQueue = `${this.DOCUMENT_VERIFICATION_QUEUE}_dlq`;

      await this.channel.assertQueue(deadLetterQueue, {
        durable: true,
      });

      await this.channel.assertQueue(this.DOCUMENT_VERIFICATION_QUEUE, {
        durable: true,
        arguments: {
          "x-dead-letter-exchange": "",
          "x-dead-letter-routing-key": deadLetterQueue,
          "x-message-ttl": 600000,
        },
      });

      console.log("Dead letter queue setup completed");
    } catch (error) {
      console.error("Failed to setup dead letter queue:", error);
      throw error;
    }
  }
}

export const queueService = new QueueService();
