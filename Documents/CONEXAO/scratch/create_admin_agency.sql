INSERT INTO "Agency" (id, "tenantId", "salesVolumeCurrentMonth", "salesVolumeLifetime", "currentFee", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'd0f353a7-040c-44c7-8e62-a20f03e703f5', 0, 0, 20.0, NOW(), NOW())
ON CONFLICT ("tenantId") DO NOTHING;
