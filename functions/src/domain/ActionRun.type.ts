export type ActionRun = {
  creator: string;
  github_action: string | null;
  github_actor: string | null;
  github_base_ref: string | null;
  github_head_ref: string | null;
  github_ref: string | null;
  github_repository: string | null;
  github_run_id: string | null;
  github_event_name: string | null;
  github_action_repository?: string | null;
  package_version?: string | null;
  ip: string;
  name: string;
  runner_os: string | null;
  runner_name: string | null;
  timestamp: string;
  version: string;
  execution_time: [number, number] | null; // uses process.hrtime
  error: {
    name: string;
    message: string;
  } | null;
};

export default ActionRun;
