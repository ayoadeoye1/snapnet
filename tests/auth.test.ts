import request from "supertest";
import app from "../src/app";
import { User, UserRole } from "../src/domain/entities";
import "./setup";

describe("Authentication API", () => {
  // Mock data
  const mockUser = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    email: "test@example.com",
    firstName: "John",
    lastName: "Doe",
    role: UserRole.USER,
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
    role: UserRole.ADMIN,
    isActive: true,
    password: undefined,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };

  const validToken =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoidXNlciIsImlhdCI6MTYzOTc1NDQwMCwiZXhwIjoxNjM5ODQwODAwfQ.test";

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
      it("should register a new user with valid data", async () => {
        const mockUserWithPassword = {
          ...mockUser,
          comparePassword: jest.fn(),
          update: jest.fn(),
          destroy: jest.fn(),
        };

        (User.findOne as jest.Mock).mockResolvedValue(null); // No existing user
        (User.create as jest.Mock).mockResolvedValue(mockUserWithPassword);

        const response = await request(app)
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
              role: UserRole.USER,
            }),
            token: expect.any(String),
          },
        });
        expect(response.body.data.user.password).toBeUndefined();
      });

      it("should register an admin user when role is specified", async () => {
        const adminSignupData = { ...validSignupData, role: UserRole.ADMIN };
        const mockAdminWithPassword = {
          ...mockAdmin,
          comparePassword: jest.fn(),
          update: jest.fn(),
          destroy: jest.fn(),
        };

        (User.findOne as jest.Mock).mockResolvedValue(null);
        (User.create as jest.Mock).mockResolvedValue(mockAdminWithPassword);

        const response = await request(app)
          .post("/api/v1/auth/signup")
          .send(adminSignupData);

        expect(response.status).toBe(201);
        expect(response.body.data.user.role).toBe(UserRole.ADMIN);
      });
    });

    describe("Validation errors", () => {
      it("should reject invalid email format", async () => {
        const response = await request(app)
          .post("/api/v1/auth/signup")
          .send({ ...validSignupData, email: "invalid-email" });

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({
          success: false,
          message: "Validation error",
          errors: expect.arrayContaining([expect.stringContaining("email")]),
        });
      });

      it("should reject short password", async () => {
        const response = await request(app)
          .post("/api/v1/auth/signup")
          .send({ ...validSignupData, password: "123" });

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({
          success: false,
          message: "Validation error",
          errors: expect.arrayContaining([expect.stringContaining("password")]),
        });
      });

      it("should reject missing required fields", async () => {
        const response = await request(app)
          .post("/api/v1/auth/signup")
          .send({ email: "test@example.com" });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe("Validation error");
      });
    });

    describe("Business logic errors", () => {
      it("should reject duplicate email", async () => {
        (User.findOne as jest.Mock).mockResolvedValue(mockUser); // Existing user

        const response = await request(app)
          .post("/api/v1/auth/signup")
          .send(validSignupData);

        expect(response.status).toBe(409);
        expect(response.body).toMatchObject({
          success: false,
          message: "User already exists with this email",
        });
      });
    });
  });

  describe("POST /api/v1/auth/login", () => {
    const validLoginData = {
      email: "test@example.com",
      password: "password123",
    };

    describe("Successful authentication", () => {
      it("should login user with correct credentials", async () => {
        const mockUserWithPassword = {
          ...mockUser,
          comparePassword: jest.fn().mockResolvedValue(true),
          update: jest.fn(),
          destroy: jest.fn(),
        };

        (User.findOne as jest.Mock).mockResolvedValue(mockUserWithPassword);

        const response = await request(app)
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
      });
    });

    describe("Authentication failures", () => {
      it("should reject non-existent user", async () => {
        (User.findOne as jest.Mock).mockResolvedValue(null);

        const response = await request(app)
          .post("/api/v1/auth/login")
          .send(validLoginData);

        expect(response.status).toBe(401);
        expect(response.body).toMatchObject({
          success: false,
          message: "Invalid email or password",
        });
      });

      it("should reject incorrect password", async () => {
        const mockUserWithPassword = {
          ...mockUser,
          comparePassword: jest.fn().mockResolvedValue(false),
        };

        (User.findOne as jest.Mock).mockResolvedValue(mockUserWithPassword);

        const response = await request(app)
          .post("/api/v1/auth/login")
          .send(validLoginData);

        expect(response.status).toBe(401);
        expect(response.body).toMatchObject({
          success: false,
          message: "Invalid email or password",
        });
      });

      it("should reject inactive user", async () => {
        const inactiveUser = {
          ...mockUser,
          isActive: false,
          comparePassword: jest.fn().mockResolvedValue(true),
        };

        (User.findOne as jest.Mock).mockResolvedValue(null); // findOne with isActive: true returns null

        const response = await request(app)
          .post("/api/v1/auth/login")
          .send(validLoginData);

        expect(response.status).toBe(401);
        expect(response.body.message).toBe("Invalid email or password");
      });
    });

    describe("Validation errors", () => {
      it("should reject invalid email format", async () => {
        const response = await request(app)
          .post("/api/v1/auth/login")
          .send({ ...validLoginData, email: "invalid-email" });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe("Validation error");
      });

      it("should reject missing credentials", async () => {
        const response = await request(app)
          .post("/api/v1/auth/login")
          .send({ email: "test@example.com" });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe("Validation error");
      });
    });
  });

  describe("GET /api/v1/auth/profile", () => {
    describe("Successful profile retrieval", () => {
      it("should return user profile with valid token", async () => {
        (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

        const response = await request(app)
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
      });
    });

    describe("Authentication failures", () => {
      it("should reject request without token", async () => {
        const response = await request(app).get("/api/v1/auth/profile");

        expect(response.status).toBe(401);
        expect(response.body).toMatchObject({
          success: false,
          message: "Access token required",
        });
      });

      it("should reject request with invalid token", async () => {
        const response = await request(app)
          .get("/api/v1/auth/profile")
          .set("Authorization", "Bearer invalid-token");

        expect(response.status).toBe(401);
        expect(response.body).toMatchObject({
          success: false,
          message: "Invalid or expired token",
        });
      });

      it("should reject request for non-existent user", async () => {
        (User.findByPk as jest.Mock).mockResolvedValue(null);

        const response = await request(app)
          .get("/api/v1/auth/profile")
          .set("Authorization", `Bearer ${validToken}`);

        expect(response.status).toBe(401);
        expect(response.body).toMatchObject({
          success: false,
          message: "Invalid or expired token",
        });
      });
    });
  });

  describe("PUT /api/v1/auth/profile", () => {
    const updateData = {
      firstName: "Updated",
      lastName: "Name",
    };

    describe("Successful profile update", () => {
      it("should update user profile with valid data", async () => {
        const updatedUser = { ...mockUser, ...updateData };
        const mockUserWithMethods = {
          ...mockUser,
          update: jest.fn().mockResolvedValue(updatedUser),
        };

        (User.findByPk as jest.Mock).mockResolvedValue(mockUserWithMethods);

        const response = await request(app)
          .put("/api/v1/auth/profile")
          .set("Authorization", `Bearer ${validToken}`)
          .send(updateData);

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          success: true,
          message: "Profile updated successfully",
          data: expect.objectContaining(updateData),
        });
      });
    });

    describe("Authentication and authorization", () => {
      it("should reject request without token", async () => {
        const response = await request(app)
          .put("/api/v1/auth/profile")
          .send(updateData);

        expect(response.status).toBe(401);
        expect(response.body.message).toBe("Access token required");
      });
    });
  });

  describe("PUT /api/v1/auth/password", () => {
    const passwordUpdateData = {
      currentPassword: "password123",
      newPassword: "newpassword456",
    };

    describe("Successful password update", () => {
      it("should update password with correct current password", async () => {
        const mockUserWithMethods = {
          ...mockUser,
          comparePassword: jest.fn().mockResolvedValue(true),
          update: jest.fn().mockResolvedValue(mockUser),
        };

        (User.findByPk as jest.Mock).mockResolvedValue(mockUserWithMethods);

        const response = await request(app)
          .put("/api/v1/auth/password")
          .set("Authorization", `Bearer ${validToken}`)
          .send(passwordUpdateData);

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          success: true,
          message: "Password updated successfully",
        });
      });
    });

    describe("Password validation failures", () => {
      it("should reject incorrect current password", async () => {
        const mockUserWithMethods = {
          ...mockUser,
          comparePassword: jest.fn().mockResolvedValue(false),
        };

        (User.findByPk as jest.Mock).mockResolvedValue(mockUserWithMethods);

        const response = await request(app)
          .put("/api/v1/auth/password")
          .set("Authorization", `Bearer ${validToken}`)
          .send(passwordUpdateData);

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({
          success: false,
          message: "Current password is incorrect",
        });
      });

      it("should reject weak new password", async () => {
        const response = await request(app)
          .put("/api/v1/auth/password")
          .set("Authorization", `Bearer ${validToken}`)
          .send({
            currentPassword: "password123",
            newPassword: "123",
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe("Validation error");
      });
    });
  });
});
