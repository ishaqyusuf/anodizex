import { contactInquirySchema } from "@anodizex/api/schemas";
import { NextResponse } from "next/server";
import { getWebsiteCaller } from "@/lib/server-trpc";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = contactInquirySchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          parsed.error.issues[0]?.message ?? "Invalid contact form payload.",
      },
      { status: 400 },
    );
  }

  const caller = await getWebsiteCaller();
  const result = await caller.website.submitContact(parsed.data);

  return NextResponse.json(result);
}
