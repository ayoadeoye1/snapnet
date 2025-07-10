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
exports.redisService = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const config_1 = require("../../configs/config");
class RedisService {
    constructor() {
        this.client = null;
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.client = new ioredis_1.default(config_1.config.redis.url);
                this.client.on("error", (error) => {
                    console.error("Redis error:", error);
                });
                this.client.on("connect", () => {
                    console.log("Connected to Redis");
                });
            }
            catch (error) {
                console.error("Failed to connect to Redis:", error);
                throw error;
            }
        });
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.client) {
                yield this.client.quit();
                this.client = null;
            }
        });
    }
    set(key, value, expirationInSeconds) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client) {
                throw new Error("Redis client not connected");
            }
            if (expirationInSeconds) {
                yield this.client.setex(key, expirationInSeconds, value);
            }
            else {
                yield this.client.set(key, value);
            }
        });
    }
    get(key) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client) {
                throw new Error("Redis client not connected");
            }
            return yield this.client.get(key);
        });
    }
    delete(key) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client) {
                throw new Error("Redis client not connected");
            }
            yield this.client.del(key);
        });
    }
    exists(key) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client) {
                throw new Error("Redis client not connected");
            }
            const result = yield this.client.exists(key);
            return result === 1;
        });
    }
    setHash(key, field, value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client) {
                throw new Error("Redis client not connected");
            }
            yield this.client.hset(key, field, value);
        });
    }
    getHash(key, field) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client) {
                throw new Error("Redis client not connected");
            }
            return yield this.client.hget(key, field);
        });
    }
    deleteHash(key, field) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client) {
                throw new Error("Redis client not connected");
            }
            yield this.client.hdel(key, field);
        });
    }
    increment(key) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client) {
                throw new Error("Redis client not connected");
            }
            return yield this.client.incr(key);
        });
    }
    expire(key, seconds) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client) {
                throw new Error("Redis client not connected");
            }
            yield this.client.expire(key, seconds);
        });
    }
    ping() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client) {
                return false;
            }
            try {
                const result = yield this.client.ping();
                return result === "PONG";
            }
            catch (error) {
                console.error("Redis ping failed:", error);
                return false;
            }
        });
    }
    flushAll() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client) {
                throw new Error("Redis client not connected");
            }
            yield this.client.flushall();
        });
    }
    getKeys(pattern) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client) {
                throw new Error("Redis client not connected");
            }
            return yield this.client.keys(pattern);
        });
    }
    setWithExpiry(key, value, expirySeconds) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client) {
                throw new Error("Redis client not connected");
            }
            yield this.client.set(key, value, "EX", expirySeconds);
        });
    }
    multiSet(keyValues) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client) {
                throw new Error("Redis client not connected");
            }
            const pipeline = this.client.pipeline();
            Object.entries(keyValues).forEach(([key, value]) => {
                pipeline.set(key, value);
            });
            yield pipeline.exec();
        });
    }
    getClient() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client) {
                throw new Error("Redis client not connected");
            }
            return this.client;
        });
    }
}
exports.redisService = new RedisService();
