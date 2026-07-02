export function formatDate(date: Date | string | null | undefined) {
  if (!date) return "Not set";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(date));
}

export function centsToDollars(cents: number | null | undefined) {
  if (!cents) return "";
  return new Intl.NumberFormat("en", {
    currency: "USD",
    style: "currency",
  }).format(cents / 100);
}

export function resolveTemplate(
  body: string,
  input: {
    businessName: string;
    completionDate?: Date | string | null;
    customerName?: string | null;
    serviceName?: string | null;
  },
) {
  return body
    .replaceAll("{{customer.name}}", input.customerName ?? "Customer")
    .replaceAll("{{customer_name}}", input.customerName ?? "Customer")
    .replaceAll("{{business_name}}", input.businessName)
    .replaceAll("{{job.title}}", input.serviceName ?? "recent service")
    .replaceAll("{{service_name}}", input.serviceName ?? "recent service")
    .replaceAll(
      "{{completion_date}}",
      input.completionDate ? formatDate(input.completionDate) : "recently",
    );
}
