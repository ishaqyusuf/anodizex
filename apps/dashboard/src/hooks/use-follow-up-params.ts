import { parseAsBoolean, parseAsString, useQueryStates } from "nuqs";

export function useFollowUpParams() {
  const [params, setParams] = useQueryStates({
    createFollowUp: parseAsBoolean,
    followUpId: parseAsString,
    editFollowUp: parseAsBoolean,
  });

  return {
    ...params,
    setParams,
  };
}
