import { MongoClient, type Db } from "mongodb";
import { getConfig } from "./env.js";

let client: MongoClient | null = null;
let db: Db | null = null;

export async function getDb(): Promise<Db> {
  if (db) return db;

  const env = getConfig();
  client = new MongoClient(env.MDB_MCP_CONNECTION_STRING, {
    appName: "sportscertify-social",
  });
  await client.connect();
  db = client.db(env.MDB_DATABASE_NAME);

  await db.command({ ping: 1 });
  return db;
}

export function getClient(): MongoClient {
  if (!client) {
    throw new Error("MongoClient not initialised — call getDb() first.");
  }
  return client;
}

export async function closeDb(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}
