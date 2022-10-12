import axios from "axios";
import { isInSubnet } from "is-in-subnet";

export type GithubMeta = {
  verifiable_password_authentication: boolean;
  ssh_key_fingerprints: {
    SHA256_RSA: string;
    SHA256_DSA: string;
  };
  hooks: string[];
  web: string[];
  api: string[];
  git: string[];
  packages: string[];
  pages: string[];
  importer: string[];
  actions: string[];
  dependabot: string[];
};

/**
 * Verifies if an ip is part of the GitHub Actions IPs
 * @param {string} ip
 * @return {Promise<boolean>}
 */
export async function isGithubActionsAddress(ip: string): Promise<boolean> {
  const githubMeta: GithubMeta = (
    await axios.get("https://api.github.com/meta")
  ).data;
  try {
    return isInSubnet(ip, githubMeta.actions);
  } catch (e) {
    console.error(
      `[isGithubActionAddress][ERROR]:\n\tParameters:\n\t\tip: ${ip}\n\tError: ${
        (e as Error).message
      }`
    );
    return false;
  }
}

/**
 * Returns owner and repo name from a single string matching github format: <owner>/<repo>
 * @param {string} repoString
 * @return {{owner: string, name: string}}
 */
export function getRepoOwnerAndNameFromString(repoString: string): {
  owner: string;
  name: string;
} {
  const tks = repoString.split("/").filter((f) => f.length !== 0);
  return {
    owner: tks[0],
    name: tks.slice(1).join("/"),
  };
}

/**
 * Hashes a strign
 */
export function hashString(str: string): string {
  return cyrb53(str, 69).toString(36);
}

/**
 * Cyrb53 hash implementation by: github.com/bryc
 * https://github.com/bryc/code/blob/master/jshash/experimental/cyrb53.js
 */
function cyrb53(str: string, seed = 0) {
  let h1 = 0xdeadbeef ^ seed,
    h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }

  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}
