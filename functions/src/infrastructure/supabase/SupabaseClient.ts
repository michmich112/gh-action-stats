import {
  createClient as createSupabaseClient,
  SupabaseClient,
} from "@supabase/supabase-js";

let client: null | SupabaseClient;

export function getClient(): SupabaseClient {
  const { SUPABASE_URL, SUPABASE_KEY } = process.env;
  if (SUPABASE_URL === undefined || !SUPABASE_URL) {
    console.error(
      "Unable to initialize Supabase Client due to missin SUPABASE_URL environment variable"
    );
    throw new Error("Missing SUPABASE_URL environment variable");
  }

  if (SUPABASE_KEY === undefined || !SUPABASE_KEY) {
    console.error(
      "Unable to initialize Supabase Client due to missin SUPABASE_KEY environment variable"
    );
    throw new Error("Missing SUPABASE_KEY environment variable");
  }

  if (!client) {
    client = createSupabaseClient(SUPABASE_URL, SUPABASE_KEY);
  }

  return client;
}
