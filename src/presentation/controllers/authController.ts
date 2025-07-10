import { Request, Response } from "express";
import { AuthUseCase } from "../../application/use-cases/AuthUseCase";
import {
  signupSchema,
  loginSchema,
  updatePasswordSchema,
  updateProfileSchema,
} from "../validators/authValidators";
import { AuthenticatedRequest } from "../middleware/auth";

export class AuthController {
  constructor(private authUseCase: AuthUseCase) {}

  async signup(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = signupSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.details.map((detail) => detail.message),
        });
        return;
      }

      const result = await this.authUseCase.signup(value);

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
          user: result.user,
          token: result.token,
        },
      });
    } catch (error: any) {
      console.error("Signup controller error:", error);

      if (error.message === "User already exists with this email") {
        res.status(409).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = loginSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.details.map((detail) => detail.message),
        });
        return;
      }

      const result = await this.authUseCase.login(value.email, value.password);

      res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
          user: result.user,
          token: result.token,
        },
      });
    } catch (error: any) {
      console.error("Login controller error:", error);

      if (error.message === "Invalid email or password") {
        res.status(401).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    }
  }

  async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      res.status(200).json({
        success: true,
        data: req.user,
      });
    } catch (error) {
      console.error("Get profile controller error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { error, value } = updateProfileSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.details.map((detail) => detail.message),
        });
        return;
      }

      const updatedUser = await this.authUseCase.updateProfile(
        req.userId!,
        value
      );

      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: updatedUser,
      });
    } catch (error: any) {
      console.error("Update profile controller error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async updatePassword(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { error, value } = updatePasswordSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.details.map((detail) => detail.message),
        });
        return;
      }

      await this.authUseCase.updatePassword(
        req.userId!,
        value.currentPassword,
        value.newPassword
      );

      res.status(200).json({
        success: true,
        message: "Password updated successfully",
      });
    } catch (error: any) {
      console.error("Update password controller error:", error);

      if (error.message === "Current password is incorrect") {
        res.status(400).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    }
  }
}
