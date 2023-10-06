-- CreateTable
CREATE TABLE "AsanaStory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    CONSTRAINT "AsanaStory_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "AsanaTask" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
