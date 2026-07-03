import { auth } from "@anodizex/auth";
import { getDbClient } from "@anodizex/db";
import { IdentifyUser } from "@anodizex/events/client";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";

export default async function SidebarLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/sign-in");
  }

  const db = getDbClient();
  const membership = await db.membership.findFirst({
    orderBy: {
      createdAt: "asc",
    },
    select: {
      role: true,
      workspace: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
    where: {
      userId: session.user.id,
    },
  });

  if (!membership) {
    redirect("/onboarding");
  }

  return (
    <div className="relative">
      <IdentifyUser
        userId={session.user.id}
        workspaceId={membership.workspace.id}
        workspaceSlug={membership.workspace.slug}
      />
      <Sidebar />
      <div className="md:ml-[70px] pb-4">
        <Header />
        <div className="px-4 md:px-8">{children}</div>
      </div>
    </div>
  );
}
