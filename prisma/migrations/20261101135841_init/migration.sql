-- CreateEnum
CREATE TYPE "Role" AS ENUM ('field_verifier', 'approving_officer');

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('old_age', 'widow');

-- CreateEnum
CREATE TYPE "Stage" AS ENUM ('stage1', 'stage2', 'stage3');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('in_progress', 'returned', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "EventAction" AS ENUM ('forward', 'return_app', 'reject', 'approve');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "applicantName" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "dob" TIMESTAMP(3) NOT NULL,
    "gender" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "monthlyIncome" INTEGER NOT NULL,
    "spouseDeceased" BOOLEAN,
    "remarried" BOOLEAN,
    "aadhaarNo" TEXT NOT NULL,
    "bankAccount" TEXT NOT NULL,
    "stage" "Stage" NOT NULL DEFAULT 'stage1',
    "status" "Status" NOT NULL DEFAULT 'in_progress',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationEvent" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "stage" "Stage" NOT NULL,
    "action" "EventAction" NOT NULL,
    "remarks" TEXT NOT NULL,
    "aiAssisted" BOOLEAN NOT NULL DEFAULT false,
    "aiEdited" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "Application_stage_status_idx" ON "Application"("stage", "status");

-- CreateIndex
CREATE INDEX "ApplicationEvent_applicationId_createdAt_idx" ON "ApplicationEvent"("applicationId", "createdAt");

-- AddForeignKey
ALTER TABLE "ApplicationEvent" ADD CONSTRAINT "ApplicationEvent_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationEvent" ADD CONSTRAINT "ApplicationEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
