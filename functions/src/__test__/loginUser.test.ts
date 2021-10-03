import { loginUserEntrypoint } from "../entrypoints/loginUser";
import { CallableContext } from "firebase-functions/v1/https";

jest.mock("axios");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const axios = require("axios");
jest.mock("../config/firebase.config");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { firestore } = require("../config/firebase.config");

describe("loginUser", () => {
  let setValue: any;
  let usersDb: any;

  beforeEach(() => {
    setValue = undefined;
    usersDb = {
      "123": {
        username: "UserCheck1",
        email: "usercheck1@gmail.com",
        name: "checked user",
        uid: "123",
      },
    };
  });

  axios.get.mockImplementation(async (url: any, params: any) => {
    if (url === "https://api.github.com/user") {
      if (params?.headers?.Authorization === "token token123") {
        return { // TODO: update this with actual values
          status: 200,
          data: {
            login: "testUser123",
            id: 1,
            node_id: "MDQ6VXNlcjE=",
            avatar_url: "https://github.com/images/error/octocat_happy.gif",
            gravatar_id: "",
            url: "https://api.github.com/users/octocat",
            html_url: "https://github.com/octocat",
            followers_url: "https://api.github.com/users/octocat/followers",
            following_url: "https://api.github.com/users/octocat/following{/other_user}",
            gists_url: "https://api.github.com/users/octocat/gists{/gist_id}",
            starred_url: "https://api.github.com/users/octocat/starred{/owner}{/repo}",
            subscriptions_url: "https://api.github.com/users/octocat/subscriptions",
            organizations_url: "https://api.github.com/users/octocat/orgs",
            repos_url: "https://api.github.com/users/octocat/repos",
            events_url: "https://api.github.com/users/octocat/events{/privacy}",
            received_events_url: "https://api.github.com/users/octocat/received_events",
            type: "User",
            site_admin: false,
            name: "monalisa octocat",
            company: "GitHub",
            blog: "https://github.com/blog",
            location: "San Francisco",
            email: "testUser@gmail.com",
            hireable: false,
            bio: "There once was...",
            twitter_username: "monatheoctocat",
            public_repos: 2,
            public_gists: 1,
            followers: 20,
            following: 0,
            created_at: "2008-01-14T04:33:35Z",
            updated_at: "2008-01-14T04:33:35Z",
          },
        };
      }
      throw new Error("Unauthorized for api.github.com");
    }
    return {};
  });

  firestore.collection.mockImplementation((collection: string) => {
    if (collection === "users") {
      return {
        doc: (id: string) => {
          return {
            get: async () => (
              Object.keys(usersDb).includes(id) ? {
                exists: true,
                data: () => (usersDb[id]),
              } : {
                exist: false,
                data: () => undefined,
              }),
            set: (data: any, options: any) => {
              setValue = data;
              if (options?.merge) {
                usersDb[id] = Object.assign(usersDb[id], data);
              } else {
                usersDb[id] = data;
              }
            },
          };
        },
      };
    }
    return {};
  });


  test("it should return the username if the user already exists", async () => {
    try {
      const user = await loginUserEntrypoint({ GithubToken: "token1234" }, { auth: { uid: "123" } } as CallableContext);
      expect(user.username).toBe("UserCheck1");
      expect(user.name).toBe("checked user");
    } catch (e) {
      console.error((e as Error).message);
      expect(false).toBe(true);
    }
  });

  test("it should create a new db entry if the user does not already exist", async () => {
    try {
      const user = await loginUserEntrypoint({ GithubToken: "token123" }, { auth: { uid: "67866" } } as CallableContext);
      const expected = {
        username: "testUser123",
        email: "testUser@gmail.com",
        name: "monalisa octocat",
        uid: "67866",
      };
      expect(setValue).toEqual(expected);
      console.warn(user);
      expect(user).toEqual({
        username: expected.username,
        name: expected.name,
        code: 200,
        message: "LoggedIn",
      });
    } catch (e) {
      console.error((e as Error).message);
      expect(false).toBe(true);
    }
  });

  test("it should be unable to login if the github token is not correct", async () => {
    try {
      const user = await loginUserEntrypoint({ GithubToken: "NotValidToken" }, { auth: { uid: "1234" } } as CallableContext);
      expect(user).toEqual({
        code: 401,
        message: "Unauthorized",
      });
    } catch (e) {
      console.error((e as Error).message);
      expect(false).toBe(true);
    }
  });

  test("it should throw a 400 if the github token is missing from the call", async () => {
    try {
      const user = await loginUserEntrypoint({} as { GithubToken: string }, { auth: { uid: "1234" } } as CallableContext);
      expect(user).toEqual({
        code: 400,
        message: "Bad Request: GithubToken is required",
      });
    } catch (e) {
      console.error((e as Error).message);
      expect(false).toBe(true);
    }
  });

  test("it should throw a 401 if the call comes from an unauthorize source", async () => {
    try {
      const user = await loginUserEntrypoint({ GithubToken: "anyToken" }, {} as CallableContext);
      expect(user).toEqual({
        code: 401,
        message: "Unauthorized",
      });
    } catch (e) {
      console.error((e as Error).message);
      expect(false).toBe(true);
    }
  });
});

