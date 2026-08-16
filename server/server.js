import app from "./src/app.js";
import { connectToDatabase } from "./src/config/db.js";
import { createUserIndexes } from "./src/models/user.model.js";
import { createSessionIndexes } from "./src/models/session.model.js";
import { createOtpIndexes } from "./src/models/otp.model.js";
const port = process.env.PORT || 4000;

async function startServer() {
  try {
    await connectToDatabase();
    await createUserIndexes();
    await createSessionIndexes();
    await createOtpIndexes();
    app.listen(port, () => {
      console.log(`Server started on port ${port}`);
    });
  } catch (error) {
    console.log("Failed to start the server:", error.message);
    process.exit(1);
  }
}
startServer();
