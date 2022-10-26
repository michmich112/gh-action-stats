import { ActionRun } from "../domain/ActionRun.type";
import { isGithubActionsAddress } from "../utils/githubUtils";
import { PostgresConnectedClient } from "../infrastructure/postgres/PostgresClient";
import MigrationAttemptedRunRepository from "../infrastructure/postgres/AttemptedRunRepository";
import MigrationActionRepository from "../infrastructure/postgres/MigrationActionsRepository";
import MigrationActionRunsRepository from "../infrastructure/postgres/MigrationActionRunsRepository";
import MigrationRunErrorsRepository from "../infrastructure/postgres/RunErrorsRepository";
import MigrationPulseRepoRepository from "../infrastructure/postgres/PulseReposRepository";

enum AttemptReason {
  InvalidIP = 1,
  UnableToGetIP,
}

type AttempInfoParams = {
  reason: AttemptReason;
  message?: string;
  error?: Error;
};

class AttemptInfo {
  private _reason: AttemptReason;
  private _message?: string;
  private _error?: string;

  constructor({ reason, message, error }: AttempInfoParams) {
    this._reason = reason;
    this._message = message;
    if (error) this.error = error; // Use Setter
  }

  set reason(reason: AttemptReason) {
    this._reason = reason;
  }

  set message(message: string) {
    this._message = message;
  }

  set error(error: Error) {
    this._error = error.message;
  }

  public toString(): string {
    return (
      `[${AttemptReason[this._reason]}] ${
        this._message ? "- " + this._message : ""
      }` + `${this._error ? "\nError: " + this._error : ""}`
    );
  }
}

/**
 * Collects the action run data and persists it
 * This implementation is dependent on the infrastructure (made to optimize serverless functions)
 */
export async function CollectActionRun(runData: ActionRun): Promise<void> {
  const client = await PostgresConnectedClient();
  if (!client) {
    console.error("Unable to connect to persistance");
    return;
  }

  try {
    const { creator, name, ip } = runData;
    let attempt;
    try {
      const fromGh = await isGithubActionsAddress(ip);
      if (!fromGh) {
        attempt = new AttemptInfo({
          reason: AttemptReason.InvalidIP,
          message: `Action Data was sent from a non Github Actions IP: ${ip}.`,
        });
      }
    } catch (e) {
      // log error
      attempt = new AttemptInfo({
        reason: AttemptReason.UnableToGetIP,
        message: `Unable to validate IP origin for IP: ${ip}.`,
        error: e,
      });
    }

    // start transaction
    await client.query("BEGIN");
    // Add attempted run if there is one needed
    let attemptId = undefined;
    if (!!attempt) {
      const AttemptedRunRepo = await MigrationAttemptedRunRepository.New(
        client
      );
      attemptId = await AttemptedRunRepo.create({
        reason: attempt.toString(),
      });
    }

    let errorId = undefined;
    if (!!runData.error) {
      const RunErrorsRepo = await MigrationRunErrorsRepository.New(client);
      errorId = await RunErrorsRepo.create(runData.error);
    }

    const [PulseRepo, ActionsRepo] = await Promise.all([
      MigrationPulseRepoRepository.New(client),
      MigrationActionRepository.New(client),
    ]);

    const [pulseRepo, action] = await Promise.all([
      PulseRepo.getFromGithubRepositoryString(
        runData.github_repository || "unset/unset"
      ), // Maybe I should make this an attempt
      ActionsRepo.upsert({
        creator,
        name,
        timestamp: runData.timestamp,
      }),
    ]);

    // Order matters if the tables have not been created yet
    const RunsRepo = await MigrationActionRunsRepository.New(client);
    await RunsRepo.create({
      actionId: action.id,
      errorId,
      attemptId,
      pulseRepoId: pulseRepo.id,
      run: runData,
    });

    await client.query("COMMIT");
  } catch (e) {
    console.error(
      "Error persiting collected action run: ",
      e,
      "\nRaw ActionRun:\n",
      runData
    );
    await client.query("ROLLBACK");
  } finally {
    await client.end();
  }
}
