-- Initial private-alpha schema for managed Postgres deployments.
CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "emailVerifiedAt" TIMESTAMP(3),
  "name" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "wallet" TEXT,
  "walletVerifiedAt" TIMESTAMP(3),
  "walletNonce" TEXT,
  "walletNonceExpiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AppSession" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AppSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Program" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "targetTemplateId" TEXT NOT NULL DEFAULT 'refund-agent',
  "visibility" TEXT NOT NULL DEFAULT 'private',
  "scopeConfig" TEXT,
  "policyConfig" TEXT,
  "rewardConfig" TEXT,
  "rewardCriticalWei" TEXT NOT NULL DEFAULT '50000000000000000',
  "rewardHighWei" TEXT NOT NULL DEFAULT '20000000000000000',
  "rewardMediumWei" TEXT NOT NULL DEFAULT '10000000000000000',
  "rewardLowWei" TEXT NOT NULL DEFAULT '5000000000000000',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "chainProgramIndex" INTEGER,
  "escrowTx" TEXT,
  "poolBalanceWei" TEXT NOT NULL DEFAULT '0',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgentSession" (
  "id" TEXT NOT NULL,
  "programId" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "sessionType" TEXT NOT NULL DEFAULT 'researcher',
  "status" TEXT NOT NULL DEFAULT 'active',
  "modelId" TEXT,
  "modelParams" TEXT,
  "systemPromptHash" TEXT,
  "toolConfigHash" TEXT,
  "environmentSnapshot" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "closedAt" TIMESTAMP(3),
  CONSTRAINT "AgentSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TraceEvent" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "index" INTEGER NOT NULL,
  "type" TEXT NOT NULL,
  "toolName" TEXT,
  "payload" TEXT NOT NULL,
  "flagged" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TraceEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Submission" (
  "id" TEXT NOT NULL,
  "programId" TEXT NOT NULL,
  "researcherId" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "stepsToRepro" TEXT NOT NULL,
  "expectedBehavior" TEXT NOT NULL,
  "actualBehavior" TEXT NOT NULL,
  "severity" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "replayResult" TEXT,
  "replaySessionId" TEXT,
  "replayDetail" TEXT,
  "replayComparison" TEXT,
  "verifierNote" TEXT,
  "payoutWei" TEXT,
  "evidenceHash" TEXT,
  "reportHash" TEXT,
  "chainFindingId" INTEGER,
  "submitFindingTx" TEXT,
  "payoutTx" TEXT,
  "researcherWallet" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "AppSession_tokenHash_key" ON "AppSession"("tokenHash");
CREATE INDEX "AppSession_userId_idx" ON "AppSession"("userId");
CREATE INDEX "AppSession_expiresAt_idx" ON "AppSession"("expiresAt");
CREATE INDEX "Program_companyId_idx" ON "Program"("companyId");
CREATE INDEX "Program_targetTemplateId_idx" ON "Program"("targetTemplateId");
CREATE INDEX "Program_visibility_active_idx" ON "Program"("visibility", "active");
CREATE UNIQUE INDEX "TraceEvent_sessionId_index_key" ON "TraceEvent"("sessionId", "index");
CREATE UNIQUE INDEX "Submission_sessionId_key" ON "Submission"("sessionId");

ALTER TABLE "AppSession" ADD CONSTRAINT "AppSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Program" ADD CONSTRAINT "Program_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AgentSession" ADD CONSTRAINT "AgentSession_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AgentSession" ADD CONSTRAINT "AgentSession_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TraceEvent" ADD CONSTRAINT "TraceEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AgentSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_researcherId_fkey" FOREIGN KEY ("researcherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AgentSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
