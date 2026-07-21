-- CreateTable
CREATE TABLE "Monolith" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "modelUrl" TEXT NOT NULL,
    "finalSoilForm" TEXT NOT NULL,

    CONSTRAINT "Monolith_pkey" PRIMARY KEY ("id")
);
