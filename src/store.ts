import { writable, Writable } from 'svelte/store';

function persistentStore<T>(name: string, initial: T): Writable<T> {
  const previous = localStorage.getItem(name);
  if (previous !== null) console.debug(`Persistent store with key ${name} found on system. Hydrating.`);
  const store = writable<T>(previous ? JSON.parse(previous) : initial);
  store.subscribe(val => localStorage.setItem(name, JSON.stringify(val)));
  return store

}

export type AppStore = {
  isLoading: boolean
}

export const appStore = persistentStore<AppStore>("appStore", {
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

export const userAuthStore = persistentStore<UserAuthStore>("userAuthStore", {
  authenticated: false,
})

