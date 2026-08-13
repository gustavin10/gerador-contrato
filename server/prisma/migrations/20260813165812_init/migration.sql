-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "template" TEXT NOT NULL,
    "contractorName" TEXT NOT NULL,
    "contractorDoc" TEXT NOT NULL,
    "contractorAddress" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientDoc" TEXT NOT NULL,
    "clientAddress" TEXT NOT NULL,
    "serviceDescription" TEXT NOT NULL,
    "valueCents" INTEGER NOT NULL,
    "paymentTerms" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "deadlineDays" INTEGER NOT NULL,
    "city" TEXT NOT NULL,
    "conditions" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "Contract_createdAt_idx" ON "Contract"("createdAt");
