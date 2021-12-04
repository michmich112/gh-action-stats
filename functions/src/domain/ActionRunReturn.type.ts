type ActionRunReturn = {
  actor: string,
  ip: string,
  os: string | null,
  timestamp: string,
  repository: string | null, // repository is null if it is private
  event: string | null,
  execution_time: [number, number] | null,
  error: {
    name: string,
    message: string,
  } | null,
  is_private: boolean, // true if the repository is private
}

export default ActionRunReturn;
