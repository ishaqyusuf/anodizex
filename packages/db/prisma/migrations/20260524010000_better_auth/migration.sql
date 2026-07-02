-- DropIndex
DROP INDEX "Account_providerId_providerAccountId_key";

-- AlterTable
ALTER TABLE "Account" DROP COLUMN "expiresAt",
ADD COLUMN     "accessTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "accountId" TEXT,
ADD COLUMN     "idToken" TEXT,
ADD COLUMN     "password" TEXT,
ADD COLUMN     "refreshTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "scope" TEXT;

UPDATE "Account" SET "accountId" = "providerAccountId";

ALTER TABLE "Account" ALTER COLUMN "accountId" SET NOT NULL,
DROP COLUMN "providerAccountId";

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "userAgent" TEXT;

UPDATE "User" SET "name" = '' WHERE "name" IS NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "imageUrl",
ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "image" TEXT,
ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "name" SET DEFAULT '';

-- CreateIndex
CREATE UNIQUE INDEX "Account_providerId_accountId_key" ON "Account"("providerId", "accountId");
