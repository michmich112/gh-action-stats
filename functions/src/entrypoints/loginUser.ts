import * as functions from "firebase-functions";
import { CallableContext } from "firebase-functions/v1/https";
import LoginUserWithGithubOperation from "../operations/LoginUserWithGitHubOperation";
import UnauthorizedGitHubApiError from "../domain/errors/UnauthorizedGitHubApiError";

type LoginUserData = {
  GithubToken: string
}

type LoginUserDataReturn = {
  code: 200 | 201 | 400 | 401 | 500,
  message: string,
  username?: string,
  name?: string,
}

export async function loginUserEntrypoint(data: LoginUserData, context: CallableContext): Promise<LoginUserDataReturn> {
  if (!context.auth) {
    return {
      code: 401,
      message: "Unauthorized",
    };
  }
  if (!data.GithubToken) {
    return {
      code: 400,
      message: "Bad Request: GithubToken is required",
    };
  }
  try {
    const user = await LoginUserWithGithubOperation({
      token: data.GithubToken,
      uid: context.auth.uid,
    });
    return {
      code: 200,
      message: "LoggedIn",
      username: user.username,
      name: user.name,
    };
  } catch (e) {
    console.error(`[ERROR][loginUserFunction]: error authenticating: ${e.message}`);
    if (e instanceof UnauthorizedGitHubApiError) {
      return {
        code: 401,
        message: "Unauthorized",
      };
    }
    return {
      code: 500,
      message: "Internal Server Error: Unable to authenticate",
    };
  }
}

export const loginUser = functions.https.onCall(loginUserEntrypoint);

