// import { makeBadge } from "badge-maker";
// import { Client } from "pg";
// import BadgeMetrics from "../domain/BadgeMetrics.type";
// import MigrationBadgesRepository from "../infrastructure/postgres/BadgesRepository";
// import MigrationBadgeViewsRepository from "../infrastructure/postgres/BadgeViewsRepository";
// import MigrationActionRunsRepository from "../infrastructure/postgres/MigrationActionRunsRepository";
// import { PostgresConnectedClient } from "../infrastructure/postgres/PostgresClient";
//
// type GetBadgeOperationParams = {
//   creator: string;
//   name: string;
//   metric: BadgeMetrics;
// };
//
// type GetBadgeOperationReturn =
//   | { error: Error }
//   | { badgeId: number; url: string; outdated: boolean }
//   | {
//       badgeId: string;
//       raw: string;
//       outdated?: boolean;
//     };
//
// const opName = "GetBadgeOperation";
//
// export default async function GetBadgeOperation({
//   creator,
//   name,
//   metric,
// }: GetBadgeOperationParams): Promise<GetBadgeOperationReturn> {
//   console.log(`[${opName}] START - New Request for`, { creator, name, metric });
//   // start client
//   const client = await PostgresConnectedClient();
//   if (!client) {
//     console.error("Unable to connect to persistance");
//     console.log(`[${opName}] END - Error`);
//     return { error: new Error("Unable to connect to persistance") };
//   }
//
//   const badgeRepo = await MigrationBadgesRepository.New(client);
//
//   let badge;
//   try {
//     badge = await badgeRepo.getBadge({
//       actionId: { creator, name },
//       metric,
//     });
//   } catch (e) {
//     console.warn(`[${opName}] Did not find badge`);
//   }
//
//   try {
//     if (!badge) {
//       //const raw = await ({ actionId: 1, metric });// create badge
//       const ret = {
//         raw: "",
//         outdated: true, // set outdated to create job for updating the badge
//       };
//       console.log(`[${opName}] END - Returned Raw Badge:`, ret);
//
//       return ret;
//     } else {
//       const accurate = await badgeRepo.isBadgeAccurate({
//         creator,
//         name,
//         metric,
//       });
//       const ret = {
//         url: badge.publicUri,
//         outdated: !accurate, // if its not accurate, its outdated
//       };
//       console.log(`[${opName}] END - returning existing badge:`, ret);
//       return ret;
//     }
//   } catch (e) {
//     console.error(`[${opName}] Error - Error refreshing badge`, e);
//     return { error: e as Error };
//   }
// }
//
// type metricBadgeDefinition = {
//   name: BadgeMetrics;
//   label: string;
//   color: string | ((value: number | string) => string);
//   query: string;
//   params: string[];
//   value: string;
// };
//
// const metrics: metricBadgeDefinition[] = [
//   {
//     name: "runs",
//     label: "Runs",
//     color: "green",
//     query: `SELECT count(*) as runs FROM "ActionRuns" WHERE action_id = $1;`,
//     params: ["actionId"],
//     value: "runs",
//   },
//   {
//     name: "runs-per-month",
//     label: "Runs Per Month",
//     color: "green",
//     query: `SELECT `,
//     params: ["actionId"],
//     value: "runs",
//   },
//   {
//     name: "repos",
//     label: "Repos",
//     color: "green",
//     query: `SELECT count(distinct(pulse_repo_id)) as repos FROM "Runs" WHERE action_id = $1;`,
//     params: ["actionId"],
//     value: "repos",
//   },
// ];
//
// export async function computeBadgeMetrics(
//   metric: BadgeMetrics,
//   client: Client,
//   metricParams: object
// ): Promise<string> {
//   const metricDef = metrics.find((m) => m.name === metric);
//   if (!metricDef) {
//     console.error(
//       `[computeBadgeMetrics] Error - No definition for metric ${metric}`
//     );
//     throw new Error(`No definition for metric ${metric}`);
//   }
//
//   // validate passed parameters
//   if (
//     metricDef.params.filter((p) => Object.keys(metricParams).includes(p))
//       .length != +metricDef.params.length
//   )
//     throw new Error(`Not all required parameters have been passed`);
//
//   const params = metricDef.params.map(
//     (p) => metricParams[p as keyof typeof metricParams]
//   );
//   const res = await client.query(metricDef.query, params);
//   if (res.rowCount < 1) {
//     console.error(
//       `[computeBadgeMetrics] Error - No row returned from metric query.`
//     );
//   }
//   const value = res.rows[0]?.[metricDef.value] ?? 0; // default value of 0;
//   const color =
//     typeof metricDef.color === "string"
//       ? metricDef.color
//       : metricDef.color(value);
//
//   const badge = makeBadge({
//     label: metricDef.label,
//     color,
//     message: value.toString(),
//   });
//   return badge;
// }
//
// // export async function getRawBadge();
//
// export async function RefreshBadge({
//   actionId,
//   metric,
// }: {
//   actionId: number;
//   metric: BadgeMetrics;
// }): Promise<string> {
//   return "";
// }
