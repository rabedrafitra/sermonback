-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'SUPERUSER';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "address" TEXT,
ADD COLUMN     "phone" TEXT;
