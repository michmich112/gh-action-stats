import { Client } from "pg";

interface IFirestoreRepository {
  collection: string
}

export interface IPostgresRepostiory {
  tableName: string
  client: Client
}

export default IFirestoreRepository;

