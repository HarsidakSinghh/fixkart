import { MongoClient } from "mongodb";

const uri = process.env.DATABASE_URL ?? "";

if (!uri) {
  throw new Error("DATABASE_URL is not set");
}

let client: MongoClient | null = null;

export async function getMongoClient() {
  if (client) return client;
  client = new MongoClient(uri);
  await client.connect();
  return client;
}

export async function getMongoDb() {
  const client = await getMongoClient();
  // Default DB name is in the connection string
  return client.db();
}
