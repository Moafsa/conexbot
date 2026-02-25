# Changelog - Melhorias no AI Architect

## Backend
- **Novo Endpoint de Upload**: `/api/ai/architect/upload`
  - Suporte a PDF e Imagens (OCR integrado)
  - Processamento imediato com retorno do texto extraído

- **Scraper Otimizado**: `src/services/engine/scraper.ts`
  - Limite de caracteres aumentado para 8000
  - Retry automático em falhas/timeouts
  - Melhor extração de preços e metadados (Schema.org, Open Graph)
  - User-Agent rotativo/realista

- **Cérebro da IA Atualizado**: `/api/ai/architect/route.ts`
  - Novo System Prompt focado em extração de fatos
  - Protocolo de validação: "Extrair primeiro, perguntar depois"
  - Suporte a múltiplos contextos (Scraped + Extracted Files)

## Frontend
- **Interface AI Architect Renovada**: `src/components/Dashboard/AIArchitect.tsx`
  - Upload de arquivos com feedback visual imediato
  - Processamento de OCR em background enquanto usuário digita
  - Indicadores de sucesso/erro por arquivo
  - Envio de contexto enriquecido para a IA

## Próximos Passos Sugeridos
- Implementar persistência real dos arquivos no RAG após criação
- Adicionar visualização do conteúdo extraído para o usuário
- Melhorar feedback de erro em caso de OCR falhar
