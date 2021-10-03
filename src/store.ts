import { writable } from 'svelte/store';

export type AppStore = {
  isLoading: boolean
}

export const appStore = writable<AppStore>({
  isLoading: false
});

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

