/*
  Warnings:

  - You are about to drop the `LeagueDraw` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `leagueDrawId` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Pot` table. All the data in the column will be lost.
  - You are about to drop the column `leagueDrawId` on the `Pot` table. All the data in the column will be lost.
  - You are about to drop the column `pot_number` on the `Pot` table. All the data in the column will be lost.
  - You are about to drop the column `confederation` on the `Team` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Team` table. All the data in the column will be lost.
  - You are about to drop the column `potId` on the `Team` table. All the data in the column will be lost.
  - Added the required column `drawId` to the `Match` table without a default value. This is not possible if the table is not empty.
  - Added the required column `matchDay` to the `Match` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Pot` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "LeagueDraw_season_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "LeagueDraw";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Confederation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Draw" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "DrawTeamPot" (
    "drawId" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,
    "potId" INTEGER NOT NULL,
    CONSTRAINT "DrawTeamPot_drawId_fkey" FOREIGN KEY ("drawId") REFERENCES "Draw" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DrawTeamPot_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DrawTeamPot_potId_fkey" FOREIGN KEY ("potId") REFERENCES "Pot" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Match" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "drawId" INTEGER NOT NULL,
    "homeTeamId" INTEGER NOT NULL,
    "awayTeamId" INTEGER NOT NULL,
    "matchDay" INTEGER NOT NULL,
    CONSTRAINT "Match_drawId_fkey" FOREIGN KEY ("drawId") REFERENCES "Draw" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Match_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Match_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Match" ("awayTeamId", "homeTeamId", "id") SELECT "awayTeamId", "homeTeamId", "id" FROM "Match";
DROP TABLE "Match";
ALTER TABLE "new_Match" RENAME TO "Match";
CREATE INDEX "Match_drawId_idx" ON "Match"("drawId");
CREATE INDEX "Match_matchDay_idx" ON "Match"("matchDay");
CREATE INDEX "Match_homeTeamId_idx" ON "Match"("homeTeamId");
CREATE INDEX "Match_awayTeamId_idx" ON "Match"("awayTeamId");
CREATE TABLE "new_Pot" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);
INSERT INTO "new_Pot" ("id") SELECT "id" FROM "Pot";
DROP TABLE "Pot";
ALTER TABLE "new_Pot" RENAME TO "Pot";
CREATE UNIQUE INDEX "Pot_name_key" ON "Pot"("name");
CREATE TABLE "new_Team" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "confederationId" INTEGER,
    CONSTRAINT "Team_confederationId_fkey" FOREIGN KEY ("confederationId") REFERENCES "Confederation" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Team" ("id", "name") SELECT "id", "name" FROM "Team";
DROP TABLE "Team";
ALTER TABLE "new_Team" RENAME TO "Team";
CREATE UNIQUE INDEX "Team_name_key" ON "Team"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Confederation_name_key" ON "Confederation"("name");

-- CreateIndex
CREATE INDEX "DrawTeamPot_drawId_potId_idx" ON "DrawTeamPot"("drawId", "potId");

-- CreateIndex
CREATE UNIQUE INDEX "DrawTeamPot_drawId_teamId_key" ON "DrawTeamPot"("drawId", "teamId");
