/*
  Warnings:

  - A unique constraint covering the columns `[levelNumber]` on the table `Level` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[soilFamilyCodeId]` on the table `Level` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `soilFamilyCodeId` to the `Level` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Level" ADD COLUMN     "soilFamilyCodeId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Level_levelNumber_key" ON "Level"("levelNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Level_soilFamilyCodeId_key" ON "Level"("soilFamilyCodeId");

-- AddForeignKey
ALTER TABLE "Level" ADD CONSTRAINT "Level_soilFamilyCodeId_fkey" FOREIGN KEY ("soilFamilyCodeId") REFERENCES "SoilFamilyCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
