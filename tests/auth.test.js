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
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../src/app"));
const entities_1 = require("../src/domain/entities");
require("./setup");
describe("Authentication API", () => {
    // Mock data
    const mockUser = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        role: entities_1.UserRole.USER,
        isActive: true,
        password: undefined, // Should not be returned
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        updatedAt: new Date("2024-01-01T00:00:00.000Z"),
    };
    const mockAdmin = {
        id: "550e8400-e29b-41d4-a716-446655440001",
        email: "admin@example.com",
        firstName: "Admin",
        lastName: "User",
        role: entities_1.UserRole.ADMIN,
        isActive: true,
        password: undefined,
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        updatedAt: new Date("2024-01-01T00:00:00.000Z"),
    };
    const validToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoidXNlciIsImlhdCI6MTYzOTc1NDQwMCwiZXhwIjoxNjM5ODQwODAwfQ.test";
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe("POST /api/v1/auth/signup", () => {
        const validSignupData = {
            email: "test@example.com",
            password: "password123",
            firstName: "John",
            lastName: "Doe",
        };
        describe("Successful registration", () => {
            it("should register a new user with valid data", () => __awaiter(void 0, void 0, void 0, function* () {
                const mockUserWithPassword = Object.assign(Object.assign({}, mockUser), { comparePassword: jest.fn(), update: jest.fn(), destroy: jest.fn() });
                entities_1.User.findOne.mockResolvedValue(null); // No existing user
                entities_1.User.create.mockResolvedValue(mockUserWithPassword);
                const response = yield (0, supertest_1.default)(app_1.default)
                    .post("/api/v1/auth/signup")
                    .send(validSignupData);
                expect(response.status).toBe(201);
                expect(response.body).toMatchObject({
                    success: true,
                    message: "User registered successfully",
                    data: {
                        user: expect.objectContaining({
                            email: validSignupData.email,
                            firstName: validSignupData.firstName,
                            lastName: validSignupData.lastName,
                            role: entities_1.UserRole.USER,
                        }),
                        token: expect.any(String),
                    },
                });
                expect(response.body.data.user.password).toBeUndefined();
            }));
            it("should register an admin user when role is specified", () => __awaiter(void 0, void 0, void 0, function* () {
                const adminSignupData = Object.assign(Object.assign({}, validSignupData), { role: entities_1.UserRole.ADMIN });
                const mockAdminWithPassword = Object.assign(Object.assign({}, mockAdmin), { comparePassword: jest.fn(), update: jest.fn(), destroy: jest.fn() });
                entities_1.User.findOne.mockResolvedValue(null);
                entities_1.User.create.mockResolvedValue(mockAdminWithPassword);
                const response = yield (0, supertest_1.default)(app_1.default)
                    .post("/api/v1/auth/signup")
                    .send(adminSignupData);
                expect(response.status).toBe(201);
                expect(response.body.data.user.role).toBe(entities_1.UserRole.ADMIN);
            }));
        });
        describe("Validation errors", () => {
            it("should reject invalid email format", () => __awaiter(void 0, void 0, void 0, function* () {
                const response = yield (0, supertest_1.default)(app_1.default)
                    .post("/api/v1/auth/signup")
                    .send(Object.assign(Object.assign({}, validSignupData), { email: "invalid-email" }));
                expect(response.status).toBe(400);
                expect(response.body).toMatchObject({
                    success: false,
                    message: "Validation error",
                    errors: expect.arrayContaining([expect.stringContaining("email")]),
                });
            }));
            it("should reject short password", () => __awaiter(void 0, void 0, void 0, function* () {
                const response = yield (0, supertest_1.default)(app_1.default)
                    .post("/api/v1/auth/signup")
                    .send(Object.assign(Object.assign({}, validSignupData), { password: "123" }));
                expect(response.status).toBe(400);
                expect(response.body).toMatchObject({
                    success: false,
                    message: "Validation error",
                    errors: expect.arrayContaining([expect.stringContaining("password")]),
                });
            }));
            it("should reject missing required fields", () => __awaiter(void 0, void 0, void 0, function* () {
                const response = yield (0, supertest_1.default)(app_1.default)
                    .post("/api/v1/auth/signup")
                    .send({ email: "test@example.com" });
                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe("Validation error");
            }));
        });
        describe("Business logic errors", () => {
            it("should reject duplicate email", () => __awaiter(void 0, void 0, void 0, function* () {
                entities_1.User.findOne.mockResolvedValue(mockUser); // Existing user
                const response = yield (0, supertest_1.default)(app_1.default)
                    .post("/api/v1/auth/signup")
                    .send(validSignupData);
                expect(response.status).toBe(409);
                expect(response.body).toMatchObject({
                    success: false,
                    message: "User already exists with this email",
                });
            }));
        });
    });
    describe("POST /api/v1/auth/login", () => {
        const validLoginData = {
            email: "test@example.com",
            password: "password123",
        };
        describe("Successful authentication", () => {
            it("should login user with correct credentials", () => __awaiter(void 0, void 0, void 0, function* () {
                const mockUserWithPassword = Object.assign(Object.assign({}, mockUser), { comparePassword: jest.fn().mockResolvedValue(true), update: jest.fn(), destroy: jest.fn() });
                entities_1.User.findOne.mockResolvedValue(mockUserWithPassword);
                const response = yield (0, supertest_1.default)(app_1.default)
                    .post("/api/v1/auth/login")
                    .send(validLoginData);
                expect(response.status).toBe(200);
                expect(response.body).toMatchObject({
                    success: true,
                    message: "Login successful",
                    data: {
                        user: expect.objectContaining({
                            email: validLoginData.email,
                        }),
                        token: expect.any(String),
                    },
                });
                expect(response.body.data.user.password).toBeUndefined();
            }));
        });
        describe("Authentication failures", () => {
            it("should reject non-existent user", () => __awaiter(void 0, void 0, void 0, function* () {
                entities_1.User.findOne.mockResolvedValue(null);
                const response = yield (0, supertest_1.default)(app_1.default)
                    .post("/api/v1/auth/login")
                    .send(validLoginData);
                expect(response.status).toBe(401);
                expect(response.body).toMatchObject({
                    success: false,
                    message: "Invalid email or password",
                });
            }));
            it("should reject incorrect password", () => __awaiter(void 0, void 0, void 0, function* () {
                const mockUserWithPassword = Object.assign(Object.assign({}, mockUser), { comparePassword: jest.fn().mockResolvedValue(false) });
                entities_1.User.findOne.mockResolvedValue(mockUserWithPassword);
                const response = yield (0, supertest_1.default)(app_1.default)
                    .post("/api/v1/auth/login")
                    .send(validLoginData);
                expect(response.status).toBe(401);
                expect(response.body).toMatchObject({
                    success: false,
                    message: "Invalid email or password",
                });
            }));
            it("should reject inactive user", () => __awaiter(void 0, void 0, void 0, function* () {
                const inactiveUser = Object.assign(Object.assign({}, mockUser), { isActive: false, comparePassword: jest.fn().mockResolvedValue(true) });
                entities_1.User.findOne.mockResolvedValue(null); // findOne with isActive: true returns null
                const response = yield (0, supertest_1.default)(app_1.default)
                    .post("/api/v1/auth/login")
                    .send(validLoginData);
                expect(response.status).toBe(401);
                expect(response.body.message).toBe("Invalid email or password");
            }));
        });
        describe("Validation errors", () => {
            it("should reject invalid email format", () => __awaiter(void 0, void 0, void 0, function* () {
                const response = yield (0, supertest_1.default)(app_1.default)
                    .post("/api/v1/auth/login")
                    .send(Object.assign(Object.assign({}, validLoginData), { email: "invalid-email" }));
                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe("Validation error");
            }));
            it("should reject missing credentials", () => __awaiter(void 0, void 0, void 0, function* () {
                const response = yield (0, supertest_1.default)(app_1.default)
                    .post("/api/v1/auth/login")
                    .send({ email: "test@example.com" });
                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe("Validation error");
            }));
        });
    });
    describe("GET /api/v1/auth/profile", () => {
        describe("Successful profile retrieval", () => {
            it("should return user profile with valid token", () => __awaiter(void 0, void 0, void 0, function* () {
                entities_1.User.findByPk.mockResolvedValue(mockUser);
                const response = yield (0, supertest_1.default)(app_1.default)
                    .get("/api/v1/auth/profile")
                    .set("Authorization", `Bearer ${validToken}`);
                expect(response.status).toBe(200);
                expect(response.body).toMatchObject({
                    success: true,
                    data: expect.objectContaining({
                        email: mockUser.email,
                        firstName: mockUser.firstName,
                        lastName: mockUser.lastName,
                    }),
                });
                expect(response.body.data.password).toBeUndefined();
            }));
        });
        describe("Authentication failures", () => {
            it("should reject request without token", () => __awaiter(void 0, void 0, void 0, function* () {
                const response = yield (0, supertest_1.default)(app_1.default).get("/api/v1/auth/profile");
                expect(response.status).toBe(401);
                expect(response.body).toMatchObject({
                    success: false,
                    message: "Access token required",
                });
            }));
            it("should reject request with invalid token", () => __awaiter(void 0, void 0, void 0, function* () {
                const response = yield (0, supertest_1.default)(app_1.default)
                    .get("/api/v1/auth/profile")
                    .set("Authorization", "Bearer invalid-token");
                expect(response.status).toBe(401);
                expect(response.body).toMatchObject({
                    success: false,
                    message: "Invalid or expired token",
                });
            }));
            it("should reject request for non-existent user", () => __awaiter(void 0, void 0, void 0, function* () {
                entities_1.User.findByPk.mockResolvedValue(null);
                const response = yield (0, supertest_1.default)(app_1.default)
                    .get("/api/v1/auth/profile")
                    .set("Authorization", `Bearer ${validToken}`);
                expect(response.status).toBe(401);
                expect(response.body).toMatchObject({
                    success: false,
                    message: "Invalid or expired token",
                });
            }));
        });
    });
    describe("PUT /api/v1/auth/profile", () => {
        const updateData = {
            firstName: "Updated",
            lastName: "Name",
        };
        describe("Successful profile update", () => {
            it("should update user profile with valid data", () => __awaiter(void 0, void 0, void 0, function* () {
                const updatedUser = Object.assign(Object.assign({}, mockUser), updateData);
                const mockUserWithMethods = Object.assign(Object.assign({}, mockUser), { update: jest.fn().mockResolvedValue(updatedUser) });
                entities_1.User.findByPk.mockResolvedValue(mockUserWithMethods);
                const response = yield (0, supertest_1.default)(app_1.default)
                    .put("/api/v1/auth/profile")
                    .set("Authorization", `Bearer ${validToken}`)
                    .send(updateData);
                expect(response.status).toBe(200);
                expect(response.body).toMatchObject({
                    success: true,
                    message: "Profile updated successfully",
                    data: expect.objectContaining(updateData),
                });
            }));
        });
        describe("Authentication and authorization", () => {
            it("should reject request without token", () => __awaiter(void 0, void 0, void 0, function* () {
                const response = yield (0, supertest_1.default)(app_1.default)
                    .put("/api/v1/auth/profile")
                    .send(updateData);
                expect(response.status).toBe(401);
                expect(response.body.message).toBe("Access token required");
            }));
        });
    });
    describe("PUT /api/v1/auth/password", () => {
        const passwordUpdateData = {
            currentPassword: "password123",
            newPassword: "newpassword456",
        };
        describe("Successful password update", () => {
            it("should update password with correct current password", () => __awaiter(void 0, void 0, void 0, function* () {
                const mockUserWithMethods = Object.assign(Object.assign({}, mockUser), { comparePassword: jest.fn().mockResolvedValue(true), update: jest.fn().mockResolvedValue(mockUser) });
                entities_1.User.findByPk.mockResolvedValue(mockUserWithMethods);
                const response = yield (0, supertest_1.default)(app_1.default)
                    .put("/api/v1/auth/password")
                    .set("Authorization", `Bearer ${validToken}`)
                    .send(passwordUpdateData);
                expect(response.status).toBe(200);
                expect(response.body).toMatchObject({
                    success: true,
                    message: "Password updated successfully",
                });
            }));
        });
        describe("Password validation failures", () => {
            it("should reject incorrect current password", () => __awaiter(void 0, void 0, void 0, function* () {
                const mockUserWithMethods = Object.assign(Object.assign({}, mockUser), { comparePassword: jest.fn().mockResolvedValue(false) });
                entities_1.User.findByPk.mockResolvedValue(mockUserWithMethods);
                const response = yield (0, supertest_1.default)(app_1.default)
                    .put("/api/v1/auth/password")
                    .set("Authorization", `Bearer ${validToken}`)
                    .send(passwordUpdateData);
                expect(response.status).toBe(400);
                expect(response.body).toMatchObject({
                    success: false,
                    message: "Current password is incorrect",
                });
            }));
            it("should reject weak new password", () => __awaiter(void 0, void 0, void 0, function* () {
                const response = yield (0, supertest_1.default)(app_1.default)
                    .put("/api/v1/auth/password")
                    .set("Authorization", `Bearer ${validToken}`)
                    .send({
                    currentPassword: "password123",
                    newPassword: "123",
                });
                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe("Validation error");
            }));
        });
    });
});
