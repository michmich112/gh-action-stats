import User from "../domain/User.type";
import { getUserData } from "../infrastructure/github/GitHubUserApi";
import UserRepository from "../infrastructure/firestore/UserRepository";

export async function LoginUserWithGithubOperation(params: {
  token: string,
  uid: string
}): Promise<User> {
  const { token, uid } = params;
  if (await UserRepository.existsByUid(uid)) {
    const user = await UserRepository.getByUid(uid);
    if (user.success) return user.data as User;
    // if we were unable to get the user from the repository we create it
  }
  const { email, login, name } = await getUserData(token);
  const user = {
    uid,
    email,
    username: login,
    name,
  }
  await UserRepository.create(user);
  return user;
}

export default LoginUserWithGithubOperation;

