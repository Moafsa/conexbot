INSERT INTO "Tenant" (id, email, password, role, name, "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'agency_only@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'AGENCY', 'Agency Only', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', role = 'AGENCY';
