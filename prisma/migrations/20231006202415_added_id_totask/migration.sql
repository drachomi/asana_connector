-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AsanaTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" INTEGER,
    "name" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    CONSTRAINT "AsanaTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_AsanaTask" ("id", "name", "resourceType", "workspaceId") SELECT "id", "name", "resourceType", "workspaceId" FROM "AsanaTask";
DROP TABLE "AsanaTask";
ALTER TABLE "new_AsanaTask" RENAME TO "AsanaTask";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
