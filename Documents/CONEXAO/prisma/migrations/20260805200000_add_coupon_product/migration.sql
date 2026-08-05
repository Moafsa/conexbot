-- Vincula cupons a um ou mais produtos do catálogo. Sem nenhuma linha para um
-- cupom, ele continua valendo para todo o catálogo (comportamento anterior).
CREATE TABLE IF NOT EXISTS "CouponProduct" (
    "id"        TEXT NOT NULL,
    "couponId"  TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    CONSTRAINT "CouponProduct_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CouponProduct_couponId_productId_key"
    ON "CouponProduct"("couponId", "productId");

CREATE INDEX IF NOT EXISTS "CouponProduct_couponId_idx" ON "CouponProduct"("couponId");
CREATE INDEX IF NOT EXISTS "CouponProduct_productId_idx" ON "CouponProduct"("productId");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'CouponProduct_couponId_fkey'
    ) THEN
        ALTER TABLE "CouponProduct"
        ADD CONSTRAINT "CouponProduct_couponId_fkey"
        FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'CouponProduct_productId_fkey'
    ) THEN
        ALTER TABLE "CouponProduct"
        ADD CONSTRAINT "CouponProduct_productId_fkey"
        FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
