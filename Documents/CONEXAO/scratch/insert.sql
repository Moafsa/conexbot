INSERT INTO "Tenant" (id, email, password, name, role, "createdAt", "updatedAt", "botLimit") 
VALUES ('c2b9a764-1a2b-4c3d-9e8f-0123456789ab', 'agencia@teste.com', '$2b$10$mI8UMOGbYATahORW40jPluS.cDcAdRlseL4nkd9ZC8EkpGk/yEi7y', 'Agencia Teste', 'AGENCY', NOW(), NOW(), 1)
ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, role = EXCLUDED.role;

INSERT INTO "Agency" (id, "tenantId", status, "currentFee", "createdAt", "updatedAt")
VALUES ('d3c0b875-2b3c-5d4e-af9g-1234567890bc', 'c2b9a764-1a2b-4c3d-9e8f-0123456789ab', 'APPROVED', 20.0, NOW(), NOW())
ON CONFLICT ("tenantId") DO NOTHING;
