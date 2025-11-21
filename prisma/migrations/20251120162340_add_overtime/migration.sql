/*
  Warnings:

  - A unique constraint covering the columns `[date,siteId]` on the table `AttendanceRecord` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "DLAttendance" ADD COLUMN     "overtimeHours" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "SkilledAttendance" ADD COLUMN     "overtimeHours" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "StaffAttendance" ADD COLUMN     "overtimeHours" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_date_siteId_key" ON "AttendanceRecord"("date", "siteId");
