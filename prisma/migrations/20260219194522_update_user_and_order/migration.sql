/*
  Warnings:

  - You are about to drop the column `firstname` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "firstname",
ADD COLUMN     "firstName" TEXT;
