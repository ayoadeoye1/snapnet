"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Document = exports.DocumentType = exports.DocumentStatus = void 0;
const sequelize_1 = require("sequelize");
const connection_1 = require("../../infrastructure/database/connection");
const User_1 = require("./User");
var DocumentStatus;
(function (DocumentStatus) {
    DocumentStatus["PENDING"] = "PENDING";
    DocumentStatus["VERIFIED"] = "VERIFIED";
    DocumentStatus["FAILED"] = "FAILED";
})(DocumentStatus || (exports.DocumentStatus = DocumentStatus = {}));
var DocumentType;
(function (DocumentType) {
    DocumentType["PASSPORT"] = "passport";
    DocumentType["DRIVERS_LICENSE"] = "drivers_license";
    DocumentType["NATIONAL_ID"] = "national_id";
    DocumentType["UTILITY_BILL"] = "utility_bill";
    DocumentType["BANK_STATEMENT"] = "bank_statement";
    DocumentType["OTHER"] = "other";
})(DocumentType || (exports.DocumentType = DocumentType = {}));
class Document extends sequelize_1.Model {
    get isVerified() {
        return this.status === DocumentStatus.VERIFIED;
    }
    get isPending() {
        return this.status === DocumentStatus.PENDING;
    }
    get isFailed() {
        return this.status === DocumentStatus.FAILED;
    }
}
exports.Document = Document;
Document.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: User_1.User,
            key: "id",
        },
    },
    documentType: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(DocumentType)),
        allowNull: false,
    },
    documentUrl: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        validate: {
            isUrl: true,
        },
    },
    fileName: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    fileSize: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
        },
    },
    mimeType: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    cloudinaryPublicId: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(DocumentStatus)),
        allowNull: false,
        defaultValue: DocumentStatus.PENDING,
    },
    verificationDetails: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    rejectionReason: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    verifiedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
}, {
    sequelize: connection_1.sequelize,
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
});
Document.belongsTo(User_1.User, {
    foreignKey: "userId",
    as: "user",
});
User_1.User.hasMany(Document, {
    foreignKey: "userId",
    as: "documents",
});
