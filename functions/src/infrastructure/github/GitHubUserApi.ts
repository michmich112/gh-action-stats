import UnauthorizedGitHubApiError from "../../domain/errors/UnauthorizedGitHubApiError";
import axios from 'axios';

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

export async function getUserData(token: string): Promise<PublicGitHubUserInfo> {
  try {
    const res = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `token ${token}`
      }
    });
    if ([401, 403].includes(res.status)) {
      throw new UnauthorizedGitHubApiError('Unauthorized to get User information');
    }
    return res.data;
  } catch (e) {
    console.error(`[ERROR][GitHubUserApi] - ${e.message}`);
    throw new UnauthorizedGitHubApiError('Unable to get User information');
  }
}
