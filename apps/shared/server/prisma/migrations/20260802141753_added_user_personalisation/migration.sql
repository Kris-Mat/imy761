-- CreateTable
CREATE TABLE "UserPersonalisation" (
    "id" SERIAL NOT NULL,
    "avatarConfig" JSONB NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "UserPersonalisation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserPersonalisation_userId_key" ON "UserPersonalisation"("userId");

-- AddForeignKey
ALTER TABLE "UserPersonalisation" ADD CONSTRAINT "UserPersonalisation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
