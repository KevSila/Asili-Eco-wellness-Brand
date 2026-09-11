import dotenv from "dotenv";
import { startServer } from "./src/server/index";

dotenv.config();

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
