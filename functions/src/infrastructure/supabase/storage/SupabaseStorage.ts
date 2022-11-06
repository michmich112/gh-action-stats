import { SupabaseClient } from "@supabase/supabase-js";
import IStorage from "../../../domain/IStorage";

export abstract class SupabaseStorage implements IStorage {
  public bucketName: string;
  private _bucketName: string;
  private _className: string;
  private _client: SupabaseClient;
  private _public: boolean;

  constructor(
    supabaseClient: SupabaseClient,
    bucketName: string,
    className: string,
    isPublic: boolean
  ) {
    this._bucketName = bucketName;
    this.bucketName = bucketName;
    this._className = className;
    this._client = supabaseClient;
    this._public = isPublic;
  }

  // public static async New<T extends SupabaseStorage>(client: SupabaseClient): Promise<T>;

  /**
   * @throws {Error} if the bucket doesn't exist and we are unable to create it.
   * @returns {Promise<void>}
   */
  protected async configure(): Promise<void> {
    const { error } = await this._client.storage.getBucket(this._bucketName);
    if (!!error) {
      // error detected so we will attempt to create the bucket
      const { error } = await this._client.storage.createBucket(
        this._bucketName,
        { public: this._public }
      );
      if (!!error) {
        const message = `[${this._className}][configure] Error - Bucket with name ${this._bucketName} doesn't exists and unable to create it.`;
        console.error(message, error);
        throw new Error(message);
      }
    }
  }

  async put(path: string, file: string): Promise<void> {
    if (!this.isValidPath(path))
      throw new Error(
        `[${this._className}][put] Error - Path ${path} does not match expected form.`
      );
    const { error } = await this._client.storage
      .from(this._bucketName)
      .upload(path, file, {
        upsert: true,
      });
    if (!!error) {
      const message = `[${this._className}][put] Error - Error uploading file to path ${path} to bucket ${this._bucketName}.`;
      console.error(message, error);
      throw new Error(message);
    }
  }

  public async get(path: string): Promise<string> {
    if (!this.isValidPath(path))
      throw new Error(
        `[${this._className}][get] Error - Path ${path} does not match expected form.`
      );
    const { data, error } = await this._client.storage
      .from(this._bucketName)
      .download(path);
    if (!!error) {
      const message = `[${this._className}][get] Error - Error downloading file from path ${path} from bucket ${this._bucketName}.`;
      console.error(message, error);
      throw new Error(message);
    }
    const val = await data?.text();
    if (!!val)
      console.warn(
        `[${this._className}][get] Warn - No text content from uploaded file`
      );
    return val ?? "";
  }

  public async exists(path: string): Promise<boolean> {
    if (!this.isValidPath(path)) {
      console.error(
        `[${this._className}][exists] Error - Path ${path} does not match expected form.`
      );
      return false;
    }

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
      const message = `[${this._className}][exists] Error - error listing file with dir ${dir} and file name ${file}.`;
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
        `[${this._className}][getPublicUrl] Error -  Cannot get public url for element in non public bucket ${this._bucketName}`
      );
    if (!this.isValidPath(path))
      throw new Error(
        `[${this._className}][getPublicUrl] Error - Path ${path} does not match expected form`
      );
    if (!(await this.exists(path)))
      throw new Error(
        `[${this._className}][getPublicUrl] Error - File with ${path} does not exist`
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
        const message = `[${this._className}][getPublicUrl] Error - Unable to get signed url for file in bucket ${this._bucketName} with path ${path}`;
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
