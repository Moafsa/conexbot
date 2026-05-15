-- Promote official user to AGENCY
UPDATE "Tenant" SET role = 'AGENCY' WHERE email = 'agency_official@test.com';

-- Create Agency record for official user
INSERT INTO "Agency" (id, "tenantId", "currentFee", "createdAt", "updatedAt")
SELECT gen_random_uuid(), id, 25.0, NOW(), NOW()
FROM "Tenant" WHERE email = 'agency_official@test.com'
ON CONFLICT ("tenantId") DO NOTHING;

-- Ensure UsageCounter exists
INSERT INTO "UsageCounter" (id, "messagesLimit", "botsLimit", "periodEnd", "tenantId")
SELECT gen_random_uuid(), 20000, 20, NOW() + INTERVAL '30 days', id
FROM "Tenant" WHERE email = 'agency_official@test.com'
ON CONFLICT ("tenantId") DO NOTHING;
