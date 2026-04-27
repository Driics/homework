-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Card" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "maskedPan" TEXT NOT NULL,
    "last4" TEXT NOT NULL,
    "cardholderName" TEXT NOT NULL,
    "expiryMonth" INTEGER NOT NULL,
    "expiryYear" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "ledgerBalanceMinor" INTEGER NOT NULL,
    "availableBalanceMinor" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Card_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Authorization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cardId" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "direction" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "merchantName" TEXT NOT NULL,
    "merchantCategory" TEXT NOT NULL,
    "merchantCountry" TEXT NOT NULL,
    "merchantCity" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "declineReason" TEXT,
    "authorizedAt" DATETIME NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "Authorization_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cardId" TEXT NOT NULL,
    "authorizationId" TEXT,
    "amountMinor" INTEGER NOT NULL,
    "direction" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "merchantName" TEXT NOT NULL,
    "merchantCategory" TEXT NOT NULL,
    "merchantCountry" TEXT NOT NULL,
    "merchantCity" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "postedAt" DATETIME NOT NULL,
    CONSTRAINT "Transaction_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Transaction_authorizationId_fkey" FOREIGN KEY ("authorizationId") REFERENCES "Authorization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Card_userId_idx" ON "Card"("userId");

-- CreateIndex
CREATE INDEX "Authorization_cardId_authorizedAt_idx" ON "Authorization"("cardId", "authorizedAt");

-- CreateIndex
CREATE INDEX "Transaction_cardId_postedAt_idx" ON "Transaction"("cardId", "postedAt");

-- CreateIndex
CREATE INDEX "Transaction_authorizationId_idx" ON "Transaction"("authorizationId");
