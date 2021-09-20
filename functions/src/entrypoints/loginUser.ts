import * as functions from "firebase-functions";
import { CallableContext } from "firebase-functions/v1/https";
import { firestore } from "../config/firebase.config";
import LoginUserWithGithubOperation from "../operations/LoginUserWithGitHubOperation";

type LoginUserData = {
  GithubToken: string
}

type LoginUserDataReturn = {
  code: 200 | 201 | 400 | 401 | 500,
  message: string,
  username?: string,
}

export const loginUser = functions.https.onCall(async (data: LoginUserData, context: CallableContext): Promise<LoginUserDataReturn> => {
  if (!context.auth) {
    return {
      code: 401,
      message: 'Unauthorized'
    }
  }
  if (!data.GithubToken) {
    return {
      code: 400,
      message: 'Bad Request: GithubToken is required'
    }
  }
  try {
    const user = await LoginUserWithGithubOperation({
      token: data.GithubToken,
      uid: context.auth.uid,
    });
    return {
      code: 200,
      message: 'LoggedIn',
      username: user.username
    };
  } catch (e) {
    console.error(`[ERROR][loginUserFunction]: error authenticating: ${e.message}`);
    return {
      code: 500,
      message: 'Internal Server Error: Unable to authenticate'
    }
  }
});

