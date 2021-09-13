import axios from 'axios';
import { isInSubnet } from 'is-in-subnet';

export type GithubMeta = {
  verifiable_password_authentication: boolean,
  ssh_key_fingerprints: {
    SHA256_RSA: string,
    SHA256_DSA: string,
  },
  hooks: string[],
  web: string[],
  api: string[],
  git: string[],
  packages: string[],
  pages: string[],
  importer: string[],
  actions: string[],
  dependabot: string[],
}

export async function isGithubActionsAddress(ip: string): Promise<boolean> {
  const githubMeta: GithubMeta = JSON.parse((await axios.get('https://api.github.com/meta')).data);
  try {
    return isInSubnet(ip, githubMeta.actions);
  } catch (e) {
    console.error(`[isGithubActionAddress][ERROR]:\n\tParameters:\n\t\tip: ${ip}\n\tError: ${e.message}`);
    return false
  }
}

