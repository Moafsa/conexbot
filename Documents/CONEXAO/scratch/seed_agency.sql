-- Create Agency Tenant if not exists
INSERT INTO "Tenant" (id, name, email, password, role, "createdAt", "updatedAt")
VALUES (
    gen_random_uuid(), 
    'Test Agency', 
    'agency@test.com', 
    '$2a$10$7zB3Hl.vE3yqI6C5v5u6Ze5Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7', -- password123 hashed (roughly)
    'AGENCY', 
    NOW(), 
    NOW()
)
ON CONFLICT (email) DO UPDATE 
SET role = 'AGENCY', password = '$2a$10$7zB3Hl.vE3yqI6C5v5u6Ze5Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7';

-- Create UsageCounter for the agency
INSERT INTO "UsageCounter" (id, "messagesLimit", "botsLimit", "periodEnd", "tenantId")
SELECT gen_random_uuid(), 10000, 10, NOW() + INTERVAL '30 days', id
FROM "Tenant" WHERE email = 'agency@test.com'
ON CONFLICT ("tenantId") DO NOTHING;

-- Create Agency record
INSERT INTO "Agency" (id, "tenantId", "currentFee", "createdAt", "updatedAt")
SELECT gen_random_uuid(), id, 20.0, NOW(), NOW()
FROM "Tenant" WHERE email = 'agency@test.com'
ON CONFLICT ("tenantId") DO NOTHING;
