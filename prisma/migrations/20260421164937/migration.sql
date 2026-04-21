-- RedefineIndex
DROP INDEX "Confederation_name_key";
CREATE UNIQUE INDEX "Country_name_key" ON "Country"("name");
