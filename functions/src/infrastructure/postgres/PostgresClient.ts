import { Client } from "pg";

export function createClient(): Client {
  const { PG_URI } = process.env;

  if (PG_URI === undefined || !PG_URI) {
    console.error(
      "Unable to initialize client due to missing environment variables"
    );
    throw new Error("Missing PG_URI environment variable");
  }

  return new Client({
    connectionString: PG_URI,
  });
}

let ConnectedClient: Client | undefined;

// do not throw an error
export async function PostgresConnectedClient(): Promise<Client | null> {
  try {
    if (!ConnectedClient || ConnectedClient.setMaxListeners) {
      ConnectedClient = createClient();
      await ConnectedClient.connect();
    }
    return ConnectedClient;
  } catch (e) {
    console.debug(`Unable to get Postgres Connected Client.`, e);
    return null;
  }
}
