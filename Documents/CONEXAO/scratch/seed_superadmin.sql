-- Create SuperAdmin Tenant if not exists
INSERT INTO "Tenant" (id, name, email, password, role, "createdAt", "updatedAt")
VALUES (
    gen_random_uuid(), 
    'Super Admin', 
    'admin@test.com', 
    '$2a$10$7zB3Hl.vE3yqI6C5v5u6Ze5Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7', -- password123 hashed
    'SUPERADMIN', 
    NOW(), 
    NOW()
)
ON CONFLICT (email) DO UPDATE 
SET role = 'SUPERADMIN', password = '$2a$10$7zB3Hl.vE3yqI6C5v5u6Ze5Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7';
