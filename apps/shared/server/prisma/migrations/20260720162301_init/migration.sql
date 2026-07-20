-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SoilHorizon" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "primaryCharacteristics" TEXT NOT NULL,
    "imageUrl" TEXT,

    CONSTRAINT "SoilHorizon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassificationSystem" (
    "id" TEXT NOT NULL,
    "systemName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "documentationUrl" TEXT,

    CONSTRAINT "ClassificationSystem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quiz" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "difficultyLevel" INTEGER NOT NULL,
    "creatorId" TEXT NOT NULL,

    CONSTRAINT "Quiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FieldEntry" (
    "id" TEXT NOT NULL,
    "dateObserved" TIMESTAMP(3) NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "notes" TEXT,
    "imageUrl" TEXT,
    "userId" TEXT NOT NULL,
    "horizonDetectedId" TEXT NOT NULL,

    CONSTRAINT "FieldEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizQuestion" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "correctAnswerId" TEXT NOT NULL,

    CONSTRAINT "QuizQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldEntry" ADD CONSTRAINT "FieldEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldEntry" ADD CONSTRAINT "FieldEntry_horizonDetectedId_fkey" FOREIGN KEY ("horizonDetectedId") REFERENCES "SoilHorizon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizQuestion" ADD CONSTRAINT "QuizQuestion_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizQuestion" ADD CONSTRAINT "QuizQuestion_correctAnswerId_fkey" FOREIGN KEY ("correctAnswerId") REFERENCES "SoilHorizon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
