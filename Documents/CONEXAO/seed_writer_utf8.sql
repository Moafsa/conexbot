-- Garante que o cliente use UTF8
SET client_encoding = 'UTF8';

-- Limpa planos antigos do tipo writer
DELETE FROM "Plan" WHERE type = 'WRITER_PLUGIN';

-- Insere os planos do Conext Writer com acentuação correta e todos os preços
INSERT INTO "Plan" (
    id, name, description, price, interval, "botLimit", "messageLimit", "postLimit", "wordLimit", 
    active, "createdAt", "updatedAt", "platformSplitType", "platformSplitValue", 
    "priceQuarterly", "priceSemiannual", "priceYearly", "trialDays", features, type
)
VALUES 
(
    'writer-basic', 
    'Basic', 
    'Ideal para blogs pequenos e iniciantes no Marketing de Conteúdo.', 
    79.0, 
    'MONTHLY', 
    1, 
    0, 
    15, 
    30000, 
    true, 
    NOW(), 
    NOW(), 
    'PERCENTAGE', 
    0.0, 
    213.0,  -- 79 * 3 * 0.9 (~10% desc)
    399.0,  -- 79 * 6 * 0.85 (~15% desc)
    758.0,  -- 79 * 12 * 0.8 (~20% desc)
    0, 
    '[{"text": "15 Posts com IA por mês", "enabled": true}, {"text": "Otimização Yoast SEO", "enabled": true}, {"text": "Imagens Geradas por IA", "enabled": true}, {"text": "Humanização Anti-IA", "enabled": true}, {"text": "Suporte por Email", "enabled": true}]'::jsonb, 
    'WRITER_PLUGIN'::"SubscriptionType"
),
(
    'writer-pro', 
    'Pro', 
    'Para criadores profissionais e sites de autoridade que precisam de volume.', 
    149.0, 
    'MONTHLY', 
    1, 
    0, 
    40, 
    100000, 
    true, 
    NOW(), 
    NOW(), 
    'PERCENTAGE', 
    0.0, 
    402.0,  -- 149 * 3 * 0.9
    760.0,  -- 149 * 6 * 0.85
    1430.0, -- 149 * 12 * 0.8
    0, 
    '[{"text": "40 Posts com IA por mês", "enabled": true}, {"text": "Otimização Yoast SEO", "enabled": true}, {"text": "Imagens Geradas por IA (DALL-E 3)", "enabled": true}, {"text": "Humanização Anti-IA Avançada", "enabled": true}, {"text": "Suporte Prioritário", "enabled": true}]'::jsonb, 
    'WRITER_PLUGIN'::"SubscriptionType"
),
(
    'writer-elite', 
    'Elite', 
    'Poder total para redes de sites, agências e portais de notícias.', 
    297.0, 
    'MONTHLY', 
    1, 
    0, 
    120, 
    300000, 
    true, 
    NOW(), 
    NOW(), 
    'PERCENTAGE', 
    0.0, 
    802.0,  -- 297 * 3 * 0.9
    1515.0, -- 297 * 6 * 0.85
    2851.0, -- 297 * 12 * 0.8
    0, 
    '[{"text": "120 Posts com IA por mês", "enabled": true}, {"text": "Otimização Yoast SEO Pro", "enabled": true}, {"text": "Imagens Ilimitadas", "enabled": true}, {"text": "Clusterização de Conteúdo", "enabled": true}, {"text": "Suporte VIP via WhatsApp", "enabled": true}]'::jsonb, 
    'WRITER_PLUGIN'::"SubscriptionType"
);
