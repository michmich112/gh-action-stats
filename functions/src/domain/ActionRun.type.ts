export type ActionRun = {
  creator: string,
  github_action: string | null,
  github_actor: string | null,
  github_base_ref: string | null,
  github_head_ref: string | null,
  github_ref: string | null,
  github_run_id: string | null,
  ip: string,
  name: string,
  runner_os: string | null,
  timestamp: string,
  version: string,
};

export default ActionRun;

