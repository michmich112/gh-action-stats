export type User = {
  uid: string;
  username: string;
  email: string;
  name: string;
  avatar_url: string;
};

export type MigrationUser = {
  id: string;
  githubUsername: string;
  github_id: string;
  avatar_url?: string;
};

export default User;
