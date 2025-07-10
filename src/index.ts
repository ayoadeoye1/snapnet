import app, { initializeServices } from "./app";
import { config } from "./configs/config";
import { documentWorker } from "./workers/documentWorker";

const PORT = config.port;

const startServer = async () => {
  try {
    await initializeServices();

    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`API Documentation: http://localhost:${PORT}/api/v1/docs`);
    });

    await documentWorker.start();

    process.on("SIGTERM", async () => {
      console.log("SIGTERM received, shutting down gracefully");
      await documentWorker.stop();
      server.close(() => {
        console.log("Server closed");
        process.exit(0);
      });
    });

    process.on("SIGINT", async () => {
      console.log("SIGINT received, shutting down gracefully");
      await documentWorker.stop();
      server.close(() => {
        console.log("Server closed");
        process.exit(0);
      });
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
