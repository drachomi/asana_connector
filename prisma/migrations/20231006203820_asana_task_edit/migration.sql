/*
  Warnings:

  - Made the column `userId` on table `AsanaTask` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AsanaTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    CONSTRAINT "AsanaTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_AsanaTask" ("id", "name", "resourceType", "userId", "workspaceId") SELECT "id", "name", "resourceType", "userId", "workspaceId" FROM "AsanaTask";
DROP TABLE "AsanaTask";
ALTER TABLE "new_AsanaTask" RENAME TO "AsanaTask";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
