/*
  Warnings:

  - The `status` column on the `Cooperative` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Meter` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `operational_status` column on the `Meter` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Reading` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `RxInfo` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[status_type_id,value]` on the table `StatusValue` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Made the column `name` on table `Cooperative` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `Cooperative` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `Cooperative` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `Gateway` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `Gateway` required. This step will fail if there are existing NULL values in that column.
  - Made the column `device_name` on table `Meter` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `Meter` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `Meter` required. This step will fail if there are existing NULL values in that column.
  - Made the column `timestamp` on table `Reading` required. This step will fail if there are existing NULL values in that column.
  - Made the column `adr` on table `Reading` required. This step will fail if there are existing NULL values in that column.
  - Made the column `time` on table `RxInfo` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `Status` required. This step will fail if there are existing NULL values in that column.
  - Made the column `username` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `email` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `password` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `assigned_at` on table `UserMeter` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `UserRole` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "CooperativeStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING', 'BLOCKED');

-- CreateEnum
CREATE TYPE "MeterStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'FAULTY');

-- CreateEnum
CREATE TYPE "OperationalStatus" AS ENUM ('OPERATIONAL', 'ERROR', 'NEEDS_MAINTENANCE');

-- CreateEnum
CREATE TYPE "ReadingStatus" AS ENUM ('VALID', 'INVALID', 'UNDER_REVIEW', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RxInfoStatus" AS ENUM ('RECEIVED', 'FAILED', 'DELAYED', 'ARCHIVED');

-- DropForeignKey
ALTER TABLE "Reading" DROP CONSTRAINT "Reading_meter_id_fkey";

-- DropForeignKey
ALTER TABLE "RxInfo" DROP CONSTRAINT "RxInfo_gateway_id_fkey";

-- DropForeignKey
ALTER TABLE "RxInfo" DROP CONSTRAINT "RxInfo_reading_id_fkey";

-- DropForeignKey
ALTER TABLE "Status" DROP CONSTRAINT "Status_reading_id_fkey";

-- DropForeignKey
ALTER TABLE "Status" DROP CONSTRAINT "Status_status_type_id_fkey";

-- DropForeignKey
ALTER TABLE "Status" DROP CONSTRAINT "Status_status_value_id_fkey";

-- DropForeignKey
ALTER TABLE "StatusValue" DROP CONSTRAINT "StatusValue_status_type_id_fkey";

-- DropForeignKey
ALTER TABLE "UserMeter" DROP CONSTRAINT "UserMeter_meter_id_fkey";

-- DropForeignKey
ALTER TABLE "UserMeter" DROP CONSTRAINT "UserMeter_user_id_fkey";

-- DropForeignKey
ALTER TABLE "UserRole" DROP CONSTRAINT "UserRole_role_id_fkey";

-- DropForeignKey
ALTER TABLE "UserRole" DROP CONSTRAINT "UserRole_user_id_fkey";

-- DropIndex
DROP INDEX "StatusValue_value_key";

-- AlterTable
ALTER TABLE "Cooperative" ALTER COLUMN "name" SET NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "CooperativeStatus" NOT NULL DEFAULT 'ACTIVE',
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updated_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "Gateway" ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updated_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "Meter" ALTER COLUMN "device_name" SET NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "MeterStatus" NOT NULL DEFAULT 'ACTIVE',
DROP COLUMN "operational_status",
ADD COLUMN     "operational_status" "OperationalStatus" NOT NULL DEFAULT 'OPERATIONAL',
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updated_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "Reading" ALTER COLUMN "timestamp" SET NOT NULL,
ALTER COLUMN "timestamp" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "adr" SET NOT NULL,
ALTER COLUMN "adr" SET DEFAULT false,
DROP COLUMN "status",
ADD COLUMN     "status" "ReadingStatus" NOT NULL DEFAULT 'VALID';

-- AlterTable
ALTER TABLE "RxInfo" ALTER COLUMN "time" SET NOT NULL,
ALTER COLUMN "time" SET DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "status",
ADD COLUMN     "status" "RxInfoStatus" NOT NULL DEFAULT 'RECEIVED';

-- AlterTable
ALTER TABLE "Status" ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL,
ALTER COLUMN "email" SET NOT NULL,
ALTER COLUMN "password" SET NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updated_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "UserMeter" ALTER COLUMN "assigned_at" SET NOT NULL,
ALTER COLUMN "assigned_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "UserRole" ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "Meter_dev_eui_idx" ON "Meter"("dev_eui");

-- CreateIndex
CREATE INDEX "Reading_meter_id_idx" ON "Reading"("meter_id");

-- CreateIndex
CREATE INDEX "Reading_timestamp_idx" ON "Reading"("timestamp");

-- CreateIndex
CREATE INDEX "RxInfo_reading_id_idx" ON "RxInfo"("reading_id");

-- CreateIndex
CREATE INDEX "RxInfo_gateway_id_idx" ON "RxInfo"("gateway_id");

-- CreateIndex
CREATE INDEX "RxInfo_time_idx" ON "RxInfo"("time");

-- CreateIndex
CREATE INDEX "Status_reading_id_idx" ON "Status"("reading_id");

-- CreateIndex
CREATE INDEX "Status_status_type_id_idx" ON "Status"("status_type_id");

-- CreateIndex
CREATE INDEX "Status_status_value_id_idx" ON "Status"("status_value_id");

-- CreateIndex
CREATE INDEX "StatusValue_status_type_id_idx" ON "StatusValue"("status_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "StatusValue_status_type_id_value_key" ON "StatusValue"("status_type_id", "value");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "UserMeter_user_id_idx" ON "UserMeter"("user_id");

-- CreateIndex
CREATE INDEX "UserMeter_meter_id_idx" ON "UserMeter"("meter_id");

-- CreateIndex
CREATE INDEX "UserRole_user_id_idx" ON "UserRole"("user_id");

-- CreateIndex
CREATE INDEX "UserRole_role_id_idx" ON "UserRole"("role_id");

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMeter" ADD CONSTRAINT "UserMeter_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMeter" ADD CONSTRAINT "UserMeter_meter_id_fkey" FOREIGN KEY ("meter_id") REFERENCES "Meter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reading" ADD CONSTRAINT "Reading_meter_id_fkey" FOREIGN KEY ("meter_id") REFERENCES "Meter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Status" ADD CONSTRAINT "Status_reading_id_fkey" FOREIGN KEY ("reading_id") REFERENCES "Reading"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Status" ADD CONSTRAINT "Status_status_type_id_fkey" FOREIGN KEY ("status_type_id") REFERENCES "StatusType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Status" ADD CONSTRAINT "Status_status_value_id_fkey" FOREIGN KEY ("status_value_id") REFERENCES "StatusValue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusValue" ADD CONSTRAINT "StatusValue_status_type_id_fkey" FOREIGN KEY ("status_type_id") REFERENCES "StatusType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RxInfo" ADD CONSTRAINT "RxInfo_reading_id_fkey" FOREIGN KEY ("reading_id") REFERENCES "Reading"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RxInfo" ADD CONSTRAINT "RxInfo_gateway_id_fkey" FOREIGN KEY ("gateway_id") REFERENCES "Gateway"("id") ON DELETE CASCADE ON UPDATE CASCADE;
