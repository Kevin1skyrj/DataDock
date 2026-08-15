import { ObjectId } from "mongodb";
const devOwnerId = process.env.DEV_OWNER_ID;
if (process.env.NODE_ENV === "production") {
  throw new Error("Development-user middleware cannot run in production");
}
if (!devOwnerId) {
  throw new Error("DEV_OWNER_ID is missing in environment variable");
}
if (!ObjectId.isValid(devOwnerId)) {
  throw new Error("DEV_OWNER_ID must be a valid MongoDB ObjectId");
}

const developmentUserId = new ObjectId(devOwnerId);
export function attachDevelopmentUser(req, res, next) {
  req.user = {
    id: developmentUserId,
  };
  next();
}
