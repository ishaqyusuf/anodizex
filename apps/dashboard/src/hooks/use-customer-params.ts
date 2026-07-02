import { parseAsBoolean, parseAsString, useQueryStates } from "nuqs";

export function useCustomerParams() {
  const [params, setParams] = useQueryStates({
    createCustomer: parseAsBoolean,
    customerId: parseAsString,
    editCustomer: parseAsBoolean,
  });

  return {
    ...params,
    setParams,
  };
}
