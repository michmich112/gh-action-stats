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
  console.debug("[LoginUserWithGitHubOperation][Start]");
  const { token, uid } = params;
  if (await UserRepository.existsByUid(uid)) {
    console.debug("[LoginUserWithGitHubOperation] - User exists, fetching by Uid");
    const user = await UserRepository.getByUid(uid);
    console.debug("[LoginUserWithGitHubOperation] - User fetched by Uid");
    if (user !== null) {
      console.debug("[LoginUserWithGitHubOperation] - User found on  user repository");
      console.debug("[LoginUserWithGitHubOperation][End]");
      return user as User;
    }
    console.debug("[LoginUserWithGitHubOperation] - User not found on user repository");
    // if we were unable to get the user from the repository we create it
  }
  console.debug("[LoginUserWithGitHubOperation] - Creating new User, getting user data from Github.");
  const { email, login, name, avatar_url } = await getUserData(token);
  console.debug("[LoginUserWithGitHubOperation] - Received User data from github, creating User");
  const user: User = {
    uid,
    email,
    username: login,
    name,
    avatar_url,
  };
  await UserRepository.create(user);
  console.debug("[LoginUserWithGitHubOperation] - User Created");
  console.debug("[LoginUserWithGitHubOperation][End]");
  return user;
}

export default LoginUserWithGithubOperation;

