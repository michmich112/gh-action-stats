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
  githubId: number;
  avatarUrl?: string;
  lastRefresh: Date;
};

export default User;
