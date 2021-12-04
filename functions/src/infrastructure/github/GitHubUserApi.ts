import UnauthorizedGitHubApiError from "../../domain/errors/UnauthorizedGitHubApiError";
import axios from "axios";

type PublicGitHubUserInfo = {
  login: string,
  id: number,
  node_id: string,
  avatar_url: string,
  gravatar_id: string,
  url: string,
  html_url: string,
  followers_url: string,
  following_url: string,
  gists_url: string,
  starred_url: string,
  subscriptioins_url: string,
  organizations_url: string,
  repos_url: string,
  events_url: string,
  received_events_url: string,
  type: string,
  site_admin: boolean,
  name: string,
  company: string,
  blog: string,
  location: string,
  email: string,
  hireable: string,
  bio: string,
  twitter_username: string,
  public_repos: number,
  public_gists: number,
  followers: number,
  following: number,
  created_at: Date,
  updated_at: Date
}

/**
 * Get User Data From Github's User Api
 * @param {string} token
 * @return {Promise<PublicGitHubUserInfo>}
 */
export async function getUserData(token: string): Promise<PublicGitHubUserInfo> {
  try {
    const res = await axios.get("https://api.github.com/user", {
      headers: {
        Authorization: `token ${token}`,
      },
    });
    if ([401, 403].includes(res.status)) {
      throw new UnauthorizedGitHubApiError("Unauthorized to get User information");
    }
    return res.data;
  } catch (e) {
    console.error(`[ERROR][GitHubUserApi][getUserData] - ${(e as Error).message}`);
    throw new UnauthorizedGitHubApiError("Unable to get User information");
  }
}


export async function isRepoAccessible(token: string, owner: string, repo: string): Promise<boolean> {
  try {
    const res = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        Authorization: `token ${token}`,
      },
    });
    if ([403, 404].includes(res.status)) {
      return false;
    } else if ([200, 301].includes(res.status)) {
      return true;
    } else {
      console.debug("[GitHubRepoApi][isRepoAccessible] - Unexpected response status", JSON.stringify(res));
      return false
    }
  } catch (e) {
    console.error(`[ERROR][GitHubRepoApi][isRepoAccessible] - ${(e as Error).message}`);
    return false;
  }
}
