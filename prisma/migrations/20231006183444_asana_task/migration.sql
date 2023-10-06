-- CreateTable
CREATE TABLE "AsanaTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL
);
