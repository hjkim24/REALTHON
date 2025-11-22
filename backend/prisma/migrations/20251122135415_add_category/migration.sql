-- CreateEnum
CREATE TYPE "Category" AS ENUM ('Major', 'General');

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "category" "Category" NOT NULL DEFAULT 'General';
