import * as functions from "firebase-functions";
import { CallableContext } from "firebase-functions/v1/https";
import { firestore } from "../config/firebase.config";

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
  const { uid } = context.auth;
  const docRef = firestore.collection("users").doc(uid);
  const docSnapshot = await docRef.get();
  let username = docSnapshot.data()?.username;
  if (docSnapshot.exists && username) {
    return {
      code: 200,
      message: "OK user exists",
      username,
    }
  } else {
    try {
      const res: Response = await fetch("https://api.github.com/user", {
        method: "GET",
        headers: {
          Authorization: `token ${data.GithubToken}`,
        },
      });
      if (res.status > 202) {
        return {
          code: 401,
          message: 'Unauthorized'
        };
      }
      const ghData = await res.json();
      username = ghData.username;
      await docRef.set({
        username // TODO: Type this
      }, { merge: true });
      return {
        code: 201,
        message: 'Created',
        username
      }
    } catch (e) {
      return {
        code: 500,
        message: 'Internal Server Error: Unable to authenticate'
      }
    }
  }
});

