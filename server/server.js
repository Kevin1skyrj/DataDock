import app from "./src/app.js";
import {
  closeDatabaseConnection,
  connectToDatabase,
} from "./src/config/db.js";
import {
  closeRedisConnection,
  connectToRedis,
} from "./src/config/redis.js";
import { verifyS3Connection } from "./src/config/s3.js";
import {
  createUserIndexes,
  migrateUserRoles,
  syncConfiguredOwner,
} from "./src/models/user.model.js";
import { createOtpIndexes } from "./src/models/otp.model.js";
import { createPasswordResetIndexes } from "./src/models/password-reset.model.js";
import { createItemIndexes } from "./src/models/item.model.js";
import { createGoogleDriveIndexes } from "./src/models/google-drive.model.js";
import { createSubscriptionIndexes } from "./src/models/subscription.model.js";
import { logError } from "./src/utils/log-error.js";
const port = process.env.PORT || 4000;
let httpServer;
let shuttingDown = false;

async function shutdown(signal, exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`${signal} received. Shutting down gracefully.`);

  const forceExit = setTimeout(() => {
    console.error("Graceful shutdown timed out");
    process.exit(1);
  }, 10_000);
  forceExit.unref();

  try {
    if (httpServer) {
      await new Promise((resolve, reject) => {
        httpServer.close((error) => (error ? reject(error) : resolve()));
      });
    }

    await Promise.allSettled([
      closeRedisConnection(),
      closeDatabaseConnection(),
    ]);
    process.exit(exitCode);
  } catch (error) {
    logError("Graceful shutdown failed", error);
    process.exit(1);
  }
}

async function startServer() {
  try {
    await connectToDatabase();
    await connectToRedis();
    await verifyS3Connection();
    await createUserIndexes();
    await migrateUserRoles();
    await syncConfiguredOwner();
    await createOtpIndexes();
    await createPasswordResetIndexes();
    await createItemIndexes();
    await createGoogleDriveIndexes();
    await createSubscriptionIndexes();
    httpServer = app.listen(port, () => {
      console.log(`Server started on port ${port}`);
    });
  } catch (error) {
    console.log("Failed to start the server:", error.message);
    process.exit(1);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("uncaughtException", (error) => {
  logError("Uncaught exception", error);
  shutdown("uncaughtException", 1);
});
process.on("unhandledRejection", (error) => {
  logError("Unhandled rejection", error);
  shutdown("unhandledRejection", 1);
});

startServer();
