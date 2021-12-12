type Action = {
  creator: string;
  name: string;
  last_update: { _seconds: number; _nanoseconds: number };
  badges: {
    last_update: string;
    is_updating: boolean;
  };
};

export default Action;

