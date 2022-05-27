import { Client } from "pg";
import ActionRun from "../../domain/ActionRun.type";
import { IPostgresRepostiory } from "../../domain/IRepository";

class ActionRunRepository implements IPostgresRepostiory {
  tableName: string;
  client: Client;

  constructor(client: Client) {
    this.tableName = "runs";
    this.client = client;
  }

  public async create(run: ActionRun): Promise<void> {
    const query = `INSERT INTO ${this.tableName} (
      creator, 
      github_action,
      github_actor,
      github_base_ref,
      github_head_ref,
      github_ref,
      github_repository,
      github_run_id,
      github_event_name,
      ip,
      name,
      runner_os,
      runner_name,
      timestamp,
      version,
      execution_time,
      error_name,
      error_message) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18
      );`

    const values = [
      run.creator,
      run.github_action,
      run.github_actor,
      run.github_base_ref,
      run.github_head_ref,
      run.github_ref,
      run.github_repository,
      run.github_run_id,
      run.github_event_name,
      run.ip,
      run.name,
      run.runner_os,
      run.runner_name,
      run.timestamp,
      run.version,
      run.execution_time,
      run.error?.name,
      run.error?.message
    ];

    await this.client.query(query, values);
  }

  public async getByCreatorAndName(creator: string, name: string): Promise<ActionRun[]> {
    const query = `SELECT * FROM ${this.tableName} WHERE creator = $1 AND name = $2 ORDER BY timestamp DESC;`;
    const values = [creator, name];

    const res = await this.client.query<PostgresActionRun>(query, values);

    return res.rows.map<ActionRun>((v: PostgresActionRun):ActionRun => ({
      creator: v.creator,
      github_action: v.github_action,
      github_actor: v.github_actor,
      github_base_ref: v.github_base_ref,
      github_head_ref: v.github_head_ref,
      github_ref: v.github_ref,
      github_repository: v.github_repository,
      github_run_id: v.github_run_id,
      github_event_name: v.github_event_name,
      ip: v.ip,
      name: v.name,
      runner_os: v.runner_os,
      runner_name: v.runner_name,
      timestamp: v.timestamp,
      version: v.version,
      execution_time: v.execution_time,
      error: v.error_name && v.error_message ? {
        name: v.error_name,
        message: v.error_message,
      } : null,
    }))

  }
}

type PostgresActionRun = {
  creator: string,
  github_action: string | null,
  github_actor: string | null,
  github_base_ref: string | null,
  github_head_ref: string | null,
  github_ref: string | null,
  github_repository: string | null,
  github_run_id: string | null,
  github_event_name: string | null,
  ip: string,
  name: string,
  runner_os: string | null,
  runner_name: string | null,
  timestamp: string,
  version: string,
  execution_time: [number, number] | null, // uses process.hrtime
  error_name: string | null,
  error_message: string | null,
}