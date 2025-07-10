import {
  DataTypes,
  Model,
  Optional,
  BelongsToGetAssociationMixin,
} from "sequelize";
import { sequelize } from "../../infrastructure/database/connection";
import { User } from "./User";

export enum DocumentStatus {
  PENDING = "PENDING",
  VERIFIED = "VERIFIED",
  FAILED = "FAILED",
}

export enum DocumentType {
  PASSPORT = "passport",
  DRIVERS_LICENSE = "drivers_license",
  NATIONAL_ID = "national_id",
  UTILITY_BILL = "utility_bill",
  BANK_STATEMENT = "bank_statement",
  OTHER = "other",
}

export interface DocumentAttributes {
  id: string;
  userId: string;
  documentType: DocumentType;
  documentUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  cloudinaryPublicId?: string;
  status: DocumentStatus;
  verificationDetails?: string;
  rejectionReason?: string;
  verifiedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DocumentCreationAttributes
  extends Optional<
    DocumentAttributes,
    | "id"
    | "status"
    | "verificationDetails"
    | "rejectionReason"
    | "verifiedAt"
    | "createdAt"
    | "updatedAt"
  > {}

export class Document
  extends Model<DocumentAttributes, DocumentCreationAttributes>
  implements DocumentAttributes
{
  public id!: string;
  public userId!: string;
  public documentType!: DocumentType;
  public documentUrl!: string;
  public fileName!: string;
  public fileSize!: number;
  public mimeType!: string;
  public cloudinaryPublicId?: string;
  public status!: DocumentStatus;
  public verificationDetails?: string;
  public rejectionReason?: string;
  public verifiedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public getUser!: BelongsToGetAssociationMixin<User>;

  public get isVerified(): boolean {
    return this.status === DocumentStatus.VERIFIED;
  }

  public get isPending(): boolean {
    return this.status === DocumentStatus.PENDING;
  }

  public get isFailed(): boolean {
    return this.status === DocumentStatus.FAILED;
  }
}

Document.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
    documentType: {
      type: DataTypes.ENUM(...Object.values(DocumentType)),
      allowNull: false,
    },
    documentUrl: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isUrl: true,
      },
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fileSize: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    mimeType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    cloudinaryPublicId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(DocumentStatus)),
      allowNull: false,
      defaultValue: DocumentStatus.PENDING,
    },
    verificationDetails: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Document",
    tableName: "documents",
    timestamps: true,
    indexes: [
      {
        fields: ["userId"],
      },
      {
        fields: ["status"],
      },
      {
        fields: ["documentType"],
      },
      {
        fields: ["createdAt"],
      },
      {
        fields: ["userId", "status"],
      },
    ],
  }
);

Document.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

User.hasMany(Document, {
  foreignKey: "userId",
  as: "documents",
});
