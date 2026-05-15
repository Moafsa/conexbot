-- Remove duplicates created by mistake
DELETE FROM "ProductCatalog" WHERE name IN ('Conext Bot (WhatsApp)', 'Conext Writer IA');

-- Update original products with proper names and descriptions
UPDATE "ProductCatalog" 
SET name = 'Conext Bot', 
    description = 'Agente de atendimento inteligente via WhatsApp com automações e CRM integrado.',
    "minMonthlyPrice" = 49.90,
    "minSetupPrice" = 0
WHERE name = 'CONEXT_BOT';

UPDATE "ProductCatalog" 
SET name = 'Conext Writer', 
    description = 'Plugin WordPress para geração de conteúdo SEO com Inteligência Artificial.',
    "minMonthlyPrice" = 29.90,
    "minSetupPrice" = 0
WHERE name = 'CONEXT_WRITER';

SELECT id, name, description, "minMonthlyPrice" FROM "ProductCatalog" ORDER BY "createdAt";
