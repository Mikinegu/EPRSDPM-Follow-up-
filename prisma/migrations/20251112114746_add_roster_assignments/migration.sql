-- CreateTable
CREATE TABLE "StaffAssignment" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DLAssignment" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "dlId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DLAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StaffAssignment_siteId_date_idx" ON "StaffAssignment"("siteId", "date");

-- CreateIndex
CREATE INDEX "StaffAssignment_staffId_idx" ON "StaffAssignment"("staffId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffAssignment_siteId_date_staffId_key" ON "StaffAssignment"("siteId", "date", "staffId");

-- CreateIndex
CREATE INDEX "DLAssignment_siteId_date_idx" ON "DLAssignment"("siteId", "date");

-- CreateIndex
CREATE INDEX "DLAssignment_dlId_idx" ON "DLAssignment"("dlId");

-- CreateIndex
CREATE UNIQUE INDEX "DLAssignment_siteId_date_dlId_key" ON "DLAssignment"("siteId", "date", "dlId");

-- AddForeignKey
ALTER TABLE "StaffAssignment" ADD CONSTRAINT "StaffAssignment_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffAssignment" ADD CONSTRAINT "StaffAssignment_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DLAssignment" ADD CONSTRAINT "DLAssignment_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DLAssignment" ADD CONSTRAINT "DLAssignment_dlId_fkey" FOREIGN KEY ("dlId") REFERENCES "DL"("id") ON DELETE CASCADE ON UPDATE CASCADE;
