/*
  Warnings:

  - You are about to drop the column `agriUse` on the `EcosystemRef` table. All the data in the column will be lost.
  - You are about to drop the column `engineeringUse` on the `EcosystemRef` table. All the data in the column will be lost.
  - You are about to drop the column `landscapePos` on the `EcosystemRef` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Level` table. All the data in the column will be lost.
  - You are about to drop the column `farmerName` on the `Level` table. All the data in the column will be lost.
  - You are about to drop the column `scenario` on the `Level` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Level` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[farmId]` on the table `Level` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `agriculturalNotes` to the `EcosystemRef` table without a default value. This is not possible if the table is not empty.
  - Added the required column `naturalEcosystemNotes` to the `EcosystemRef` table without a default value. This is not possible if the table is not empty.
  - Added the required column `urbanEcosystemNotes` to the `EcosystemRef` table without a default value. This is not possible if the table is not empty.
  - Added the required column `farmId` to the `Level` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "EcosystemRef" DROP COLUMN "agriUse",
DROP COLUMN "engineeringUse",
DROP COLUMN "landscapePos",
ADD COLUMN     "agriculturalNotes" TEXT NOT NULL,
ADD COLUMN     "naturalEcosystemNotes" TEXT NOT NULL,
ADD COLUMN     "urbanEcosystemNotes" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Level" DROP COLUMN "description",
DROP COLUMN "farmerName",
DROP COLUMN "scenario",
DROP COLUMN "title",
ADD COLUMN     "farmId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Farm" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "farmerName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "monolithId" INTEGER NOT NULL,

    CONSTRAINT "Farm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FarmDialogLine" (
    "id" SERIAL NOT NULL,
    "sequence" INTEGER NOT NULL,
    "speaker" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "farmId" INTEGER NOT NULL,
    "questionId" INTEGER,

    CONSTRAINT "FarmDialogLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Farm_monolithId_key" ON "Farm"("monolithId");

-- CreateIndex
CREATE UNIQUE INDEX "Level_farmId_key" ON "Level"("farmId");

-- AddForeignKey
ALTER TABLE "Farm" ADD CONSTRAINT "Farm_monolithId_fkey" FOREIGN KEY ("monolithId") REFERENCES "Monolith"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmDialogLine" ADD CONSTRAINT "FarmDialogLine_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmDialogLine" ADD CONSTRAINT "FarmDialogLine_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Level" ADD CONSTRAINT "Level_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
