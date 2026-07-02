import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

export type { Prisma } from "../generated/prisma/client";
export {
  BillingProvider,
  FollowUpChannel,
  FollowUpStatus,
  MembershipRole,
  ServiceJobStatus,
  WorkspacePlan,
  WorkspacePlanStatus,
} from "../generated/prisma/enums";
export {
  buildWorkspaceTemplateSeed,
  type StarterTemplate,
  starterFollowUpTemplates,
} from "./seed";
export * from "./queries";
export { PrismaClient };

const globalForDb = globalThis as typeof globalThis & {
  afterserviceDb?: PrismaClient;
};

export function createDbClient(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to create a Prisma client.");
  }

  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({ adapter });
}

export function getDbClient() {
  if (!globalForDb.afterserviceDb) {
    globalForDb.afterserviceDb = createDbClient();
  }

  return globalForDb.afterserviceDb;
}
