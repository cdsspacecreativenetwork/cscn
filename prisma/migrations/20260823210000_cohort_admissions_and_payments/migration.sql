-- Add guarded cohort offers to the existing purchase ledger.
ALTER TYPE "OrderType" ADD VALUE 'COHORT';

ALTER TABLE "CohortApplication"
ADD COLUMN "offerExpiresAt" TIMESTAMP(3);

ALTER TABLE "PurchaseOrder"
ADD COLUMN "cohortApplicationId" TEXT;

CREATE UNIQUE INDEX "PurchaseOrder_cohortApplicationId_key"
ON "PurchaseOrder"("cohortApplicationId");

CREATE INDEX "PurchaseOrder_cohortApplicationId_idx"
ON "PurchaseOrder"("cohortApplicationId");

ALTER TABLE "PurchaseOrder"
ADD CONSTRAINT "PurchaseOrder_cohortApplicationId_fkey"
FOREIGN KEY ("cohortApplicationId") REFERENCES "CohortApplication"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
