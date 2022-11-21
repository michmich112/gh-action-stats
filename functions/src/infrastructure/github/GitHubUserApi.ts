import UnauthorizedGitHubApiError from "../../domain/errors/UnauthorizedGitHubApiError";
import axios from "axios";
import {
  getDefaultRateLimit,
  getRateLimitFromResponse,
  GithubApiRateLimit,
} from "./GithubApiRateLimit";

type PublicGitHubUserInfo = {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptioins_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  site_admin: boolean;
  name: string;
  company: string;
  blog: string;
  location: string;
  email: string;
  hireable: string;
  bio: string;
  twitter_username: string;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: Date;
  updated_at: Date;
};

/**
 * Get User Data From Github's User Api
 * @param {string} token
 * @return {Promise<PublicGitHubUserInfo>}
 */
export async function getUserData(
  token: string
): Promise<PublicGitHubUserInfo> {
  try {
    const res = await axios.get("https://api.github.com/user", {
      headers: {
        Authorization: `token ${token}`,
      },
    });
    if ([401, 403].includes(res.status)) {
      throw new UnauthorizedGitHubApiError(
        "Unauthorized to get User information"
      );
    }
    return res.data;
  } catch (e) {
    console.error(
      `[ERROR][GitHubUserApi][getUserData] - ${(e as Error).message}`
    );
    throw new UnauthorizedGitHubApiError("Unable to get User information");
  }
}

export async function isRepoAccessible(
  token: string,
  owner: string,
  repo: string
): Promise<boolean> {
  try {
    const res = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}`,
      {
        headers: {
          Authorization: `token ${token}`,
        },
      }
    );
    if ([403, 404].includes(res.status)) {
      return false;
    } else if ([200, 301].includes(res.status)) {
      return true;
    } else {
      console.debug(
        "[GitHubRepoApi][isRepoAccessible] - Unexpected response status",
        JSON.stringify(res)
      );
      return false;
    }
  } catch (e) {
    console.error(
      `[ERROR][GitHubRepoApi][isRepoAccessible] - ${(e as Error).message}`
    );
    return false;
  }
}

export class GithubApi {
  private _token: string;
  private _rateLimit: GithubApiRateLimit;

  private constructor(token: string, rateLimit: GithubApiRateLimit) {
    this._token = token;
    this._rateLimit = rateLimit;
  }

  public static async New(token: string): Promise<GithubApi> {
    let rateLimit;
    try {
      const res = await axios.get("https://api.github.com/user", {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status !== 200) {
        console.warn(
          `[WARN][GithubApi][New] - Invalid token: ${JSON.stringify(res)}`
        );
        throw new Error("Invalid User Github Token");
      }
      rateLimit = getRateLimitFromResponse(res);
      return new GithubApi(token, rateLimit ?? getDefaultRateLimit());
    } catch (e) {
      console.error(
        `[ERROR][GithubApi][New] - Error validating token and getting rate limit`,
        e
      );
      throw e;
    }
  }

  private async handleRateLimit(): Promise<void> {
    if (this._rateLimit.remaining === 0 && this._rateLimit.reset > new Date()) {
      console.warn(
        `[GithubApi] - Rate Limit has been hit, waiting until ${this._rateLimit.reset} to retry`
      );
      await new Promise((r) =>
        setTimeout(r, this._rateLimit.reset.getTime() - new Date().getTime())
      );
    }
    if (this._rateLimit.remaining < 5) {
      console.warn(
        `[GithubApi] - Only ${this._rateLimit.remaining} requests left before rate limited.`
      );
    }
  }

  private syncRateLimitFromApiResponse(res: any): void {
    this._rateLimit = getRateLimitFromResponse(res);
  }
  /**
   * Get User Data From Github's User Api
   * @param {boolean} retry=true - Should we retry if there is an error with rate limit
   * @return {Promise<PublicGitHubUserInfo>}
   */
  public async getUser(retry: boolean = true): Promise<PublicGitHubUserInfo> {
    await this.handleRateLimit(); // handle rate limit if we've reached it
    let res;
    try {
      res = await axios.get("https://api.github.com/user", {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${this._token}`,
        },
        validateStatus: (status) => [200, 301, 401, 403, 404].includes(status),
      });
      this.syncRateLimitFromApiResponse(res);
    } catch (e) {
      console.error(
        `[ERROR][GitHubUserApi][getUserData] - ${(e as Error).message}`
      );
      throw new UnauthorizedGitHubApiError("Unable to get User information");
    }
    if ([401, 403].includes(res.status)) {
      if (res.headers["x-ratelimit-remaining"] === 0 && retry) {
        // retry
        await this.handleRateLimit();
        return await this.getUser(false); //don't retry
      }
      throw new UnauthorizedGitHubApiError(
        "Unauthorized to get User information"
      );
    }
    return res.data;
  }

  /**
   * Validate if the repo is accessible for the user who'se token this is
   * @param {string} owner - owner of the repository
   * @param {string} repo - name of the repository
   * @param {boolean} retry=true - retry querying the api if there is a rate limit problem
   * @returns {Promise<boolean>}
   */
  public async isRepoAccessible(
    owner: string,
    repo: string,
    retry: boolean = true
  ): Promise<boolean> {
    await this.handleRateLimit(); // handle rate limit if we've reached it
    try {
      const res = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}`,
        {
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${this._token}`,
          },
          validateStatus: (status) =>
            [200, 301, 401, 403, 404].includes(status),
        }
      );
      if ([401, 403].includes(res.status)) {
        if (res.headers["x-ratelimit-remaining"] === 0 && retry) {
          // retry
          await this.handleRateLimit();
          return await this.isRepoAccessible(owner, repo, false); //don't retry
        }
        console.error(
          `[GithubApi][isRepoAccessible] - Error response from API ${JSON.stringify(
            res
          )}`
        );
        return false;
      } else if (res.status === 404) {
        return false;
      } else if ([200, 301].includes(res.status)) {
        return true;
      } else {
        console.error(
          "[GitHubApi][isRepoAccessible] - Unexpected response status",
          JSON.stringify(res)
        );
        return false;
      }
    } catch (e) {
      console.error(
        `[ERROR][GitHubApi][isRepoAccessible] - Error verifying user repo access`,
        e
      );
      return false;
    }
  }
}
