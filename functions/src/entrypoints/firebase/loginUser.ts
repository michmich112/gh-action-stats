import * as functions from "firebase-functions";
import { CallableContext } from "firebase-functions/v1/https";
import LoginUserWithGithubOperation from "../../operations/LoginUserWithGitHubOperation";
import UnauthorizedGitHubApiError from "../../domain/errors/UnauthorizedGitHubApiError";

type LoginUserData = {
  GithubToken: string;
};

type LoginUserDataReturn = {
  code: 200 | 201 | 400 | 401 | 500;
  message: string;
  username?: string;
  name?: string;
  avatar_url?: string;
};

export async function loginUserEntrypoint(
  data: LoginUserData,
  context: CallableContext
): Promise<LoginUserDataReturn> {
  functions.logger.debug(
    "[LoginUser][Start] - Starting execution on loginUser Function"
  );
  if (!context.auth) {
    functions.logger.warn(
      "[LoginUser][Unauthorized] - Function run is not authenticated with firebase."
    );
    return {
      code: 401,
      message: "Unauthorized",
    };
  }
  if (!data.GithubToken) {
    functions.logger.warn(
      "[LoginUser][BadRequest] - Function run did not contain Github Token."
    );
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
    functions.logger.debug(
      "[LoginUser][Success] - Success in executing Login User"
    );
    return {
      code: 200,
      message: "LoggedIn",
      username: user.username,
      name: user.name,
      avatar_url: user.avatar_url,
    };
  } catch (e) {
    functions.logger.error(
      `[LoginUser][ERROR]: error authenticating: ${(e as Error).message}`
    );
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
