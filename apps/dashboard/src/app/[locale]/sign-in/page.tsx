import { getDbClient } from "@anodizex/db";
import type { Metadata } from "next";
import { SignInView } from "@/components/auth/sign-in-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in | afterservice",
  description: "Sign in to the afterservice dashboard.",
};

type DbAccountDebug = {
  accounts: Array<{
    accountId: string;
    id: string;
    providerId: string;
    userId: string;
  }>;
  error?: string;
};

const AUTH_DEBUG =
  process.env.AFTERSERVICE_AUTH_DEBUG === "true" ||
  process.env.AUTH_DEBUG === "true";

export default async function SignInPage() {
  return <SignInView dbAccountDebug={await getDbAccountDebug()} />;
}

async function getDbAccountDebug(): Promise<DbAccountDebug | undefined> {
  if (!AUTH_DEBUG) {
    return undefined;
  }

  try {
    const db = getDbClient();
    const accounts = await db.account.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        accountId: true,
        id: true,
        providerId: true,
        userId: true,
      },
      take: 20,
    });

    return { accounts };
  } catch (error) {
    return {
      accounts: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
