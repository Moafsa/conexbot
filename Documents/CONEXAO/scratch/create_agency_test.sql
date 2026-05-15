-- Create Tenant
INSERT INTO "Tenant" (id, email, password, role, name, "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'vendas@agenciaexemplo.com', '$2b$12$.A9q/TxS.YPBnFdcjNVbgeCEiZoW.moOgb0V2JOIAL0Cjwr48fxCS', 'AGENCY', 'Agência Exemplo', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET role = 'AGENCY';

-- Create Agency record
INSERT INTO "Agency" (id, "tenantId", "salesVolumeCurrentMonth", "salesVolumeLifetime", "currentFee", "createdAt", "updatedAt")
SELECT gen_random_uuid(), id, 0, 0, 20.0, NOW(), NOW()
FROM "Tenant" WHERE email = 'vendas@agenciaexemplo.com'
ON CONFLICT ("tenantId") DO NOTHING;
