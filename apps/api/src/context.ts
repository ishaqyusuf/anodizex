import { auth } from "@anodizex/auth";
import { getDbClient, type MembershipRole } from "@anodizex/db";

type BetterAuthSession = NonNullable<
  Awaited<ReturnType<typeof auth.api.getSession>>
>;

export type ApiWorkspaceContext = {
  id: string;
  role: MembershipRole;
  slug: string;
} | null;

export type ApiContext = {
  requestId: string;
  session: BetterAuthSession | null;
  user: BetterAuthSession["user"] | null;
  workspace: ApiWorkspaceContext;
};

export async function createContext(request?: Request): Promise<ApiContext> {
  const session = request
    ? await auth.api.getSession({
        headers: request.headers,
      })
    : null;
  const db = getDbClient();
  const membership = session?.user
    ? await db.membership.findFirst({
        orderBy: {
          createdAt: "asc",
        },
        select: {
          role: true,
          workspace: {
            select: {
              id: true,
              slug: true,
            },
          },
        },
        where: {
          userId: session.user.id,
        },
      })
    : null;

  return {
    session,
    requestId: crypto.randomUUID(),
    user: session?.user ?? null,
    workspace: membership
      ? {
          id: membership.workspace.id,
          role: membership.role,
          slug: membership.workspace.slug,
        }
      : null,
  };
}
