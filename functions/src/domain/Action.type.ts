export type Action = {
  creator: string,
  name: string,
  last_update: Date,
  badges?: {
    last_update: Date,
    is_updating: boolean,
  },
}

export type DbAction = {
  creator: string,
  name: string,
  last_update: Date,
  badges: {
    last_update: string,
    is_updating: boolean,
  },
}

export function hydrate(action: any): Action {
  return {
    creator: action.creator,
    name: action.name,
    last_update: action.last_update,
    badges: {
      last_update: new Date(Date.parse(action.badges.last_update)),
      is_updating: action.badges.is_updating,
    },
  };
}

export function deHydrate(action: Action): DbAction {
  return {
    creator: action.creator,
    name: action.name,
    last_update: action.last_update,
    badges: {
      last_update: action?.badges?.last_update?.toISOString() ?? new Date(0).toISOString(),
      is_updating: action?.badges?.is_updating ?? false,
    },
  };
}

export default Action;

