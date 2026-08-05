-- AlterEnum
BEGIN;
CREATE TYPE "QuestionCategory_new" AS ENUM ('DIAGNOSTIC_HORIZONS', 'SOIL_FORM', 'LANDSCAPE_POSITION', 'SUITABILITY');
ALTER TABLE "Question" ALTER COLUMN "category" TYPE "QuestionCategory_new" USING ("category"::text::"QuestionCategory_new");
ALTER TYPE "QuestionCategory" RENAME TO "QuestionCategory_old";
ALTER TYPE "QuestionCategory_new" RENAME TO "QuestionCategory";
DROP TYPE "public"."QuestionCategory_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "EcosystemRef" DROP CONSTRAINT "EcosystemRef_diagRefId_fkey";

-- DropForeignKey
ALTER TABLE "Horizon" DROP CONSTRAINT "Horizon_diagRefId_fkey";

-- AlterTable
-- NOT NULL columns are added with a temporary default so existing rows
-- (this content is fully deleted and rebuilt by prisma/seed.ts right after
-- this migration runs) don't violate the constraint on deploy.
ALTER TABLE "Horizon" DROP COLUMN "correctChroma",
DROP COLUMN "correctHue",
DROP COLUMN "correctValue",
DROP COLUMN "depthBottomMm",
DROP COLUMN "depthTopMm",
DROP COLUMN "diagRefId",
ADD COLUMN     "colourChroma" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "colourHue" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "colourText" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "colourValue" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "label" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "orderIndex" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Horizon" ALTER COLUMN "colourChroma" DROP DEFAULT,
ALTER COLUMN "colourHue" DROP DEFAULT,
ALTER COLUMN "colourText" DROP DEFAULT,
ALTER COLUMN "colourValue" DROP DEFAULT,
ALTER COLUMN "label" DROP DEFAULT,
ALTER COLUMN "orderIndex" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Monolith" DROP COLUMN "modelUrl",
ADD COLUMN     "imageUrl" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "orderIndex" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Monolith" ALTER COLUMN "imageUrl" DROP DEFAULT,
ALTER COLUMN "orderIndex" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Question" DROP COLUMN "basePoints",
DROP COLUMN "description",
ADD COLUMN     "orderIndex" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "prompt" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Question" ALTER COLUMN "orderIndex" DROP DEFAULT,
ALTER COLUMN "prompt" DROP DEFAULT;

-- DropTable
DROP TABLE "DiagnosticHorizonRef";

-- DropTable
DROP TABLE "EcosystemRef";

-- CreateTable
CREATE TABLE "HorizonCharacteristic" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "horizonId" INTEGER NOT NULL,

    CONSTRAINT "HorizonCharacteristic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnswerOption" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "questionId" INTEGER NOT NULL,

    CONSTRAINT "AnswerOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SoilFamilyCode" (
    "id" SERIAL NOT NULL,
    "finalCode" TEXT NOT NULL,
    "soilFamilyName" TEXT NOT NULL,
    "monolithId" INTEGER NOT NULL,

    CONSTRAINT "SoilFamilyCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SoilFamilyField" (
    "id" SERIAL NOT NULL,
    "label" TEXT NOT NULL,
    "correctValue" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "soilFamilyCodeId" INTEGER NOT NULL,

    CONSTRAINT "SoilFamilyField_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SoilFamilyCode_monolithId_key" ON "SoilFamilyCode"("monolithId");

-- AddForeignKey
ALTER TABLE "HorizonCharacteristic" ADD CONSTRAINT "HorizonCharacteristic_horizonId_fkey" FOREIGN KEY ("horizonId") REFERENCES "Horizon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerOption" ADD CONSTRAINT "AnswerOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoilFamilyCode" ADD CONSTRAINT "SoilFamilyCode_monolithId_fkey" FOREIGN KEY ("monolithId") REFERENCES "Monolith"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoilFamilyField" ADD CONSTRAINT "SoilFamilyField_soilFamilyCodeId_fkey" FOREIGN KEY ("soilFamilyCodeId") REFERENCES "SoilFamilyCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

