export class UnauthorizedGitHubApiError extends Error {
  constructor(message: string) {
    super(`[UnauthorizedGitHubApiError] ${message}`);
  }
}

export default UnauthorizedGitHubApiError;

