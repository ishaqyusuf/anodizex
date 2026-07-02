import { parseAsBoolean, useQueryStates } from "nuqs";

export function useJobParams() {
  const [params, setParams] = useQueryStates({
    createJob: parseAsBoolean,
  });

  return {
    ...params,
    setParams,
  };
}
