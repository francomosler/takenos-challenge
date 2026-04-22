-- Add singleton enforcement columns to Draw. SQLite requires a table
-- rebuild because we are adding a UNIQUE column and a new nullable one.
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Draw" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activeSingleton" INTEGER,
    "archivedAt" DATETIME
);

-- Preserve any existing rows. If there were multiple draws (shouldn't happen
-- in practice) only the most recent one keeps activeSingleton = 1; the rest
-- are treated as already archived. This avoids the unique-constraint conflict.
INSERT INTO "new_Draw" ("id", "createdAt", "activeSingleton", "archivedAt")
SELECT
    "id",
    "createdAt",
    CASE
        WHEN "id" = (SELECT MAX("id") FROM "Draw") THEN 1
        ELSE NULL
    END AS "activeSingleton",
    CASE
        WHEN "id" = (SELECT MAX("id") FROM "Draw") THEN NULL
        ELSE "createdAt"
    END AS "archivedAt"
FROM "Draw";

DROP TABLE "Draw";
ALTER TABLE "new_Draw" RENAME TO "Draw";

CREATE UNIQUE INDEX "Draw_activeSingleton_key" ON "Draw"("activeSingleton");

PRAGMA foreign_key_check("Draw");
PRAGMA foreign_keys=ON;
