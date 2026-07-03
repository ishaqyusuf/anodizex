"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  useForm,
  type FieldValues,
  type Resolver,
  type UseFormProps,
} from "react-hook-form";
import type { z } from "zod";

type ZodFormSchema = z.ZodType<FieldValues, FieldValues>;

export function useZodForm<TSchema extends ZodFormSchema>(
  props: Omit<UseFormProps<z.output<TSchema>>, "resolver"> & {
    schema: TSchema;
  },
) {
  const { schema, ...formProps } = props;
  const resolver = zodResolver(schema) as Resolver<z.output<TSchema>>;

  return useForm<z.output<TSchema>>({
    ...formProps,
    resolver,
  });
}
