-- Create a default product if not exists
INSERT INTO "ProductCatalog" (id, name, description, "minMonthlyPrice", "minSetupPrice", "createdAt")
VALUES (gen_random_uuid(), 'CONEXT_BOT', 'Plataforma completa de bots e CRM', 50.0, 0.0, NOW())
ON CONFLICT (name) DO NOTHING;

-- Link all PRIMARY plans to this product
UPDATE "Plan" 
SET "productCatalogId" = (SELECT id FROM "ProductCatalog" WHERE name = 'CONEXT_BOT')
WHERE type = 'PRIMARY';

-- Create Writer product
INSERT INTO "ProductCatalog" (id, name, description, "minMonthlyPrice", "minSetupPrice", "createdAt")
VALUES (gen_random_uuid(), 'CONEXT_WRITER', 'Escritor IA e Automação de Marketing', 30.0, 0.0, NOW())
ON CONFLICT (name) DO NOTHING;

-- Link WRITER_PLUGIN plans
UPDATE "Plan" 
SET "productCatalogId" = (SELECT id FROM "ProductCatalog" WHERE name = 'CONEXT_WRITER')
WHERE type = 'WRITER_PLUGIN';
