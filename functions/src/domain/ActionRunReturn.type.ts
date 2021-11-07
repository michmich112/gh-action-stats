export type ActionRunReturn = {
  actor: string,
  ip: string,
  os: string | null,
  timestamp: string,
  repository: string | null, // repository is null if it is private
  is_private: boolean, // true if the repository is private
}

export default ActionRunReturn;
