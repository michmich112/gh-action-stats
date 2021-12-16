interface IStorage {

  bucketName: string;

  /**
   * Put a file to storage, will overwrite file if it already exists.
   * @param {string} path path to the file on the storage
   * @param {string} file File to store in the bucket
   * @return {Promise<void>}
   */
  put(path: string, file: string): Promise<void>;

  /**
   * Retreive a file from storage
   * @param {string} path path to the file to retreive
   * @return {Promise<string>}
   */
  get(path: string): Promise<string>;

  /**
   * Verify if a file exists at the specified path
   * @param {string} path path in the bucket we want to validate the existance
   * of a file
   * @return {Promise<boolean>}
   */
  exists(path: string): Promise<boolean>;
}

export default IStorage;

