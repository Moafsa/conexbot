-- Create Tenant
INSERT INTO "Tenant" (id, email, password, role, name, "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'agency_only@test.com', '$2b$10$EpjXWzO2yzrxE5uz5jGv3O.D0K1b1K0V0p0W0v0v0v0v0v0v0v0v', 'AGENCY', 'Pure Agency', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET role = 'AGENCY';

-- Create Agency record
INSERT INTO "Agency" (id, "tenantId", "salesVolumeCurrentMonth", "salesVolumeLifetime", "currentFee", "createdAt", "updatedAt")
SELECT gen_random_uuid(), id, 0, 0, 20.0, NOW(), NOW()
FROM "Tenant" WHERE email = 'agency_only@test.com'
ON CONFLICT ("tenantId") DO NOTHING;
