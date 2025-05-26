/*
  Warnings:

  - You are about to drop the column `corner` on the `ShopSettings` table. All the data in the column will be lost.
  - You are about to drop the column `paddingX` on the `ShopSettings` table. All the data in the column will be lost.
  - You are about to drop the column `paddingY` on the `ShopSettings` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ShopSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "position" TEXT NOT NULL DEFAULT 'bottom-right',
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "buttonText" TEXT NOT NULL DEFAULT 'Add to Cart',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ShopSettings" ("createdAt", "id", "shop", "updatedAt") SELECT "createdAt", "id", "shop", "updatedAt" FROM "ShopSettings";
DROP TABLE "ShopSettings";
ALTER TABLE "new_ShopSettings" RENAME TO "ShopSettings";
CREATE UNIQUE INDEX "ShopSettings_shop_key" ON "ShopSettings"("shop");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
