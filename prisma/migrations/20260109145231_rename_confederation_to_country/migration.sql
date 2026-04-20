-- AlterTable: Rename Confederation to Country
ALTER TABLE "Confederation" RENAME TO "Country";

-- AlterTable: Rename confederationId to countryId in Team
ALTER TABLE "Team" RENAME COLUMN "confederationId" TO "countryId";
