export type PulseRepo = {
  id: number;
  owner: string;
  name: string;
  hashed_name: string;
  full_name: string;
  full_hashed_name: string;
  github_id?: number | null;
  is_public: boolean;
  last_polled?: Date | null;
};
