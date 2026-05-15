SELECT a.id as agency_id, a."tenantId" as agency_owner_id, t.email FROM "Agency" a JOIN "Tenant" t ON a."tenantId" = t.id;
