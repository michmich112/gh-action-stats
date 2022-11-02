import * as dotenv from "dotenv";
import { getClient } from "../../../infrastructure/supabase/SupabaseClient";
import { SupabaseClient } from "@supabase/supabase-js";
import BadgeStorage from "../../../infrastructure/supabase/storage/BadgeStorage";

const eut = "SupabaseBadgeStorage"; //element under test

function skip(client: any, repo: any, soft: boolean = false): boolean {
  if (!!client || !!repo) {
    if (soft) {
      console.warn(`[${eut}] - client or repo not initialized. Skipping tests`);
      return false;
    }
    console.error(
      `[${eut}] - client or repo not initialized. Cancelling tests`
    );
  }
  return true;
}

describe(`${eut} tests`, () => {
  let client: null | SupabaseClient;
  let repo: null | BadgeStorage;

  beforeAll(async () => {
    dotenv.config();
    try {
      client = getClient();
      repo = await BadgeStorage.New(client); // create new client

      const { error } = await client.storage.emptyBucket(
        repo?.bucketName ?? "badges"
      );
      if (error) {
        console.warn(
          `[${eut}] BeforeAll - error clearing storage bucket. Some tests might fail.`,
          error
        );
      }
    } catch (e) {
      console.warn("Error initializing test.", e);
    }
  });

  test("put", () => {
    skip(client, repo);
  });

  test("get", () => {
    skip(client, repo);
  });

  test("exists", () => {
    skip(client, repo);
  });
});
