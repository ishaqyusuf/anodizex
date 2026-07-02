import { parseAsBoolean, parseAsString, useQueryStates } from "nuqs";

export function useTemplateParams() {
  const [params, setParams] = useQueryStates({
    createTemplate: parseAsBoolean,
    templateId: parseAsString,
    editTemplate: parseAsBoolean,
  });

  return {
    ...params,
    setParams,
  };
}
