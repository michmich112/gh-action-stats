import User from "../domain/User.type";
import { CallableContext } from "firebase-functions/v1/https";
import * as functions from "firebase-functions";
import { getActionEntrypoint } from "../entrypoints/firebase/getAction";

jest.mock("../config/firebase.config");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { firestore } = require("../config/firebase.config");

describe("getAction test", () => {
  const actionLastUpdate = new Date();
  const actionsDbData: { [key: string]: any } = {
    "TestUser1:TestAction1": {
      creator: "TestUser1",
      name: "TestAction1",
      last_update: actionLastUpdate,
      badges: {
        last_update: new Date(0).toISOString(),
        is_updating: false,
      },
    },
  };

  const usersDbData: { [key: string]: User } = {
    "1234": {
      uid: "1234",
      username: "TestUser1",
      email: "test.user.1@mail.com",
      avatar_url: "http://avatarurl.com/testuser1",
      name: "TheFirstTestUser",
    },
  };

  const collections: { [key: string]: any } = {
    users: usersDbData,
    actions: actionsDbData,
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

  /* ------ SETUP END ------- */
  test("it should return the queried data if it exists", async () => {
    const action = await getActionEntrypoint(
      {
        creator: "TestUser1",
        action: "TestAction1",
      },
      { auth: { uid: "1234" } } as CallableContext
    );
    expect(action).toEqual({
      creator: "TestUser1",
      name: "TestAction1",
      last_update: actionLastUpdate,
      badges: {
        last_update: new Date(0),
        is_updating: false,
      },
    });
  });

  test("it should return a 404 Not Found if the action does not exist yet", async () => {
    try {
      await getActionEntrypoint(
        {
          creator: "TestUser1",
          action: "TestAction2",
        },
        { auth: { uid: "1234" } } as CallableContext
      );
      expect(false).toBe(true);
    } catch (e) {
      expect(e).toHaveProperty("code");
      expect((e as functions.https.HttpsError).code).toBe("not-found");
    }
  });

  test("it should return a 403 Forbidden if the userId passed in the authentication does not match the username", async () => {
    try {
      await getActionEntrypoint(
        {
          creator: "TestUser2",
          action: "TestAction1",
        },
        { auth: { uid: "1234" } } as CallableContext
      );
      expect(false).toBe(true);
    } catch (e) {
      expect(e).toHaveProperty("code");
      expect((e as functions.https.HttpsError).code).toBe("permission-denied");
    }
  });

  test("it should return a 401 Unauthorized if no authentication is passed in the context", async () => {
    try {
      await getActionEntrypoint(
        {
          creator: "TestUser1",
          action: "TestAction2",
        },
        { auth: { uid: "" } } as CallableContext
      );
      expect(false).toBe(true);
    } catch (e) {
      expect(e).toHaveProperty("code");
      expect((e as functions.https.HttpsError).code).toBe("unauthenticated");
    }
  });
});
