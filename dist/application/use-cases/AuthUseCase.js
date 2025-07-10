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
exports.AuthUseCase = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const entities_1 = require("../../domain/entities");
const config_1 = require("../../configs/config");
class AuthUseCase {
    signup(signupData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const existingUser = yield entities_1.User.findOne({
                    where: { email: signupData.email },
                });
                if (existingUser) {
                    throw new Error("User already exists with this email");
                }
                const userData = {
                    email: signupData.email,
                    password: signupData.password,
                    firstName: signupData.firstName,
                    lastName: signupData.lastName,
                    role: signupData.role || entities_1.UserRole.USER,
                };
                const user = yield entities_1.User.create(userData);
                const token = this.generateToken(user);
                return { user, token };
            }
            catch (error) {
                console.error("Signup error:", error);
                throw error;
            }
        });
    }
    login(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield entities_1.User.findOne({
                    where: {
                        email: email.toLowerCase(),
                        isActive: true,
                    },
                });
                if (!user) {
                    throw new Error("Invalid email or password");
                }
                const isPasswordValid = yield user.comparePassword(password);
                if (!isPasswordValid) {
                    throw new Error("Invalid email or password");
                }
                const token = this.generateToken(user);
                return { user, token };
            }
            catch (error) {
                console.error("Login error:", error);
                throw error;
            }
        });
    }
    getUserById(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield entities_1.User.findByPk(userId);
            }
            catch (error) {
                console.error("Get user by ID error:", error);
                return null;
            }
        });
    }
    updateProfile(userId, updateData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield entities_1.User.findByPk(userId);
                if (!user) {
                    throw new Error("User not found");
                }
                yield user.update(updateData);
                return user;
            }
            catch (error) {
                console.error("Update profile error:", error);
                throw error;
            }
        });
    }
    updatePassword(userId, currentPassword, newPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield entities_1.User.findByPk(userId);
                if (!user) {
                    throw new Error("User not found");
                }
                const isCurrentPasswordValid = yield user.comparePassword(currentPassword);
                if (!isCurrentPasswordValid) {
                    throw new Error("Current password is incorrect");
                }
                yield user.update({ password: newPassword });
            }
            catch (error) {
                console.error("Update password error:", error);
                throw error;
            }
        });
    }
    getAllUsers() {
        return __awaiter(this, arguments, void 0, function* (page = 1, limit = 10, role) {
            try {
                const offset = (page - 1) * limit;
                const whereClause = {};
                if (role) {
                    whereClause.role = role;
                }
                const { count, rows } = yield entities_1.User.findAndCountAll({
                    where: whereClause,
                    limit,
                    offset,
                    order: [["createdAt", "DESC"]],
                });
                return {
                    users: rows,
                    total: count,
                    totalPages: Math.ceil(count / limit),
                };
            }
            catch (error) {
                console.error("Get all users error:", error);
                throw error;
            }
        });
    }
    generateToken(user) {
        const payload = {
            userId: user.id,
            email: user.email,
            role: user.role,
        };
        return jsonwebtoken_1.default.sign(payload, config_1.config.jwt.secret, {
            expiresIn: config_1.config.jwt.expiresIn,
        });
    }
    verifyToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, config_1.config.jwt.secret);
        }
        catch (error) {
            throw new Error("Invalid token");
        }
    }
}
exports.AuthUseCase = AuthUseCase;
