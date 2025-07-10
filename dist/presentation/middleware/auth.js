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
exports.optionalAuth = exports.requireAdmin = exports.requireUserOnly = exports.requireUser = exports.authenticateToken = void 0;
const AuthUseCase_1 = require("../../application/use-cases/AuthUseCase");
const entities_1 = require("../../domain/entities");
const authUseCase = new AuthUseCase_1.AuthUseCase();
const authenticateToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(" ")[1];
        if (!token) {
            res.status(401).json({
                success: false,
                message: "Access token required",
            });
            return;
        }
        const decoded = authUseCase.verifyToken(token);
        const user = yield authUseCase.getUserById(decoded.userId);
        if (!user || !user.isActive) {
            res.status(401).json({
                success: false,
                message: "Invalid or expired token",
            });
            return;
        }
        req.user = user;
        req.userId = user.id;
        next();
    }
    catch (error) {
        console.error("Authentication error:", error);
        res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
    }
});
exports.authenticateToken = authenticateToken;
const requireUser = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: "Authentication required",
        });
        return;
    }
    next();
};
exports.requireUser = requireUser;
const requireUserOnly = (req, res, next) => {
    if (!req.user || req.user.role !== entities_1.UserRole.USER) {
        res.status(401).json({
            success: false,
            message: "User access required",
        });
        return;
    }
    next();
};
exports.requireUserOnly = requireUserOnly;
const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== entities_1.UserRole.ADMIN) {
        res.status(403).json({
            success: false,
            message: "Admin access required",
        });
        return;
    }
    next();
};
exports.requireAdmin = requireAdmin;
const optionalAuth = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(" ")[1];
        if (token) {
            const decoded = authUseCase.verifyToken(token);
            const user = yield authUseCase.getUserById(decoded.userId);
            if (user && user.isActive) {
                req.user = user;
                req.userId = user.id;
            }
        }
        next();
    }
    catch (error) {
        next();
    }
});
exports.optionalAuth = optionalAuth;
