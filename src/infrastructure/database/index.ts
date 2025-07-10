import { sequelize, connectDatabase } from "./connection";
import "../../domain/entities";

export { sequelize, connectDatabase };
export * from "../../domain/entities";
