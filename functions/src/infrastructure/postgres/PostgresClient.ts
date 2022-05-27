import { Client } from "pg";

export function createClient(): Client {
  const { PG_URI } = process.env;

  if (PG_URI === undefined || !PG_URI) {
    console.error("Unable to initialize client due to missing environment variables");
    throw new Error("Missing PG_URI environment variable");
  }

  return new Client({
    connectionString: PG_URI,
  });
}