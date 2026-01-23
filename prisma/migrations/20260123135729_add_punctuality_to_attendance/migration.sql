-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Attendance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "shiftStart" DATETIME,
    "shiftEnd" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "notes" TEXT,
    "punctuality" TEXT NOT NULL DEFAULT 'ON_TIME',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Attendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Attendance" ("approvedAt", "approvedBy", "createdAt", "date", "id", "notes", "shiftEnd", "shiftStart", "status", "updatedAt", "userId") SELECT "approvedAt", "approvedBy", "createdAt", "date", "id", "notes", "shiftEnd", "shiftStart", "status", "updatedAt", "userId" FROM "Attendance";
DROP TABLE "Attendance";
ALTER TABLE "new_Attendance" RENAME TO "Attendance";
CREATE INDEX "Attendance_userId_idx" ON "Attendance"("userId");
CREATE INDEX "Attendance_status_idx" ON "Attendance"("status");
CREATE UNIQUE INDEX "Attendance_userId_date_key" ON "Attendance"("userId", "date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
