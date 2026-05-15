-- Insert default marketplace products if none exist
INSERT INTO "ProductCatalog" (id, name, description, "minMonthlyPrice", "minSetupPrice", "createdAt")
SELECT gen_random_uuid(), 'Conext Bot (WhatsApp)', 'Agente de atendimento inteligente via WhatsApp com automações e CRM integrado.', 49.90, 0, NOW()
WHERE NOT EXISTS (SELECT 1 FROM "ProductCatalog" WHERE name = 'Conext Bot (WhatsApp)');

INSERT INTO "ProductCatalog" (id, name, description, "minMonthlyPrice", "minSetupPrice", "createdAt")
SELECT gen_random_uuid(), 'Conext Writer IA', 'Plugin WordPress para geração de conteúdo SEO com Inteligência Artificial.', 29.90, 0, NOW()
WHERE NOT EXISTS (SELECT 1 FROM "ProductCatalog" WHERE name = 'Conext Writer IA');

INSERT INTO "ProductCatalog" (id, name, description, "minMonthlyPrice", "minSetupPrice", "createdAt")
SELECT gen_random_uuid(), 'Marketing IA', 'Criação e gerenciamento automatizado de campanhas de marketing com IA.', 39.90, 0, NOW()
WHERE NOT EXISTS (SELECT 1 FROM "ProductCatalog" WHERE name = 'Marketing IA');

INSERT INTO "ProductCatalog" (id, name, description, "minMonthlyPrice", "minSetupPrice", "createdAt")
SELECT gen_random_uuid(), 'CRM Pipeline', 'Gestão de clientes, pipeline de vendas e follow-up automatizado.', 19.90, 0, NOW()
WHERE NOT EXISTS (SELECT 1 FROM "ProductCatalog" WHERE name = 'CRM Pipeline');

SELECT id, name, "minMonthlyPrice" FROM "ProductCatalog";
