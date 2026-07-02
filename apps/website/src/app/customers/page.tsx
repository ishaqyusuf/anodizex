import { permanentRedirect } from "next/navigation";

export default async function CustomersPage() {
  permanentRedirect("/features/customer-history");
}
