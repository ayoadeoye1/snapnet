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
exports.connectDatabase = exports.sequelize = void 0;
const sequelize_1 = require("sequelize");
const config_1 = require("../../configs/config");
exports.sequelize = new sequelize_1.Sequelize(config_1.config.database.url, {
    dialect: "mysql",
    logging: config_1.config.nodeEnv === "development" ? console.log : false,
    pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
    },
});
const connectDatabase = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield exports.sequelize.authenticate();
        console.log("Database connected successfully");
        if (config_1.config.nodeEnv === "development") {
            yield exports.sequelize.sync({ alter: true });
            console.log("Database synchronized");
        }
    }
    catch (error) {
        console.error("Unable to connect to the database:", error);
        throw error;
    }
});
exports.connectDatabase = connectDatabase;
