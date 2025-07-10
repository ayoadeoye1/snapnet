import { Sequelize } from "sequelize";
import { config } from "../../configs/config";

export const sequelize = new Sequelize(config.database.url, {
  dialect: "mysql",
  logging: config.nodeEnv === "development" ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

export const connectDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log("Database connected successfully");

    if (config.nodeEnv === "development") {
      await sequelize.sync({ alter: true });
      console.log("Database synchronized");
    }
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    throw error;
  }
};
 