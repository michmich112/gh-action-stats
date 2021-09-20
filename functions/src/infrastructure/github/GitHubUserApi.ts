import UnauthorizedGitHubApiError from "../../domain/errors/UnauthorizedGitHubApiError";

export async function getUserData(token: string): Promise<{
  username: string,
  email: string
}> {
  const res: Response = await fetch("https://api.github.com/user", {
    method: "GET",
    headers: {
      Authorization: `token ${token}`,
    }
  });
  if ([401, 403].includes(res.status)) {
    throw new UnauthorizedGitHubApiError('Unauthorized to get User information');
  }
  return await res.json();
}
