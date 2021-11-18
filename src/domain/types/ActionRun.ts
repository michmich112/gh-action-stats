export type ActionRun = {
  actor: string;
  ip: string;
  os: string | null;
  timestamp: string;
  repository: string | null;
  is_private: boolean;
};

export default ActionRun;

