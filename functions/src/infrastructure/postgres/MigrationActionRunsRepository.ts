import { Client } from "pg";
import ActionRun from "../../domain/ActionRun.type";

import { IPostgresRepostiory } from "../../domain/IRepository";

const tableSchema: string = `
CREATE TABLE IF NOT EXISTS "Runs" (
  "id" BIGSERIAL PRIMARY KEY,
  "action_id" bigint NOT NULL,
  "error_id" bigint,
  "attempt_id" bigint,
  "pulse_repo_id" bigint,
  "github_action" text,
  "github_actor" text NOT NULL,
  "github_ref" text,
  "github_base_ref" text,
  "github_head_ref" text,
  "github_event_name" text NOT NULL,
  "github_repository" text,
  "github_run_id" bigint,
  "github_action_repository" text,
  "package_version" text,
  "execution_time_s" int,
  "execution_time_ns" bigint,
  "ip" text,
  "runner_name" text NOT NULL,
  "runner_os" text NOT NULL,
  "t" timestamp NOT NULL,
  "version" text
);
`;

// const tableConstraints: string = `
// ALTER TABLE "Runs" ADD FOREIGN KEY ("action_id") REFERENCES "Actions" ("id");
// ALTER TABLE "Runs" ADD FOREIGN KEY ("error_id") REFERENCES "RunErrors" ("id");
// ALTER TABLE "Runs" ADD FOREIGN KEY ("attempt_id") REFERENCES "AttemptedRuns" ("id");
// ALTER TABLE "Runs" ADD FOREIGN KEY ("pulse_repo_id") REFERENCES "PulseRepos" ("id");
// `;

export default class MigrationActionRunsRepository
  implements IPostgresRepostiory
{
  tableName: string;
  client: Client;

  private constructor(client: Client) {
    this.tableName = "Runs";
    this.client = client;
  }

  public static async New(
    client: Client
  ): Promise<MigrationActionRunsRepository> {
    const i = new MigrationActionRunsRepository(client);
    await i.mustExec();
    return i;
  }

  /**
   * Any queries that must execute successfully for us to start using the DB
   * Generally used to create the table if it doesn't exist or run migrations on the schema if needed.
   */
  protected async mustExec(): Promise<void> {
    await this.client.query(tableSchema);
    // await this.client.query(tableConstraints);
  }

  public async create(run: {
    actionId: number;
    errorId?: number;
    attemptId?: number;
    pulseRepoId: number;
    run: ActionRun;
  }): Promise<number> {
    const query = `INSERT INTO "${this.tableName}" (
      action_id,
      error_id,
      attempt_id,
      pulse_repo_id,
      github_action,
      github_actor,
      github_ref,
      github_base_ref,
      github_head_ref,
      github_event_name,
      github_repository,
      github_run_id,
      github_action_repository,
      package_version,
      execution_time_s,
      execution_time_ns,
      ip,
      runner_name,
      runner_os,
      t,
      version) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21
      ) RETURNING id;
    `;
    const r = run.run;
    const values = [
      run.actionId,
      run.errorId,
      run.attemptId,
      run.pulseRepoId,
      r.github_action,
      r.github_actor,
      r.github_ref,
      r.github_base_ref,
      r.github_head_ref,
      r.github_event_name,
      r.github_repository,
      r.github_run_id,
      r.github_action_repository,
      r.package_version,
      r.execution_time ? r.execution_time[0] : null,
      r.execution_time ? r.execution_time[1] : null,
      r.ip,
      r.runner_name,
      r.runner_os,
      r.timestamp,
      r.version,
    ];

    const res = await this.client.query(query, values);
    if (res.rowCount < 1) {
      throw new Error("Inserted new run but no ID returned.");
    }
    return res.rows[0].id;
  }
}
