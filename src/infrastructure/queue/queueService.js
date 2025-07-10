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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.queueService = void 0;
const amqplib_1 = __importDefault(require("amqplib"));
const config_1 = require("../../configs/config");
class QueueService {
    constructor() {
        this.DOCUMENT_VERIFICATION_QUEUE = "document_verification";
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.connection = yield amqplib_1.default.connect(config_1.config.rabbitmq.url);
                this.connection.on("error", (error) => {
                    console.error("RabbitMQ connection error:", error);
                });
                this.connection.on("close", () => {
                    console.log("RabbitMQ connection closed");
                });
                this.channel = yield this.connection.createChannel();
                yield this.channel.assertQueue(this.DOCUMENT_VERIFICATION_QUEUE, {
                    durable: true,
                });
                console.log("Connected to RabbitMQ");
            }
            catch (error) {
                console.error("Failed to connect to RabbitMQ:", error);
                throw error;
            }
        });
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.channel) {
                    yield this.channel.close();
                    this.channel = null;
                }
                if (this.connection) {
                    yield this.connection.close();
                    this.connection = null;
                }
                console.log("Disconnected from RabbitMQ");
            }
            catch (error) {
                console.error("Error disconnecting from RabbitMQ:", error);
            }
        });
    }
    publishDocumentVerification(documentId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.channel) {
                throw new Error("RabbitMQ channel not available");
            }
            try {
                const message = {
                    documentId,
                    timestamp: new Date(),
                };
                const messageBuffer = Buffer.from(JSON.stringify(message));
                const sent = this.channel.sendToQueue(this.DOCUMENT_VERIFICATION_QUEUE, messageBuffer, {
                    persistent: true,
                });
                if (!sent) {
                    throw new Error("Failed to send message to queue");
                }
                console.log(`Document verification job queued for document: ${documentId}`);
            }
            catch (error) {
                console.error("Failed to publish document verification message:", error);
                throw error;
            }
        });
    }
    consumeDocumentVerification(callback) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.channel) {
                throw new Error("RabbitMQ channel not available");
            }
            try {
                yield this.channel.prefetch(1);
                yield this.channel.consume(this.DOCUMENT_VERIFICATION_QUEUE, (msg) => __awaiter(this, void 0, void 0, function* () {
                    if (!msg)
                        return;
                    try {
                        const message = JSON.parse(msg.content.toString());
                        yield callback(message);
                        this.channel.ack(msg);
                        console.log(`Processed document verification: ${message.documentId}`);
                    }
                    catch (error) {
                        console.error("Failed to process document verification:", error);
                        this.channel.nack(msg, false, false);
                    }
                }), {
                    noAck: false,
                });
                console.log("Started consuming document verification messages");
            }
            catch (error) {
                console.error("Failed to start consuming messages:", error);
                throw error;
            }
        });
    }
    getQueueInfo() {
        return __awaiter(this, arguments, void 0, function* (queueName = this.DOCUMENT_VERIFICATION_QUEUE) {
            if (!this.channel) {
                throw new Error("RabbitMQ channel not available");
            }
            try {
                return yield this.channel.checkQueue(queueName);
            }
            catch (error) {
                console.error("Failed to get queue info:", error);
                throw error;
            }
        });
    }
    purgeQueue() {
        return __awaiter(this, arguments, void 0, function* (queueName = this.DOCUMENT_VERIFICATION_QUEUE) {
            if (!this.channel) {
                throw new Error("RabbitMQ channel not available");
            }
            try {
                yield this.channel.purgeQueue(queueName);
                console.log(`Queue '${queueName}' purged successfully`);
            }
            catch (error) {
                console.error("Failed to purge queue:", error);
                throw error;
            }
        });
    }
    isHealthy() {
        return this.connection !== null && this.channel !== null;
    }
    republishFailedMessages() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Republishing failed messages feature not implemented yet");
        });
    }
    setupDeadLetterQueue() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.channel) {
                throw new Error("RabbitMQ channel not available");
            }
            try {
                const deadLetterQueue = `${this.DOCUMENT_VERIFICATION_QUEUE}_dlq`;
                yield this.channel.assertQueue(deadLetterQueue, {
                    durable: true,
                });
                yield this.channel.assertQueue(this.DOCUMENT_VERIFICATION_QUEUE, {
                    durable: true,
                    arguments: {
                        "x-dead-letter-exchange": "",
                        "x-dead-letter-routing-key": deadLetterQueue,
                        "x-message-ttl": 600000,
                    },
                });
                console.log("Dead letter queue setup completed");
            }
            catch (error) {
                console.error("Failed to setup dead letter queue:", error);
                throw error;
            }
        });
    }
}
exports.queueService = new QueueService();
