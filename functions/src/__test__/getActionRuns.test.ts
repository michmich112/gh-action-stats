import ActionRun from "../domain/ActionRun.type";
import User from "../domain/User.type";
import { CallableContext } from "firebase-functions/v1/https";
import { getActionRunsEntrypoint } from "../entrypoints/firebase/getActionRuns";
import * as functions from "firebase-functions";

jest.mock("../infrastructure/github/GitHubUserApi");
jest.mock("../config/firebase.config");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { firestore } = require("../config/firebase.config");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { isRepoAccessible } = require("../infrastructure/github/GitHubUserApi");

describe("getActionRuns test", () => {
  const usersDbData: { [key: string]: User } = {
    "1234": {
      uid: "1234",
      username: "TestUser1",
      email: "test.user.1@mail.com",
      avatar_url: "http://avatarurl.com/testuser1",
      name: "TheFirstTestUser",
    },
  };

  const runTimestamp: string = new Date().toISOString();

  const actionRunsDbData: { [key: string]: ActionRun } = {
    "0001": {
      creator: "TestUser1",
      github_action: null,
      github_actor: "Actor1",
      github_base_ref: null,
      github_head_ref: null,
      github_ref: null,
      github_repository: "TestUser1/repository1",
      github_run_id: null,
      ip: "123.123.123.123",
      name: "Action1",
      runner_os: "Linux",
      timestamp: runTimestamp,
      version: "master",
      github_event_name: "push",
      execution_time: [1, 10000],
      runner_name: "GithubActions",
      error: null,
    },

    "0002": {
      creator: "TestUser1",
      github_action: null,
      github_actor: "Actor2",
      github_base_ref: null,
      github_head_ref: null,
      github_ref: null,
      github_repository: "TestUser1/repository2",
      github_run_id: null,
      ip: "123.123.123.123",
      name: "Action1",
      runner_os: "Linux",
      timestamp: runTimestamp,
      version: "master",
      github_event_name: "pull_request",
      execution_time: [2, 200],
      runner_name: "GithubActions",
      error: null,
    },

    "0003": {
      creator: "TestUser1",
      github_action: null,
      github_actor: "Actor2",
      github_base_ref: null,
      github_head_ref: null,
      github_ref: null,
      github_repository: "PrivateUser/private1",
      github_run_id: null,
      ip: "123.123.123.123",
      name: "Action1",
      runner_os: "Linux",
      timestamp: runTimestamp,
      version: "master",
      github_event_name: "pull_request",
      execution_time: [2, 200],
      runner_name: "GithubActions",
      error: null,
    },
  };

  const collections: { [key: string]: any } = {
    users: usersDbData,
    runs: actionRunsDbData,
  };

  firestore.collection.mockImplementation((cn: string) => {
    let collection: any = collections[cn] || {};

    function where(field: string, comparator: string, value: string) {
      collection = Object.values(collection).filter((e: any) => {
        if (comparator === "==") return (e[field] as any) === value;
        return false;
      });

      return {
        empty: !collection,
        where,
        get: async () => {
          const docs = collection.map((d: any) => ({
            data: () => d,
          }));
          return {
            empty: docs.length === 0,
            forEach: (predicate: (e: any, i: number, a: any[]) => void) =>
              docs.forEach(predicate),
            docs,
          };
        },
      };
    }

    return {
      where,
      doc: (dn: string) => ({
        get: async () => ({
          empty: !collection[dn],
          data: () => collection[dn],
        }),
      }),
    };
  });

  isRepoAccessible.mockImplementation(
    async (token: string, owner: string, repo: string): Promise<boolean> => {
      return !(
        token === "1234" &&
        owner === "PrivateUser" &&
        repo === "private1"
      );
    }
  );

  test("it should return the queried data if it exists", async () => {
    const runs = await getActionRunsEntrypoint(
      {
        creator: "TestUser1",
        action: "Action1",
        token: "1234",
      },
      { auth: { uid: "1234" } } as CallableContext
    );
    expect(runs.length).toEqual(3);
    expect(runs).toEqual([
      {
        actor: "Actor1",
        ip: "123.123.123.123",
        os: "Linux",
        timestamp: runTimestamp,
        repository: "TestUser1/repository1",
        event: "push",
        execution_time: [1, 10000],
        error: null,
        is_private: false,
      },
      {
        actor: "Actor2",
        ip: "123.123.123.123",
        os: "Linux",
        timestamp: runTimestamp,
        repository: "TestUser1/repository2",
        event: "pull_request",
        execution_time: [2, 200],
        error: null,
        is_private: false,
      },
      {
        actor: "Actor2",
        repository: "PrivateUser/-1159492850",
        ip: "123.123.123.123",
        os: "Linux",
        timestamp: runTimestamp,
        event: "pull_request",
        execution_time: [2, 200],
        error: null,
        is_private: true,
      },
    ]);
  });

  test("it should return an empty array if no data exists", async () => {
    const runs = await getActionRunsEntrypoint(
      {
        token: "1234",
        creator: "TestUser1",
        action: "Action2",
      },
      { auth: { uid: "1234" } } as CallableContext
    );
    expect(runs.length).toEqual(0);
    expect(runs).toEqual([]);
  });

  test("it should return an unauthorized error if the user is not authenticated", async () => {
    try {
      await getActionRunsEntrypoint(
        {
          token: "1234",
          creator: "TestUser1",
          action: "Action1",
        },
        { auth: { uid: "" } } as CallableContext
      );
      expect(false).toBe(true);
    } catch (e) {
      expect(e).toHaveProperty("code");
      expect((e as functions.https.HttpsError).code).toBe("unauthenticated");
    }
  });

  test("it should return an forbidden error if the user is not authorized", async () => {
    try {
      await getActionRunsEntrypoint(
        {
          token: "1234",
          creator: "InvalidUser1",
          action: "Action1",
        },
        { auth: { uid: "1234" } } as CallableContext
      );
    } catch (e) {
      expect(e).toHaveProperty("code");
      expect((e as functions.https.HttpsError).code).toBe("permission-denied");
      return;
    }
    expect(false).toBe(true);
  });
});
