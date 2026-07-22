# Graph Report - C:\Users\moaci\OneDrive\Documentos\Conextbot\conexbot\Documents\CONEXAO\src  (2026-07-21)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1210 nodes · 2283 edges · 156 communities (116 shown, 40 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_auth.ts|auth.ts]]
- [[_COMMUNITY_prisma.ts|prisma.ts]]
- [[_COMMUNITY_logToFile|logToFile]]
- [[_COMMUNITY_getEffectiveTenantId|getEffectiveTenantId]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_marketing-ia-service.ts|marketing-ia-service.ts]]
- [[_COMMUNITY_ai-provider.ts|ai-provider.ts]]
- [[_COMMUNITY_asaas.ts|asaas.ts]]
- [[_COMMUNITY_getRedis|getRedis]]
- [[_COMMUNITY_agent-squads.ts|agent-squads.ts]]
- [[_COMMUNITY_uzapi.ts|uzapi.ts]]
- [[_COMMUNITY_MercadoLivreService|MercadoLivreService]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_AsaasService|AsaasService]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_buffering.ts|buffering.ts]]
- [[_COMMUNITY_extractor.ts|extractor.ts]]
- [[_COMMUNITY_processor.ts|processor.ts]]
- [[_COMMUNITY_route.ts|route.ts]]
- [[_COMMUNITY_knowledge.ts|knowledge.ts]]
- [[_COMMUNITY_validations.ts|validations.ts]]
- [[_COMMUNITY_route.ts|route.ts]]
- [[_COMMUNITY_AIArchitect.tsx|AIArchitect.tsx]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_NotificationService|NotificationService]]
- [[_COMMUNITY_CRMBoard.tsx|CRMBoard.tsx]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_EditBotModal.tsx|EditBotModal.tsx]]
- [[_COMMUNITY_architect-bot-payload.ts|architect-bot-payload.ts]]
- [[_COMMUNITY_contact-extractor.ts|contact-extractor.ts]]
- [[_COMMUNITY_prompts.ts|prompts.ts]]
- [[_COMMUNITY_CRM.tsx|CRM.tsx]]
- [[_COMMUNITY_layout.tsx|layout.tsx]]
- [[_COMMUNITY_rate-limit.ts|rate-limit.ts]]
- [[_COMMUNITY_SchedulingService|SchedulingService]]
- [[_COMMUNITY_Bot|Bot]]
- [[_COMMUNITY_Shell.tsx|Shell.tsx]]
- [[_COMMUNITY_route.ts|route.ts]]
- [[_COMMUNITY_route.ts|route.ts]]
- [[_COMMUNITY_niche-templates.ts|niche-templates.ts]]
- [[_COMMUNITY_route.ts|route.ts]]
- [[_COMMUNITY_route.ts|route.ts]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_layout.tsx|layout.tsx]]
- [[_COMMUNITY_proxy.ts|proxy.ts]]
- [[_COMMUNITY_skills.ts|skills.ts]]
- [[_COMMUNITY_route.ts|route.ts]]
- [[_COMMUNITY_route.ts|route.ts]]
- [[_COMMUNITY_route.ts|route.ts]]
- [[_COMMUNITY_route.ts|route.ts]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_MediaManager.tsx|MediaManager.tsx]]
- [[_COMMUNITY_monitoring.ts|monitoring.ts]]
- [[_COMMUNITY_check_bot_prompt_js.js|check_bot_prompt_js.js]]
- [[_COMMUNITY_check_business_type.js|check_business_type.js]]
- [[_COMMUNITY_fix_bot_prompt_js.js|fix_bot_prompt_js.js]]
- [[_COMMUNITY_fix_bot_prompt.js|fix_bot_prompt.js]]
- [[_COMMUNITY_migrate-bot-status.js|migrate-bot-status.js]]
- [[_COMMUNITY_CartService|CartService]]
- [[_COMMUNITY_price-detector.ts|price-detector.ts]]
- [[_COMMUNITY_route.ts|route.ts]]
- [[_COMMUNITY_route.ts|route.ts]]
- [[_COMMUNITY_route.ts|route.ts]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_DriverMap.tsx|DriverMap.tsx]]
- [[_COMMUNITY_check_bot_prompt.ts|check_bot_prompt.ts]]
- [[_COMMUNITY_create-superadmin.ts|create-superadmin.ts]]
- [[_COMMUNITY_fix_bot_prompt.ts|fix_bot_prompt.ts]]
- [[_COMMUNITY_migrate-bot-status.ts|migrate-bot-status.ts]]
- [[_COMMUNITY_migrate-scheduling.ts|migrate-scheduling.ts]]
- [[_COMMUNITY_promote-admin.ts|promote-admin.ts]]
- [[_COMMUNITY_seed-writer-v3.ts|seed-writer-v3.ts]]
- [[_COMMUNITY_product-selector.ts|product-selector.ts]]
- [[_COMMUNITY_stripe.ts|stripe.ts]]

## God Nodes (most connected - your core abstractions)
1. `prisma` - 207 edges
2. `authOptions` - 130 edges
3. `getEffectiveTenantId()` - 79 edges
4. `logToFile()` - 35 edges
5. `MetaService` - 23 edges
6. `getRedis()` - 19 edges
7. `safeChatCompletion()` - 18 edges
8. `graphFetch()` - 17 edges
9. `UzapiService` - 16 edges
10. `getAiClient()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `AdminPage()` --indirect_call--> `Bot`  [INFERRED]
  app/admin/page.tsx → components/Dashboard/CRM.tsx
- `GET()` --calls--> `getEffectiveTenantId()`  [EXTRACTED]
  app/api/bots/route.ts → lib/get-effective-tenant.ts
- `PUT()` --calls--> `getEffectiveTenantId()`  [EXTRACTED]
  app/api/marketing/ads/[id]/route.ts → lib/get-effective-tenant.ts
- `DELETE()` --calls--> `getEffectiveTenantId()`  [EXTRACTED]
  app/api/marketing/ads/[id]/route.ts → lib/get-effective-tenant.ts
- `PUT()` --calls--> `getEffectiveTenantId()`  [EXTRACTED]
  app/api/marketing/ads/campaigns/[id]/route.ts → lib/get-effective-tenant.ts

## Import Cycles
- 1-file cycle: `lib/storage.ts -> lib/storage.ts`

## Communities (156 total, 40 thin omitted)

### Community 1 - "prisma.ts"
Cohesion: 0.04
Nodes (3): globalForPrisma, prisma, MetaCAPIService

### Community 2 - "logToFile"
Cohesion: 0.07
Nodes (34): GET(), PUT(), sanitizeConfig(), SENSITIVE_FIELDS, checkBotOwnership(), GET(), POST(), checkBotOwnership() (+26 more)

### Community 3 - "getEffectiveTenantId"
Cohesion: 0.07
Nodes (35): GET(), POST(), DELETE(), GET(), PUT(), requireContactForTenant(), CHANNELS, GET() (+27 more)

### Community 4 - "page.tsx"
Cohesion: 0.06
Nodes (20): uploadMarketingMedia(), DELETE(), handleMediaRequest(), POST(), validateUrl(), POST(), AdsTab(), CalendarTab() (+12 more)

### Community 5 - "marketing-ia-service.ts"
Cohesion: 0.07
Nodes (16): PUT(), DELETE(), PUT(), GET(), POST(), POST(), GET(), AdsSupervisorService (+8 more)

### Community 6 - "ai-provider.ts"
Cohesion: 0.09
Nodes (22): POST(), POST(), POST(), POST(), WORKFLOWS, POST(), POST(), POST() (+14 more)

### Community 7 - "asaas.ts"
Cohesion: 0.12
Nodes (12): POST(), GET(), GET(), baseUrl(), generateRedirectPage(), GET(), getDynamicAgencyFee(), asaasFetch() (+4 more)

### Community 8 - "getRedis"
Cohesion: 0.12
Nodes (20): POST(), GET(), POST(), POST(), TransferPage(), AuditJob, enqueueAudit(), enqueueMessage() (+12 more)

### Community 9 - "agent-squads.ts"
Cohesion: 0.10
Nodes (19): ADVISORY_SQUAD, Agent, AgentTask, ALL_SQUADS, BRAND_SQUAD, CLAUDE_CODE_SQUAD, CLEVEL_SQUAD, COPY_SQUAD (+11 more)

### Community 10 - "uzapi.ts"
Cohesion: 0.18
Nodes (7): GET(), digitsOnlyBrazil(), normalizeBrazilWhatsAppE164(), PhoneUtils, FollowUpService, formatRecipientJid(), UzapiService

### Community 11 - "MercadoLivreService"
Cohesion: 0.14
Nodes (3): mercadoLivreTools, MercadoLivreService, WordPressService

### Community 12 - "page.tsx"
Cohesion: 0.13
Nodes (14): CHANNEL_PROVIDERS, fieldCls(), INITIAL, MODULE_OPTIONS, NICHES, PAYMENT_OPTIONS, Step1Negocio(), Step2Publico() (+6 more)

### Community 13 - "page.tsx"
Cohesion: 0.13
Nodes (10): AgendaManager(), Appointment, Coupon, CouponManager(), Product, ProductManager(), SecuritySettings(), SecuritySettingsProps (+2 more)

### Community 15 - "page.tsx"
Cohesion: 0.15
Nodes (4): BrandStory(), Features(), Hero(), integrations

### Community 16 - "buffering.ts"
Cohesion: 0.15
Nodes (5): logToFile(), POST(), activeTimers, BufferingService, MessageProcessor

### Community 17 - "extractor.ts"
Cohesion: 0.26
Nodes (12): POST(), detectMimeFromExtension(), ExtractResult, extractText(), extractTextByMime(), extractTextFromCsv(), extractTextFromDocx(), extractTextFromImage() (+4 more)

### Community 18 - "processor.ts"
Cohesion: 0.20
Nodes (8): ChatwootService, logToFile(), chunkKnowledge(), retrieveRelevantChunks(), ScoredChunk, detectAiMessage(), SupervisorService, GoogleMeasurementService

### Community 19 - "route.ts"
Cohesion: 0.32
Nodes (10): logToFile(), POST(), TEMP_DIR, isLidJid(), isNoiseChat(), isPnJid(), pickPeerIncoming(), pickPeerOutgoing() (+2 more)

### Community 20 - "knowledge.ts"
Cohesion: 0.21
Nodes (4): GraphRAGHelper, GraphTriple, KnowledgeService, VectorService

### Community 21 - "validations.ts"
Cohesion: 0.33
Nodes (7): aiArchitectSchema, checkoutSchema, createBotSchema, loginSchema, registerSchema, updateBotSchema, whatsappConnectSchema

### Community 22 - "route.ts"
Cohesion: 0.31
Nodes (6): POST(), POST(), canonicalLicensingSiteUrl(), licensingSiteFingerprint(), licensingSiteUrlsMatch(), isSubscriptionActive()

### Community 23 - "AIArchitect.tsx"
Cohesion: 0.18
Nodes (3): Message, UploadedFile, Media

### Community 24 - "page.tsx"
Cohesion: 0.18
Nodes (6): AgencyInfo, Analytics, BotItem, CHANNEL_LABEL, PrimaryBot, OnboardingGuideProps

### Community 26 - "CRMBoard.tsx"
Cohesion: 0.20
Nodes (5): Contact, CRMBoard(), CrmPipeline, CrmStage, CRMContactPanelProps

### Community 29 - "EditBotModal.tsx"
Cohesion: 0.25
Nodes (5): EditBotModal(), EditBotModalProps, getAvailableModels(), MODELS_BY_PROVIDER, Tab

### Community 30 - "architect-bot-payload.ts"
Cohesion: 0.44
Nodes (8): buildArchitectBotPayload(), optionalDigitsContact(), optionalValidUrl(), pickString(), toOptionalBool(), toOptionalInt(), toOptionalNumber(), toStringArray()

### Community 31 - "contact-extractor.ts"
Cohesion: 0.22
Nodes (6): COMPANY_INDICATORS, ContactData, EMAIL_INDICATORS, NAME_INDICATORS, NEEDS_INDICATORS, ROLE_INDICATORS

### Community 32 - "prompts.ts"
Cohesion: 0.28
Nodes (7): BotContext, buildConversationMessages(), buildSystemPrompt(), ContactInfo, CouponInfo, MediaInfo, Product

### Community 33 - "CRM.tsx"
Cohesion: 0.32
Nodes (3): Contact, CRM(), CrmStage

### Community 34 - "layout.tsx"
Cohesion: 0.43
Nodes (5): DocsLayout(), DocsNavIconKey, docsNavSections, MobileDocsNav(), MobileDocsNavProps

### Community 35 - "rate-limit.ts"
Cohesion: 0.46
Nodes (6): apiLimiter(), authLimiter(), rateLimit(), RateLimitEntry, store, webhookLimiter()

### Community 37 - "Bot"
Cohesion: 0.29
Nodes (5): AdminData, AdminPage(), ClientHubPage(), DashboardPage(), Bot

### Community 38 - "Shell.tsx"
Cohesion: 0.33
Nodes (4): DashboardLayout(), Shell(), ShellProps, Sidebar()

### Community 40 - "route.ts"
Cohesion: 0.47
Nodes (3): GET(), POST(), checkBotLimit()

### Community 44 - "niche-templates.ts"
Cohesion: 0.40
Nodes (4): POST(), getNicheTemplate(), NICHE_TEMPLATES, NicheTemplate

### Community 46 - "route.ts"
Cohesion: 0.60
Nodes (3): handleInstagram(), handleWhatsApp(), POST()

### Community 47 - "page.tsx"
Cohesion: 0.60
Nodes (3): generateLicenseKey(), WriterDashboardPage(), CopyLicenseButton()

### Community 49 - "proxy.ts"
Cohesion: 0.50
Nodes (4): baseUrl(), config, proxy(), publicRoutes

### Community 50 - "skills.ts"
Cohesion: 0.50
Nodes (4): getSkillPrompt(), mapBotToSkill(), SpecialistSkill, SpecialistSkills

### Community 65 - "MediaManager.tsx"
Cohesion: 0.67
Nodes (3): listRender(), Media, MediaManager()

### Community 66 - "monitoring.ts"
Cohesion: 0.83
Nodes (3): captureError(), captureMessage(), getSentry()

### Community 73 - "price-detector.ts"
Cohesion: 0.67
Nodes (3): extractPrices(), findRelevantPrice(), PriceMatch

## Knowledge Gaps
- **134 isolated node(s):** `AdminData`, `SENSITIVE_FIELDS`, `WORKFLOWS`, `CHANNELS`, `updateAiSettingsSchema` (+129 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **40 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `prisma` connect `prisma.ts` to `auth.ts`, `logToFile`, `getEffectiveTenantId`, `page.tsx`, `marketing-ia-service.ts`, `ai-provider.ts`, `asaas.ts`, `getRedis`, `agent-squads.ts`, `uzapi.ts`, `MercadoLivreService`, `AsaasService`, `page.tsx`, `buffering.ts`, `processor.ts`, `route.ts`, `knowledge.ts`, `validations.ts`, `route.ts`, `NotificationService`, `SchedulingService`, `route.ts`, `route.ts`, `route.ts`, `route.ts`, `route.ts`, `route.ts`, `page.tsx`, `route.ts`, `route.ts`, `route.ts`, `route.ts`, `route.ts`, `route.ts`, `route.ts`, `route.ts`, `route.ts`, `route.ts`, `route.ts`, `route.ts`, `route.ts`, `route.ts`, `route.ts`?**
  _High betweenness centrality (0.179) - this node is a cross-community bridge._
- **Why does `DashboardLayout()` connect `Shell.tsx` to `prisma.ts`?**
  _High betweenness centrality (0.096) - this node is a cross-community bridge._
- **Why does `Sidebar()` connect `Shell.tsx` to `Bot`?**
  _High betweenness centrality (0.093) - this node is a cross-community bridge._
- **What connects `AdminData`, `SENSITIVE_FIELDS`, `WORKFLOWS` to the rest of the system?**
  _134 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `auth.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.03305322128851541 - nodes in this community are weakly interconnected._
- **Should `prisma.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.03796203796203796 - nodes in this community are weakly interconnected._
- **Should `logToFile` be split into smaller, more focused modules?**
  _Cohesion score 0.06804214223002635 - nodes in this community are weakly interconnected._