import jwt from "jsonwebtoken";
import { User, UserRole, UserCreationAttributes } from "../../domain/entities";
import { config } from "../../configs/config";

export interface LoginResult {
  user: User;
  token: string;
}

export interface SignupData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export class AuthUseCase {
  async signup(signupData: SignupData): Promise<LoginResult> {
    try {
      const existingUser = await User.findOne({
        where: { email: signupData.email },
      });

      if (existingUser) {
        throw new Error("User already exists with this email");
      }

      const userData: UserCreationAttributes = {
        email: signupData.email,
        password: signupData.password,
        firstName: signupData.firstName,
        lastName: signupData.lastName,
        role: signupData.role || UserRole.USER,
      };

      const user = await User.create(userData);
      const token = this.generateToken(user);

      return { user, token };
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  }

  async login(email: string, password: string): Promise<LoginResult> {
    try {
      const user = await User.findOne({
        where: {
          email: email.toLowerCase(),
          isActive: true,
        },
      });

      if (!user) {
        throw new Error("Invalid email or password");
      }

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new Error("Invalid email or password");
      }

      const token = this.generateToken(user);
      return { user, token };
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    try {
      return await User.findByPk(userId);
    } catch (error) {
      console.error("Get user by ID error:", error);
      return null;
    }
  }

  async updateProfile(
    userId: string,
    updateData: { firstName?: string; lastName?: string }
  ): Promise<User> {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error("User not found");
      }

      await user.update(updateData);
      return user;
    } catch (error) {
      console.error("Update profile error:", error);
      throw error;
    }
  }

  async updatePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error("User not found");
      }

      const isCurrentPasswordValid = await user.comparePassword(
        currentPassword
      );
      if (!isCurrentPasswordValid) {
        throw new Error("Current password is incorrect");
      }

      await user.update({ password: newPassword });
    } catch (error) {
      console.error("Update password error:", error);
      throw error;
    }
  }

  async getAllUsers(
    page: number = 1,
    limit: number = 10,
    role?: UserRole
  ): Promise<{ users: User[]; total: number; totalPages: number }> {
    try {
      const offset = (page - 1) * limit;
      const whereClause: any = {};

      if (role) {
        whereClause.role = role;
      }

      const { count, rows } = await User.findAndCountAll({
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
    } catch (error) {
      console.error("Get all users error:", error);
      throw error;
    }
  }

  private generateToken(user: User): string {
    const payload: Omit<JwtPayload, "iat" | "exp"> = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    } as jwt.SignOptions);
  }

  verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, config.jwt.secret) as JwtPayload;
    } catch (error) {
      throw new Error("Invalid token");
    }
  }
}
