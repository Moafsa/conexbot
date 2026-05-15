-- Delete existing plans for this product if they exist to avoid conflicts
DELETE FROM "Plan" WHERE "productCatalogId" IN (SELECT id FROM "ProductCatalog" WHERE name = 'MERCADO_LIVRE_SYNC');

-- Upsert the product
INSERT INTO "ProductCatalog" (id, name, description, "minMonthlyPrice", "minSetupPrice", "createdAt")
VALUES (gen_random_uuid(), 'MERCADO_LIVRE_SYNC', 'Sincronização bidirecional de estoque e preços com Mercado Livre e IA.', 49.90, 99.00, NOW())
ON CONFLICT (name) DO UPDATE SET 
    description = EXCLUDED.description,
    "minMonthlyPrice" = EXCLUDED."minMonthlyPrice",
    "minSetupPrice" = EXCLUDED."minSetupPrice";

-- Get the ID of the product
WITH product AS (SELECT id FROM "ProductCatalog" WHERE name = 'MERCADO_LIVRE_SYNC')
INSERT INTO "Plan" (id, name, price, interval, "productCatalogId", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'Mensal', 49.90, 'MONTHLY', product.id, NOW(), NOW() FROM product;

WITH product AS (SELECT id FROM "ProductCatalog" WHERE name = 'MERCADO_LIVRE_SYNC')
INSERT INTO "Plan" (id, name, price, interval, "productCatalogId", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'Trimestral', 129.90, 'QUARTERLY', product.id, NOW(), NOW() FROM product;

WITH product AS (SELECT id FROM "ProductCatalog" WHERE name = 'MERCADO_LIVRE_SYNC')
INSERT INTO "Plan" (id, name, price, interval, "productCatalogId", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'Anual', 479.90, 'YEARLY', product.id, NOW(), NOW() FROM product;
