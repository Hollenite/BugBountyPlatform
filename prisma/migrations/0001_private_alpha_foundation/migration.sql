-- Additive private-alpha foundation for local SQLite development.
ALTER TABLE "User" ADD COLUMN "emailVerifiedAt" DATETIME;
ALTER TABLE "User" ADD COLUMN "walletVerifiedAt" DATETIME;
ALTER TABLE "User" ADD COLUMN "walletNonce" TEXT;
ALTER TABLE "User" ADD COLUMN "walletNonceExpiresAt" DATETIME;
ALTER TABLE "User" ADD COLUMN "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE "AppSession" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" DATETIME NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AppSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "AppSession_tokenHash_key" ON "AppSession"("tokenHash");
CREATE INDEX "AppSession_userId_idx" ON "AppSession"("userId");
CREATE INDEX "AppSession_expiresAt_idx" ON "AppSession"("expiresAt");

ALTER TABLE "Program" ADD COLUMN "targetTemplateId" TEXT NOT NULL DEFAULT 'refund-agent';
ALTER TABLE "Program" ADD COLUMN "visibility" TEXT NOT NULL DEFAULT 'private';
ALTER TABLE "Program" ADD COLUMN "scopeConfig" TEXT;
ALTER TABLE "Program" ADD COLUMN "policyConfig" TEXT;
ALTER TABLE "Program" ADD COLUMN "rewardConfig" TEXT;
ALTER TABLE "Program" ADD COLUMN "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "Program_companyId_idx" ON "Program"("companyId");
CREATE INDEX "Program_targetTemplateId_idx" ON "Program"("targetTemplateId");
CREATE INDEX "Program_visibility_active_idx" ON "Program"("visibility", "active");
