export interface UserPulseRepoAccessKey {
  userId: string;
  pulseRepoId: number;
}

export interface UserPulseRepoAccess extends UserPulseRepoAccessKey {
  canAccess: boolean;
  lastPolled: Date;
}

export interface NewUserPulseRepoAccess extends UserPulseRepoAccessKey {
  canAccess: boolean;
}
