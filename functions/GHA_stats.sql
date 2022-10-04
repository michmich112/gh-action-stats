CREATE TABLE "PulseRepoAccessLevel" (
	access_level text primary key
);

INSERT INTO "PulseRepoAccessLevel" (access_level) VALUES 
 ('public'),
 ('private');

CREATE TABLE "Actions" (
  "id" BIGSERIAL PRIMARY KEY,
  "creator" text NOT NULL,
  "name" text NOT NUll,
  "last_update" timestamptz NOT NULL,
  UNIQUE(creator, name)
);

CREATE TABLE "Runs" (
  "id" BIGSERIAL PRIMARY KEY,
  "action_id" bigint NOT NULL,
  "error_id" bigint,
  "attempt_id" bigint,
  "pulse_repo_id" bigint,
  "github_action" text,
  "github_actor" text NOT NULL,
  "github_ref" text,
  "github_base_ref" text,
  "github_head_ref" text,
  "github_event_name" text NOT NULL,
  "github_repository" text,
  "github_run_id" bigint,
  "execution_time_s" int NOT NULL,
  "execution_time_ns" bigint NOT NULL,
  "ip" text,
  "runner_name" text NOT NULL,
  "runner_os" text NOT NULL,
  "t" timestamp NOT NULL,
  "version" text
);

CREATE TABLE "PulseRepos" (
  "id" BIGSERIAL PRIMARY KEY,
  "owner" text NOT NULL,
  "name" text NOT NULL,
  "hashed_name" text,
  "full_name" text,
  "full_hashed_name" text,
  UNIQUE (owner, name)
);

CREATE TABLE "AttemptedRuns" (
  "id" BIGSERIAL PRIMARY KEY,
  "reason" text NOT NULL
);

CREATE TABLE "RunErrors" (
  "id" BIGSERIAL PRIMARY KEY,
  "message" text,
  "name" text,
  "stack" text
);

CREATE TABLE "BadgesRequests" (
  "id" BIGSERIAL PRIMARY KEY,
  "action_id" bigint NOT NULL,
  "metric" text NOT NULL,
  "t" timestamp NOT NULL
);

CREATE TABLE "Users" (
  "uid" uuid PRIMARY KEY,
  "email" text,
  "name" text,
  "username" text NOT NULL,
  "avatar_url" text
);

CREATE TABLE "UserPulseRepoAccesses" (
  "user_id" uuid,
  "pulse_repo_id" bigint,
  "pr_access_level" text references "PulseRepoAccessLevel"(access_level) ON UPDATE CASCADE,
  PRIMARY KEY ("user_id", "pulse_repo_id")
);

ALTER TABLE "Runs" ADD FOREIGN KEY ("action_id") REFERENCES "Actions" ("id");

ALTER TABLE "Runs" ADD FOREIGN KEY ("error_id") REFERENCES "RunErrors" ("id");

ALTER TABLE "Runs" ADD FOREIGN KEY ("attempt_id") REFERENCES "AttemptedRuns" ("id");

ALTER TABLE "Runs" ADD FOREIGN KEY ("pulse_repo_id") REFERENCES "PulseRepos" ("id");

ALTER TABLE "BadgesRequests" ADD FOREIGN KEY ("action_id") REFERENCES "Actions" ("id");

ALTER TABLE "UserPulseRepoAccesses" ADD FOREIGN KEY ("user_id") REFERENCES "Users" ("uid");

ALTER TABLE "UserPulseRepoAccesses" ADD FOREIGN KEY ("pulse_repo_id") REFERENCES "PulseRepos" ("id");
