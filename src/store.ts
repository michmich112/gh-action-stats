import { writable } from 'svelte/store';

// User Auth Store Types
export type UserAuthStore = {
  authenticated: boolean,
  userId?: string,
  github?: {
    username: string,
    email: string,
    token: string,
  }
};

export const userAuthStore = writable<UserAuthStore>({
  authenticated: false,
})

