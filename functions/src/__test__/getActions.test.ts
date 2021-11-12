import Action from "../domain/Action.type";
import User from "../domain/User.type";
import { CallableContext } from "firebase-functions/v1/https";
import { getActionsEntrypoint } from "../entrypoints/getActions";


jest.mock("../config/firebase.config");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { firestore } = require("../config/firebase.config");


describe("getActions test", () => {
  const actionsDbData: { [key: string]: Action } = {
    "TestUser1:TestAction1": {
      creator: "TestUser1",
      name: "TestAction1",
      last_update: new Date(),
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
    "users": usersDbData,
    "actions": actionsDbData,
  };

  firestore.collection.mockImplementation((cn: string) => {
    const collection: any = collections[cn] || {};
    return {
      where: (field: string, comparator: string, value: string) => {
        const cdata = Object.values(collection).filter((e: any) => {
          if (comparator === "==") return (e[field] as any) === value;
          return false;
        });

        return {
          empty: !cdata,
          get: async () => cdata.map((d) => ({
            data: () => d,
          })),
        };
      },
      doc: (dn: string) => ({
        get: async () => ({
          empty: !collection[dn],
          data: () => collection[dn],
        }),
      }),
    };
  });

  test("it should return the data that is stored in the actions collection", async () => {
    const actions = await getActionsEntrypoint({}, { auth: { uid: "1234" } } as CallableContext);
    expect(Array.isArray(actions)).toBe(true);
    expect(actions.length).toBe(1);
    expect(actions[0]).toEqual(actionsDbData["TestUser1:TestAction1"]);
  });

  test("it should return nothing if the user doesn't exist yet", async () => {
    const actions = await getActionsEntrypoint({}, { auth: { uid: "2222" } } as CallableContext);
    expect(Array.isArray(actions)).toBe(true);
    expect(actions.length).toBe(0);
  });

  test("it should return an unauthenticated error if not authenticated", async () => {
    try {
      await getActionsEntrypoint({}, {} as CallableContext);
    } catch {
      return;
    }
    expect(false).toBe(true); // it should throw an error
  });
});

