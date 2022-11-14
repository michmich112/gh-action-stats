import { RefreshBadgeOperation } from "../../operations/MigrationRefreshBadgeOperation";

export async function worker(event: any) {
  for (const message of event.Records) {
    try {
      await RefreshBadgeOperation(JSON.parse(message.body));
    } catch (e) {
      console.error(
        `RefreshBadgeOperation Error.\nParameters: ${message.body}\nError:`,
        e
      );
    }
  }
}
