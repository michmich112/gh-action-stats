import IStorage from "../../../domain/IStorage";
import { SupabaseClient } from "@supabase/supabase-js";

export class BadgeStorage implements IStorage {
  bucketName: string;
  private _bucketName: string;
  private _client: SupabaseClient;
  private _public: boolean;

  private constructor(supabaseClient: SupabaseClient) {
    this._bucketName = "badges";
    this.bucketName = this._bucketName;
    this._client = supabaseClient;
    this._public = true;
  }

  public static async New(client: SupabaseClient): BadgeStorage {
    const s = new BadgeStorage(client);
    await s.configure();
    return s;
  }

  /**
   * @throws {Error} if the bucket doesn't exist and we are unable to create it.
   * @returns {Promise<void>}
   */
  private async configure(): Promise<void> {
    const { error } = await this._client.storage.getBucket(this._bucketName);
    if (!!error) {
      // error detected so we will attempt to create the bucket
      const { error } = await this._client.storage.createBucket(
        this._bucketName,
        { public: this._public }
      );
      if (!!error) {
        const message = `[SupabaseBadgeStorage][configure] Error - Bucket with name ${this._bucketName} doesn't exists and unable to create it.`;
        console.error(message, error);
        throw new Error(message);
      }
    }
  }

  async put(path: string, file: string): Promise<void> {
    if (!this.isValidPath(path))
      throw new Error(
        `[SupabaseBadgeStorage][put] Error - Path ${path} does not match expected form.`
      );
    const { error } = await this._client.storage
      .from(this._bucketName)
      .upload(path, file, {
        upsert: true,
      });
    if (!!error) {
      const message = `[SupabaseBadgeStorage][put] Error - Error uploading file to path ${path} to bucket ${this._bucketName}.`;
      console.error(message, error);
      throw new Error(message);
    }
  }

  async get(path: string): Promise<string> {
    if (!this.isValidPath(path))
      throw new Error(
        `[SupabaseBadgeStorage][get] Error - Path ${path} does not match expected form.`
      );
    const { data, error } = await this._client.storage
      .from(this._bucketName)
      .download(path);
    if (!!error) {
      const message = `[SupabaseBadgeStorage][get] Error - Error downloading file from path ${path} from bucket ${this._bucketName}.`;
      console.error(message, error);
      throw new Error(message);
    }
    const val = await data?.text();
    if (!!val)
      console.warn(
        `[SupabaseBadgeStorage][get] Warn - No text content from uploaded file`
      );
    return val ?? "";
  }

  async exists(path: string): Promise<boolean> {
    if (!this.isValidPath(path))
      throw new Error(
        `[SupabaseBadgeStorage][exists] Error - Path ${path} does not match expected form.`
      );

    // maybe should use the path module
    const dir_match = path.match(/^[a-zA-Z0-9\-\_\/]*\//g);
    const dir: string =
      !dir_match || dir_match.length === 0 ? "" : dir_match[0]; // get the directory structure for the file
    const file_match = path.match(/[a-zA-Z0-9\-\_.]*$/g);
    const file: string =
      !file_match || file_match.length === 0 ? "" : file_match[0]; // get the file name from the path

    const { data, error } = await this._client.storage
      .from(this._bucketName)
      .list(dir, {
        search: file,
      });

    if (!!error || !data) {
      const message = `[SupabaseBadgeStorage][exists] Error - error listing file with dir ${dir} and file name ${file}.`;
      console.error(message, error);
      return false;
    }
    return data.length === 1; // there should only be one file that matches
  }

  /**
   * Get the Public Url for a file in the bucket
   * @param path {string} Path to the file in the bucket
   * @param ttl {?number} validity time for the url in seconds (will be always valid for no ttl or any ttl less than or equal to 0)
   * @emits error {Error} Emits an error if the path is invalid (no file exists) or if the infrastructure is unavailable
   * @returns url {string} returns a public uri to the file with given ttl
   */
  async getPublicUrl(path: string, ttl?: number): Promise<string> {
    if (!this._public)
      throw new Error(
        `[SupabaseBadgeStorage][getPublicUrl] Error -  Cannot get public url for element in non public bucket ${this._bucketName}`
      );
    if (!this.isValidPath(path))
      throw new Error(
        `[SupabaseBadgeStorage][getPublicUrl] Error - Path ${path} does not match expected form`
      );

    if (!ttl || ttl <= 0) {
      const { data } = this._client.storage
        .from(this._bucketName)
        .getPublicUrl(path);
      return data.publicUrl;
    } else {
      const { data, error } = await this._client.storage
        .from(this._bucketName)
        .createSignedUrl(path, ttl);
      if (!!error || !data) {
        const message = `[SupabaseBadgeStorage][getPublicUrl] Error - Unable to get signed url for file in bucket ${this._bucketName} with path ${path}`;
        console.error(message, error, "Data: ", data);
        throw new Error(message);
      }

      return data.signedUrl;
    }
  }

  private isValidPath(path: string): boolean {
    const match = path.match(
      /^[a-zA-Z0-9\-\_\/]*[a-zA-Z0-9\-\_.]+\.[a-zA-Z0-9\-\_]+$/g
    );
    return !!match && match.length === 1 && match[0] === path;
  }
}

export default BadgeStorage;
