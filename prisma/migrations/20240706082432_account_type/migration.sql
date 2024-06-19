-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Account" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "accountType" TEXT NOT NULL DEFAULT 'CURRENT_ACCOUNT',
    "bankName" TEXT NOT NULL,
    "sortCode" TEXT,
    "accountNumber" TEXT NOT NULL
);
INSERT INTO "new_Account" ("accountNumber", "bankName", "id", "sortCode") SELECT "accountNumber", "bankName", "id", "sortCode" FROM "Account";
DROP TABLE "Account";
ALTER TABLE "new_Account" RENAME TO "Account";
CREATE UNIQUE INDEX "Account_sortCode_accountNumber_key" ON "Account"("sortCode", "accountNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
