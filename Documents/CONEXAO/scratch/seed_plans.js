const { Client } = require('pg');
const crypto = require('crypto');

const client = new Client({
  connectionString: "postgresql://admin:password123@postgres:5432/conext_db?schema=public"
});

const products = {
  MARKETING_IA: "4c56c826-84f4-43cf-873e-82144a6a8dc3",
  CRM_PIPELINE: "62aefc34-67fb-4247-b1de-1637066248bd",
  CONEXT_BOT: "fb1216a9-9c56-43ac-9832-5760a377e19d"
};

const plans = [
  // CONEXT_BOT
  { id: crypto.randomUUID(), name: "Bot Basic", price: 97, type: "PRIMARY", interval: "MONTHLY", productCatalogId: products.CONEXT_BOT },
  { id: crypto.randomUUID(), name: "Bot Pro", price: 197, type: "PRIMARY", interval: "MONTHLY", productCatalogId: products.CONEXT_BOT },
  { id: crypto.randomUUID(), name: "Bot Elite", price: 397, type: "PRIMARY", interval: "MONTHLY", productCatalogId: products.CONEXT_BOT },
  
  // MARKETING_IA
  { id: crypto.randomUUID(), name: "Ads Standard", price: 149, type: "MARKETING", interval: "MONTHLY", productCatalogId: products.MARKETING_IA },
  { id: crypto.randomUUID(), name: "Ads Business", price: 299, type: "MARKETING", interval: "MONTHLY", productCatalogId: products.MARKETING_IA },
  
  // CRM_PIPELINE
  { id: crypto.randomUUID(), name: "CRM Individual", price: 79, type: "CRM", interval: "MONTHLY", productCatalogId: products.CRM_PIPELINE }
];

async function main() {
    await client.connect();
    console.log("Seeding plans...");
    for (const plan of plans) {
        await client.query(`
            INSERT INTO "Plan" (id, name, price, type, interval, "productCatalogId", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            ON CONFLICT (id) DO NOTHING
        `, [plan.id, plan.name, plan.price, plan.type, plan.interval, plan.productCatalogId]);
    }
    console.log("Seeding finished!");
    await client.end();
}

main().catch(console.error);
