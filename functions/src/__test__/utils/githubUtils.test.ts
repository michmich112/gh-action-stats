import { GithubMeta, isGithubActionsAddress } from "../../utils/githubUtils";

jest.mock('axios');
const axios = require('axios');

describe("isGithubActionsAddress", () => {

  const githubMeta: GithubMeta = {
    verifiable_password_authentication: false,
    ssh_key_fingerprints: {
      SHA256_RSA: "",
      SHA256_DSA: "",
    },
    hooks: [],
    web: [],
    api: [],
    git: [],
    packages: [],
    pages: [],
    importer: [],
    actions: [
      "1.2.3.4/32",
      "5.6.7.0/24",
      "1:2:3:4:5:6:7:8/128",
      "9:10:11:12:13::/80"
    ],
    dependabot: [],
  }

  axios.get.mockImplementation(async (url: string) => {
    if (url === 'https://api.github.com/meta') {
      return {
        data: JSON.stringify(githubMeta)
      };
    }
    return "";
  })

  test("it should return true if it is in one of the github actions cidr block", async () => {
    // IPv4
    expect(await isGithubActionsAddress("1.2.3.4")).toBe(true);
    expect(await isGithubActionsAddress("5.6.7.252")).toBe(true);
    expect(await isGithubActionsAddress("5.6.7.69")).toBe(true);
    // IPv6
    expect(await isGithubActionsAddress("1:2:3:4:5:6:7:8")).toBe(true);
    expect(await isGithubActionsAddress("9:10:11:12:13:14:15:16")).toBe(true);
    expect(await isGithubActionsAddress("9:10:11:12:13:ffff::")).toBe(true);
  });

  test("it should return false if it is not in one of the github actions cidr block", async () => {
    // IPv4
    expect(await isGithubActionsAddress("1.2.4.5")).toBe(false);
    expect(await isGithubActionsAddress("5.7.8.9")).toBe(false);
    // IPv6
    expect(await isGithubActionsAddress("1:2:3:4:5:7:8:9")).toBe(false);
    expect(await isGithubActionsAddress("9:10:12:23:34::")).toBe(false);
  });

  test("it should return false if it is not a valid ip address", async () => {
    expect(await isGithubActionsAddress("actions")).toBe(false);
    // IPv4
    expect(await isGithubActionsAddress("1.2.3.4.5")).toBe(false);
    expect(await isGithubActionsAddress("5.6.7.8.9")).toBe(false);
    // IPv6
    expect(await isGithubActionsAddress("1:2:3:4:5:6:7:8:9")).toBe(false);
    expect(await isGithubActionsAddress("9:g:8::")).toBe(false);
  });
})

