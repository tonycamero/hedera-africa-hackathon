-- AlterTable
ALTER TABLE "User" ADD COLUMN     "directoryOptIn" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "displayName" TEXT;
