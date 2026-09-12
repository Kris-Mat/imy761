-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "horizonId" INTEGER;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_horizonId_fkey" FOREIGN KEY ("horizonId") REFERENCES "Horizon"("id") ON DELETE SET NULL ON UPDATE CASCADE;
