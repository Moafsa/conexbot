SELECT id, name, email FROM "Tenant" WHERE id IN (SELECT "tenantId" FROM "Agency" WHERE id = '7ad47fcd-859b-4097-b798-d2cb6bc5f442');
