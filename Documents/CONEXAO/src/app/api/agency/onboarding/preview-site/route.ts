/**
 * POST /api/agency/onboarding/preview-site
 *
 * Scrapes a client's website and extracts structured data to pre-fill the
 * onboarding form. Returns business name, description, hours, address,
 * detected niche, and a knowledge base excerpt.
 *
 * The agency validates/edits the pre-filled data before calling /api/agency/onboarding.
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { scrapeWebsite } from '@/services/engine/scraper';
import { safeChatCompletion } from '@/lib/ai-provider';

const EXTRACT_PROMPT = `Analise o conteúdo do site abaixo e retorne um JSON com os seguintes campos:
{
  "businessName": "nome da empresa",
  "description": "descrição curta do negócio em até 2 frases",
  "niche": "um de: restaurante | clinica | ecommerce | salao | imobiliaria | generico",
  "address": "endereço físico, se encontrado",
  "hours": "horário de funcionamento, se encontrado",
  "phone": "telefone principal (sem formatação se possível), se encontrado",
  "email": "email de contato principal, se encontrado",
  "cpfCnpj": "CPF ou CNPJ da empresa (sem formatação se possível), se encontrado",
  "suggestedBotName": "nome sugerido para o bot (ex: Atendente Digital do [Nome])",
  "targetAudience": "perfil do público-alvo (ex: Jovens de 20-30 anos)",
  "tone": "um de: Profissional | Descontraído | Divertido | Acolhedor | Luxuoso",
  "persona": "estilo de atendimento e personalidade do bot (ex: Jovem, animado e focado em vendas rápidas)",
  "productsServices": "lista geral ou texto corrido dos principais serviços prestados ou categorias de produtos",
  "differentials": "o que faz a empresa ser única ou melhor que a concorrência",
  "avgTicket": "ticket médio estimado, se deduzível (ex: R$ 50,00 ou Alto/Baixo)",
  "keyProducts": ["produto/serviço 1", "produto/serviço 2", "produto/serviço 3"]
}
Responda APENAS com o JSON, sem markdown.`;

export async function POST(req: Request) {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: 'url é obrigatória' }, { status: 400 });

    // Validate URL
    try { new URL(url); } catch {
        return NextResponse.json({ error: 'URL inválida' }, { status: 400 });
    }

    // Scrape
    const scrape = await scrapeWebsite(url);
    if (!scrape.success || !scrape.content) {
        return NextResponse.json({
            success: false,
            error: scrape.error || 'Não foi possível acessar o site',
            partial: { businessName: scrape.title || '' },
        });
    }

    // Extract structured info with AI
    const truncatedContent = scrape.content.slice(0, 6000);

    try {
        // Build a minimal bot-like object for safeChatCompletion
        const mockBot = {
            aiProvider: 'openai',
            aiModel: 'gpt-4o-mini',
            tenant: {
                openaiApiKey: null,
                geminiApiKey: null,
                openrouterApiKey: null,
            },
        };

        const result = await safeChatCompletion({
            bot: mockBot,
            messages: [
                { role: 'system', content: EXTRACT_PROMPT },
                { role: 'user', content: `Site: ${url}\n\nConteúdo:\n${truncatedContent}` },
            ],
            temperature: 0.2,
            response_format: { type: 'json_object' },
            max_tokens: 600,
        });

        const extracted = JSON.parse(result.content || '{}');

        return NextResponse.json({
            success: true,
            extracted,
            rawContentLength: scrape.content.length,
            knowledgeBaseExcerpt: scrape.content.slice(0, 2000),
        });
    } catch (err: any) {
        // Return what we scraped even if AI extraction fails
        return NextResponse.json({
            success: true,
            extracted: { businessName: scrape.title || '', niche: 'generico' },
            rawContentLength: scrape.content.length,
            knowledgeBaseExcerpt: scrape.content.slice(0, 2000),
            warning: 'Extração por IA falhou, dados parciais retornados',
        });
    }
}
