import { auth } from "@anodizex/auth";
import { getDbClient } from "@anodizex/db";
import { blobUploadPayloadSchema } from "@anodizex/api/schemas";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Vercel Blob is not configured." },
      { status: 503 },
    );
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        const session = await auth.api.getSession({
          headers: request.headers,
        });

        if (!session?.user) {
          throw new Error("Not authenticated");
        }

        const db = getDbClient();
        const membership = await db.membership.findFirst({
          select: {
            role: true,
            workspaceId: true,
          },
          where: { userId: session.user.id },
        });

        if (
          !membership ||
          (membership.role !== "owner" && membership.role !== "admin")
        ) {
          throw new Error("Owner or admin access is required.");
        }

        const parsedPayload = blobUploadPayloadSchema.safeParse(
          clientPayload ? JSON.parse(clientPayload) : {},
        );

        if (!parsedPayload.success) {
          throw new Error("Invalid upload payload.");
        }

        return {
          addRandomSuffix: true,
          allowedContentTypes: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
            "video/mp4",
            "video/webm",
            "video/quicktime",
          ],
          tokenPayload: JSON.stringify({
            ...parsedPayload.data,
            userId: session.user.id,
            workspaceId: membership.workspaceId,
          }),
        };
      },
      onUploadCompleted: async () => {},
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed." },
      { status: 400 },
    );
  }
}
