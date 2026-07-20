/*
  Warnings:

  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `ClassificationSystem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FieldEntry` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Quiz` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `QuizQuestion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SoilHorizon` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `username` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "QuestionCategory" AS ENUM ('MUNSELL', 'DELINEATION');

-- DropForeignKey
ALTER TABLE "FieldEntry" DROP CONSTRAINT "FieldEntry_horizonDetectedId_fkey";

-- DropForeignKey
ALTER TABLE "FieldEntry" DROP CONSTRAINT "FieldEntry_userId_fkey";

-- DropForeignKey
ALTER TABLE "Quiz" DROP CONSTRAINT "Quiz_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "QuizQuestion" DROP CONSTRAINT "QuizQuestion_correctAnswerId_fkey";

-- DropForeignKey
ALTER TABLE "QuizQuestion" DROP CONSTRAINT "QuizQuestion_quizId_fkey";

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
ADD COLUMN     "username" TEXT NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "ClassificationSystem";

-- DropTable
DROP TABLE "FieldEntry";

-- DropTable
DROP TABLE "Quiz";

-- DropTable
DROP TABLE "QuizQuestion";

-- DropTable
DROP TABLE "SoilHorizon";

-- CreateTable
CREATE TABLE "Horizon" (
    "id" SERIAL NOT NULL,
    "depthTopMm" INTEGER NOT NULL,
    "depthBottomMm" INTEGER NOT NULL,
    "correctHue" TEXT NOT NULL,
    "correctValue" INTEGER NOT NULL,
    "correctChroma" INTEGER NOT NULL,
    "monolithId" INTEGER NOT NULL,
    "diagRefId" INTEGER NOT NULL,

    CONSTRAINT "Horizon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosticHorizonRef" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "criticalConcepts" TEXT NOT NULL,

    CONSTRAINT "DiagnosticHorizonRef_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EcosystemRef" (
    "id" SERIAL NOT NULL,
    "landscapePos" TEXT NOT NULL,
    "agriUse" TEXT NOT NULL,
    "engineeringUse" TEXT NOT NULL,
    "diagRefId" INTEGER NOT NULL,

    CONSTRAINT "EcosystemRef_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserGameStat" (
    "id" SERIAL NOT NULL,
    "totalXp" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "currentLevelId" INTEGER NOT NULL,

    CONSTRAINT "UserGameStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Level" (
    "id" SERIAL NOT NULL,
    "levelNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "farmerName" TEXT NOT NULL,
    "scenario" TEXT NOT NULL,

    CONSTRAINT "Level_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" SERIAL NOT NULL,
    "category" "QuestionCategory" NOT NULL,
    "basePoints" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "monolithId" INTEGER NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAttempt" (
    "id" SERIAL NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "pointsEarned" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "userId" INTEGER NOT NULL,
    "questionId" INTEGER NOT NULL,

    CONSTRAINT "UserAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AchievementMaster" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "criteriaCode" TEXT NOT NULL,

    CONSTRAINT "AchievementMaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAchievement" (
    "id" SERIAL NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "achievementId" INTEGER NOT NULL,

    CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserGameStat_userId_key" ON "UserGameStat"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserAchievement_userId_achievementId_key" ON "UserAchievement"("userId", "achievementId");

-- AddForeignKey
ALTER TABLE "Horizon" ADD CONSTRAINT "Horizon_monolithId_fkey" FOREIGN KEY ("monolithId") REFERENCES "Monolith"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Horizon" ADD CONSTRAINT "Horizon_diagRefId_fkey" FOREIGN KEY ("diagRefId") REFERENCES "DiagnosticHorizonRef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EcosystemRef" ADD CONSTRAINT "EcosystemRef_diagRefId_fkey" FOREIGN KEY ("diagRefId") REFERENCES "DiagnosticHorizonRef"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGameStat" ADD CONSTRAINT "UserGameStat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGameStat" ADD CONSTRAINT "UserGameStat_currentLevelId_fkey" FOREIGN KEY ("currentLevelId") REFERENCES "Level"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_monolithId_fkey" FOREIGN KEY ("monolithId") REFERENCES "Monolith"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAttempt" ADD CONSTRAINT "UserAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAttempt" ADD CONSTRAINT "UserAttempt_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "AchievementMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
