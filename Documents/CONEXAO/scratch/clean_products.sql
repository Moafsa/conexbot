-- Remove old generic products that don't have descriptions
DELETE FROM "ProductCatalog" WHERE name IN ('CONEXT_BOT', 'CONEXT_WRITER');
SELECT id, name, description, "minMonthlyPrice" FROM "ProductCatalog" ORDER BY "createdAt";
