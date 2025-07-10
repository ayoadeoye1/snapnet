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
exports.AuthController = void 0;
const authValidators_1 = require("../validators/authValidators");
class AuthController {
    constructor(authUseCase) {
        this.authUseCase = authUseCase;
    }
    signup(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { error, value } = authValidators_1.signupSchema.validate(req.body);
                if (error) {
                    res.status(400).json({
                        success: false,
                        message: "Validation error",
                        errors: error.details.map((detail) => detail.message),
                    });
                    return;
                }
                const result = yield this.authUseCase.signup(value);
                res.status(201).json({
                    success: true,
                    message: "User registered successfully",
                    data: {
                        user: result.user,
                        token: result.token,
                    },
                });
            }
            catch (error) {
                console.error("Signup controller error:", error);
                if (error.message === "User already exists with this email") {
                    res.status(409).json({
                        success: false,
                        message: error.message,
                    });
                }
                else {
                    res.status(500).json({
                        success: false,
                        message: "Internal server error",
                    });
                }
            }
        });
    }
    login(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { error, value } = authValidators_1.loginSchema.validate(req.body);
                if (error) {
                    res.status(400).json({
                        success: false,
                        message: "Validation error",
                        errors: error.details.map((detail) => detail.message),
                    });
                    return;
                }
                const result = yield this.authUseCase.login(value.email, value.password);
                res.status(200).json({
                    success: true,
                    message: "Login successful",
                    data: {
                        user: result.user,
                        token: result.token,
                    },
                });
            }
            catch (error) {
                console.error("Login controller error:", error);
                if (error.message === "Invalid email or password") {
                    res.status(401).json({
                        success: false,
                        message: error.message,
                    });
                }
                else {
                    res.status(500).json({
                        success: false,
                        message: "Internal server error",
                    });
                }
            }
        });
    }
    getProfile(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                res.status(200).json({
                    success: true,
                    data: req.user,
                });
            }
            catch (error) {
                console.error("Get profile controller error:", error);
                res.status(500).json({
                    success: false,
                    message: "Internal server error",
                });
            }
        });
    }
    updateProfile(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { error, value } = authValidators_1.updateProfileSchema.validate(req.body);
                if (error) {
                    res.status(400).json({
                        success: false,
                        message: "Validation error",
                        errors: error.details.map((detail) => detail.message),
                    });
                    return;
                }
                const updatedUser = yield this.authUseCase.updateProfile(req.userId, value);
                res.status(200).json({
                    success: true,
                    message: "Profile updated successfully",
                    data: updatedUser,
                });
            }
            catch (error) {
                console.error("Update profile controller error:", error);
                res.status(500).json({
                    success: false,
                    message: "Internal server error",
                });
            }
        });
    }
    updatePassword(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { error, value } = authValidators_1.updatePasswordSchema.validate(req.body);
                if (error) {
                    res.status(400).json({
                        success: false,
                        message: "Validation error",
                        errors: error.details.map((detail) => detail.message),
                    });
                    return;
                }
                yield this.authUseCase.updatePassword(req.userId, value.currentPassword, value.newPassword);
                res.status(200).json({
                    success: true,
                    message: "Password updated successfully",
                });
            }
            catch (error) {
                console.error("Update password controller error:", error);
                if (error.message === "Current password is incorrect") {
                    res.status(400).json({
                        success: false,
                        message: error.message,
                    });
                }
                else {
                    res.status(500).json({
                        success: false,
                        message: "Internal server error",
                    });
                }
            }
        });
    }
}
exports.AuthController = AuthController;
