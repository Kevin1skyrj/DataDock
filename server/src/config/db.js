import { MongoClient } from "mongodb";
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME;
if (!uri) {
  throw new Error("MONGODB_URI is missing from the environment variable");
}
if (!dbName) {
  throw new Error("MONGODB_DB_NAME is missing from the environment variable");
}

const client = new MongoClient(uri);
let database;
export async function connectToDatabase() {
  await client.connect();
  await client.db("admin").command({ ping: 1 });
  database = client.db(dbName);
  console.log(`MongoDB connected: ${dbName}`);
  return database;
}

export function getDatabase(){
    if(!database){
        throw new Error('Database is not Connected');
    }
    return database;
}
export async function closeDatabaseConnection() {
    await client.close();
    database = undefined;
    console.log('MongoDB connection closed');
}