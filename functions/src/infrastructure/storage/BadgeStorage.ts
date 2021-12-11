import { storage } from "../../config/firebase.config";
import { Bucket } from "@google-cloud/storage";
import IStorage from "../../domain/IStorage";

class BadgeStorage implements IStorage {
  bucketName: string;
  bucket: Bucket;

  constructor() {
    this.bucketName = "badges";
    this.bucket = storage.bucket();
  }

  async put(path: string, file: string): Promise<void> {
    await this.bucket.file(`${this.bucketName}/${path}`).save(file, { resumable: false });
  }

  async get(path: string): Promise<string> {
    return (await this.bucket.file(`${this.bucketName}/${path}`).download())[0].toString();
  }

  async exists(path: string): Promise<boolean> {
    return (await this.bucket.file(`${this.bucketName}/${path}`).exists())[0];
  }
}

const instance = new BadgeStorage();

export default instance;

