/*
  Warnings:

  - Added the required column `contactEmail` to the `Inquiry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contactPhone` to the `Inquiry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `script` to the `Inquiry` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Inquiry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "script" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Inquiry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
-- פניות ישנות בלבד: כתב אשכנזי, והאימייל והטלפון מועתקים מהמשתמש.
INSERT INTO "new_Inquiry" ("contactEmail", "contactPhone", "createdAt", "id", "message", "script", "status", "userId")
SELECT "User"."email", "User"."phone", "Inquiry"."createdAt", "Inquiry"."id", "Inquiry"."message", 'ASHKENAZI', "Inquiry"."status", "Inquiry"."userId"
FROM "Inquiry"
JOIN "User" ON "User"."id" = "Inquiry"."userId";
DROP TABLE "Inquiry";
ALTER TABLE "new_Inquiry" RENAME TO "Inquiry";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
