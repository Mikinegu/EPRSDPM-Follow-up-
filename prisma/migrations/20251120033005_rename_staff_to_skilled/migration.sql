-- AlterTable
ALTER TABLE "Staff" RENAME TO "Skilled";
ALTER INDEX "Staff_pkey" RENAME TO "Skilled_pkey";
ALTER INDEX "Staff_siteId_idx" RENAME TO "Skilled_siteId_idx";
ALTER TABLE "Skilled" RENAME CONSTRAINT "Staff_siteId_fkey" TO "Skilled_siteId_fkey";

-- AlterTable
ALTER TABLE "StaffAttendance" RENAME TO "SkilledAttendance";
ALTER TABLE "SkilledAttendance" RENAME COLUMN "staffId" TO "skilledId";
ALTER INDEX "StaffAttendance_pkey" RENAME TO "SkilledAttendance_pkey";
ALTER INDEX "StaffAttendance_attendanceRecordId_idx" RENAME TO "SkilledAttendance_attendanceRecordId_idx";
ALTER INDEX "StaffAttendance_staffId_idx" RENAME TO "SkilledAttendance_skilledId_idx";
ALTER INDEX "StaffAttendance_attendanceRecordId_staffId_key" RENAME TO "SkilledAttendance_attendanceRecordId_skilledId_key";
ALTER TABLE "SkilledAttendance" RENAME CONSTRAINT "StaffAttendance_attendanceRecordId_fkey" TO "SkilledAttendance_attendanceRecordId_fkey";
ALTER TABLE "SkilledAttendance" RENAME CONSTRAINT "StaffAttendance_staffId_fkey" TO "SkilledAttendance_skilledId_fkey";

-- AlterTable
ALTER TABLE "StaffAssignment" RENAME TO "SkilledAssignment";
ALTER TABLE "SkilledAssignment" RENAME COLUMN "staffId" TO "skilledId";
ALTER INDEX "StaffAssignment_pkey" RENAME TO "SkilledAssignment_pkey";
ALTER INDEX "StaffAssignment_siteId_date_idx" RENAME TO "SkilledAssignment_siteId_date_idx";
ALTER INDEX "StaffAssignment_staffId_idx" RENAME TO "SkilledAssignment_skilledId_idx";
ALTER INDEX "StaffAssignment_siteId_date_staffId_key" RENAME TO "SkilledAssignment_siteId_date_skilledId_key";
ALTER TABLE "SkilledAssignment" RENAME CONSTRAINT "StaffAssignment_siteId_fkey" TO "SkilledAssignment_siteId_fkey";
ALTER TABLE "SkilledAssignment" RENAME CONSTRAINT "StaffAssignment_staffId_fkey" TO "SkilledAssignment_skilledId_fkey";

-- CreateTable
CREATE TABLE "Staff" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffAttendance" (
    "id" TEXT NOT NULL,
    "attendanceRecordId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "present" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffAssignment" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Staff_siteId_idx" ON "Staff"("siteId");

-- CreateIndex
CREATE INDEX "StaffAttendance_attendanceRecordId_idx" ON "StaffAttendance"("attendanceRecordId");

-- CreateIndex
CREATE INDEX "StaffAttendance_staffId_idx" ON "StaffAttendance"("staffId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffAttendance_attendanceRecordId_staffId_key" ON "StaffAttendance"("attendanceRecordId", "staffId");

-- CreateIndex
CREATE INDEX "StaffAssignment_siteId_date_idx" ON "StaffAssignment"("siteId", "date");

-- CreateIndex
CREATE INDEX "StaffAssignment_staffId_idx" ON "StaffAssignment"("staffId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffAssignment_siteId_date_staffId_key" ON "StaffAssignment"("siteId", "date", "staffId");

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffAttendance" ADD CONSTRAINT "StaffAttendance_attendanceRecordId_fkey" FOREIGN KEY ("attendanceRecordId") REFERENCES "AttendanceRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffAttendance" ADD CONSTRAINT "StaffAttendance_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffAssignment" ADD CONSTRAINT "StaffAssignment_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffAssignment" ADD CONSTRAINT "StaffAssignment_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
