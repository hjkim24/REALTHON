/*
  Warnings:

  - You are about to drop the `Lecture` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LectureDay` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TimeTable` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Semester" AS ENUM ('S1', 'S2', 'SUMMER', 'WINTER');

-- CreateEnum
CREATE TYPE "Grade" AS ENUM ('A_PLUS', 'A', 'B_PLUS', 'B', 'C_PLUS', 'C', 'D_PLUS', 'D', 'F', 'P');

-- DropForeignKey
ALTER TABLE "Lecture" DROP CONSTRAINT "Lecture_timeTableId_fkey";

-- DropForeignKey
ALTER TABLE "LectureDay" DROP CONSTRAINT "LectureDay_lectureId_fkey";

-- DropTable
DROP TABLE "Lecture";

-- DropTable
DROP TABLE "LectureDay";

-- DropTable
DROP TABLE "TimeTable";

-- DropEnum
DROP TYPE "days";

-- CreateTable
CREATE TABLE "Department" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "nameKo" TEXT NOT NULL,
    "nameEn" TEXT,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" SERIAL NOT NULL,
    "departmentId" INTEGER NOT NULL,
    "courseCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "grade" "Grade" NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Department_code_key" ON "Department"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Course_departmentId_courseCode_key" ON "Course"("departmentId", "courseCode");

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
