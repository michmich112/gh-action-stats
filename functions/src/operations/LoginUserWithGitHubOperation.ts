import User from "../domain/User.type";
import { getUserData } from "../infrastructure/github/GitHubUserApi";
import UserRepository from "../infrastructure/firestore/UserRepository";

// eslint-disable-next-line valid-jsdoc
/**
 * Operation to login with Github.
 * Registers a new user if the user has never logged on before
 * @param {{token: string; uid: string}} params
 * @return {Promise<User>}
 * @constructor
 */
export async function LoginUserWithGithubOperation(params: {
  token: string,
  uid: string
}): Promise<User> {
  const { token, uid } = params;
  if (await UserRepository.existsByUid(uid)) {
    const user = await UserRepository.getByUid(uid);
    if (user !== null) return user as User;
    // if we were unable to get the user from the repository we create it
  }
  const { email, login, name } = await getUserData(token);
  const user = {
    uid,
    email,
    username: login,
    name,
  };
  await UserRepository.create(user);
  return user;
}

export default LoginUserWithGithubOperation;

