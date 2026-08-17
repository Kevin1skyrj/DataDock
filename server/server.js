import app from "./src/app.js";
import { connectToDatabase } from "./src/config/db.js";
import { connectToRedis } from "./src/config/redis.js";
import { verifyS3Connection } from "./src/config/s3.js";
import {
  createUserIndexes,
  migrateUserRoles,
  syncConfiguredOwner,
} from "./src/models/user.model.js";
import { createOtpIndexes } from "./src/models/otp.model.js";
import { createPasswordResetIndexes } from "./src/models/password-reset.model.js";
import { createItemIndexes } from "./src/models/item.model.js";
const port = process.env.PORT || 4000;

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
    app.listen(port, () => {
      console.log(`Server started on port ${port}`);
    });
  } catch (error) {
    console.log("Failed to start the server:", error.message);
    process.exit(1);
  }
}
startServer();
