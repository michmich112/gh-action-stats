import { writable, Writable } from 'svelte/store';

//function getParams(paramsString: string): string[] {
//  return paramsString.split('.')
//}


//function mm(obj: object, params: string[]): object {
//  const ret = {};
//  params.forEach((str) => str.split('.').reduce(()));
//}

function persistentStore<T>(name: string, initial: T): Writable<T> {
  const previous = localStorage.getItem(name);
  if (previous !== null) console.debug(`Persistent store with key ${name} found on system. Hydrating.`);
  const store = writable<T>(previous ? JSON.parse(previous) : initial);
  store.subscribe(val => localStorage.setItem(name, JSON.stringify(val)));
  return store
}

interface ExpiryStore {
  expiry: number;
}

function persistentStoreWithExpiry<T extends ExpiryStore>(name: string, initial: T): Writable<T> {
  const previous = localStorage.getItem(name);
  let data: T;
  if (previous !== null) {
    const expiry = (JSON.parse(previous) as T).expiry;
    if (expiry < new Date().getTime()) {
      console.debug(`Persistent store with key ${name} expired.`);
      data = initial;
    } else {
      console.debug(`Persistent store with key ${name} found. Hydrating.`);
      data = (JSON.parse(previous) as T);
    }
  } else {
    data = initial;
  }
  const store = writable<T>(data);
  store.subscribe(val => localStorage.setItem(name, JSON.stringify(val)));
  return store;
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
  expiry: number,
  github?: {
    avatarUrl: string,
    username: string,
    email: string,
    token: string,
  }
};


export const userAuthStore = persistentStoreWithExpiry<UserAuthStore>("userAuthStore", {
  authenticated: false,
  expiry: new Date().getTime() + 360000,
})

