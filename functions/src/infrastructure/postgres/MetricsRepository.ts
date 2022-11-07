import { Client } from "pg";
import { IPostgresRepostiory } from "../../domain/IRepository";

const tableSchema: string = `
CREATE TABLE IF NOT EXISTS "MetricDefinitions" (
  "metric" TEXT PRIMARY KEY,
  "query" TEXT NOT NULL,
  "parameters" TEXT[] NOT NULL,
  "return_column" TEXT
);
`;

const metricDefinitions: string = `
INSERT INTO "MetricDefinitions" (metric, query, parameters, return_column) VALUES (
  'runs', 'SELECT count(*) as runs FROM "Runs" WHERE action_id = $1 AND attempt_id IS NULL;', '{"actionId"}', 'runs'
) ON CONFLICT DO NOTHING;
`;

export default class MigrationMetricsRepository implements IPostgresRepostiory {
  tableName: string;
  client: Client;

  private constructor(client: Client) {
    this.tableName = "MetricDefinitions";
    this.client = client;
  }

  public static async New(client: Client): Promise<MigrationMetricsRepository> {
    const i = new MigrationMetricsRepository(client);
    await i.mustExec();
    return i;
  }

  protected async mustExec(): Promise<void> {
    await this.client.query(tableSchema);
    await this.client.query(metricDefinitions);
  }

  public async metricExists(metric: string): Promise<boolean> {
    try {
      const res = await this.getMetricDefinition(metric);
      return res.metric === metric;
    } catch {
      // log error if wanted
      return false;
    }
  }

  /**
   * This is a pretty unsafe way to do this since the tables may no exists, this may throw errors
   */
  public async computeMetric(
    metric: string,
    params: object
  ): Promise<string | number> {
    const metricDef = await this.getMetricDefinition(metric);

    const p = metricDef.parameters;
    if (p.filter((v) => Object.keys(params).includes(v)).length < p.length) {
      const message = `[MetricsRepository][computeMetric] Error - Not all required parameters were passed. Expected ${p}, received ${params}`;
      throw new Error(message);
    }

    const parameters = p.map((v) => params[v as keyof typeof params]);
    const res = await this.client.query(metricDef.query, parameters);
    if (res.rowCount < 1) {
      const message = `[MetricsRepository][computeMetric] Error - No values returned when computing metric ${metric}`;
      throw new Error(message);
    }
    const val = res.rows[0][metricDef.return_column];

    if (val === null || val === undefined)
      throw new Error(
        `[MetricsRepository][computeMetric] Error - No values returned when computing metric ${metric}`
      );
    return val;
  }

  private async getMetricDefinition(metric: string): Promise<metricDefinition> {
    const query = `SELECT * FROM "${this.tableName}" WHERE metric = $1`;
    const res = await this.client.query(query, [metric]);
    if (res.rowCount < 1) {
      throw new Error(`No metric definition for metric ${metric}`);
    }
    return res.rows[0] as metricDefinition;
  }
}

type metricDefinition = {
  metric: string;
  query: string; // make sure to typecast if necessary in the query
  parameters: string[];
  return_column: string;
};
