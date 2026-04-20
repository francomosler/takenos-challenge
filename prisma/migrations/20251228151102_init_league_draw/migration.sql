-- CreateTable
CREATE TABLE "LeagueDraw" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "season" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Pot" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pot_number" INTEGER NOT NULL,
    "leagueDrawId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Pot_leagueDrawId_fkey" FOREIGN KEY ("leagueDrawId") REFERENCES "LeagueDraw" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Match" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "leagueDrawId" INTEGER NOT NULL,
    "homeTeamId" INTEGER NOT NULL,
    "awayTeamId" INTEGER NOT NULL,
    CONSTRAINT "Match_leagueDrawId_fkey" FOREIGN KEY ("leagueDrawId") REFERENCES "LeagueDraw" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Match_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Match_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Team" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "potId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Team_potId_fkey" FOREIGN KEY ("potId") REFERENCES "Pot" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Team" ("id", "name") SELECT "id", "name" FROM "Team";
DROP TABLE "Team";
ALTER TABLE "new_Team" RENAME TO "Team";
CREATE UNIQUE INDEX "Team_name_key" ON "Team"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "LeagueDraw_season_key" ON "LeagueDraw"("season");

-- CreateIndex
CREATE UNIQUE INDEX "Pot_pot_number_key" ON "Pot"("pot_number");
