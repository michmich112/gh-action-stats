import { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseStorage } from "./SupabaseStorage";

export class BadgeStorage extends SupabaseStorage {
  private constructor(supabaseClient: SupabaseClient) {
    super(supabaseClient, "badges", "SupabaseBadgeStorage", true);
  }

  public static async New(client: SupabaseClient): Promise<BadgeStorage> {
    const s = new BadgeStorage(client);
    await s.configure();
    return s;
  }
}

export default BadgeStorage;
