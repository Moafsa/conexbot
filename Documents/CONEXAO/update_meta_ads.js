const fs = require('fs');

let content = fs.readFileSync('src/services/marketing/meta-ads-service.ts', 'utf-8');

const newCreateCampaign = `    async createCampaign(tenantId: string, params: { name: string, objective: string, dailyBudget: number, targeting?: any, creativeUrl?: string }) {
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { metaAdsToken: true, metaAdsAccountId: true }
        });

        if (!tenant || !tenant.metaAdsToken || !tenant.metaAdsAccountId) throw new Error("Meta Ads não configurado");

        const accountId = tenant.metaAdsAccountId.startsWith('act_') ? tenant.metaAdsAccountId : \`act_\${tenant.metaAdsAccountId}\`;
        
        // 1. Create Campaign
        const campRes = await fetch(\`https://graph.facebook.com/v22.0/\${accountId}/campaigns\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: params.name,
                objective: params.objective,
                status: 'PAUSED',
                special_ad_categories: 'NONE',
                daily_budget: params.dailyBudget,
                access_token: tenant.metaAdsToken
            })
        });

        const campData = await campRes.json();
        if (campData.error) throw new Error("Campaign: " + campData.error.message);
        const campaignId = campData.id;

        // 2. Create AdSet
        let optimization_goal = "REACH";
        if (params.objective === "TRAFFIC") optimization_goal = "LINK_CLICKS";
        if (params.objective === "LEAD_GEN") optimization_goal = "LEAD_GENERATION";
        if (params.objective === "CONVERSIONS") optimization_goal = "OFFSITE_CONVERSIONS";

        const targeting = params.targeting || { geo_locations: { countries: ['BR'] } };

        const adsetRes = await fetch(\`https://graph.facebook.com/v22.0/\${accountId}/adsets\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: \`\${params.name} - AdSet\`,
                campaign_id: campaignId,
                daily_budget: params.dailyBudget,
                billing_event: 'IMPRESSIONS',
                optimization_goal: optimization_goal,
                targeting: targeting,
                status: 'PAUSED',
                promoted_object: params.objective === "CONVERSIONS" && tenant.metaAdsPixelId ? { pixel_id: tenant.metaAdsPixelId, custom_event_type: 'PURCHASE' } : undefined,
                access_token: tenant.metaAdsToken
            })
        });

        const adsetData = await adsetRes.json();
        if (adsetData.error) throw new Error("AdSet: " + adsetData.error.message);
        const adsetId = adsetData.id;

        // 3. Create Creative & Ad (If creativeUrl is provided)
        if (params.creativeUrl) {
            try {
                // Upload Image
                const imgRes = await fetch(\`https://graph.facebook.com/v22.0/\${accountId}/adimages\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        image_url: params.creativeUrl,
                        access_token: tenant.metaAdsToken
                    })
                });
                const imgData = await imgRes.json();
                
                if (!imgData.error && imgData.images) {
                    const imageHash = Object.values(imgData.images)[0].hash;
                    
                    // Create AdCreative (Requires Page ID, but we try a basic creative or at least we have the hash)
                    // Note: If no page_id is present, we log that Ad could not be fully created without a Page ID.
                    console.log("Image uploaded to Meta with hash:", imageHash);
                    // Without page_id in tenant configuration, we stop here for the creative part to avoid API failure.
                }
            } catch (e) {
                console.error("Failed to upload creative to meta", e);
            }
        }

        return campaignId;
    }
};`;

// Use simple string replace
const pattern = /async createCampaign\([\s\S]*?\n\};/m;
content = content.replace(pattern, newCreateCampaign);
fs.writeFileSync('src/services/marketing/meta-ads-service.ts', content);
console.log('meta-ads-service updated');
