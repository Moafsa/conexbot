import OpenAI from "openai";
import prisma from "@/lib/prisma";

let _openai: OpenAI | null = null;
function getOpenAIClient() {
    if (!_openai) {
        _openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY || "no-key-build",
        });
    }
    return _openai;
}

export interface GraphTriple {
    source: string;
    predicate: string;
    target: string;
    context: string;
}

export const GraphRAGHelper = {
    /**
     * Extracts semantic triples (Source -> Predicate -> Target) from text content using LLM
     */
    async extractTriples(text: string): Promise<GraphTriple[]> {
        if (!text || text.trim().length < 20) return [];
        
        try {
            const client = getOpenAIClient();
            const prompt = `Você é um extrator de grafos de conhecimento de alto desempenho.
Analise o seguinte texto explicativo e extraia até 15 principais relações lógicas, conceitos ou fatos estruturados como triplos (Entidade Origem, Predicado/Relação, Entidade Destino) acompanhados de um curto contexto explicativo.

Exemplo de entrada:
"O plano Startup do Conext Bot custa R$ 99 por mês e inclui suporte por email."

Exemplo de saída (JSON puro):
[
  {
    "source": "plano Startup",
    "predicate": "custa",
    "target": "R$ 99 por mês",
    "context": "O plano Startup custa R$ 99 por mês."
  },
  {
    "source": "plano Startup",
    "predicate": "inclui",
    "target": "suporte por email",
    "context": "O plano Startup inclui suporte por email."
  }
]

Retorne APENAS o array JSON contendo os objetos estruturados, sem wraps de markdown ou blocos de código.

Texto a ser analisado:
${text.substring(0, 4000)}`;

            const completion = await client.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" }
            });

            const resText = completion.choices[0].message.content || "";
            const parsed = JSON.parse(resText);
            
            // Handle key variations (e.g. if the model wrapped it in a property "triples" or returned direct array)
            const list = Array.isArray(parsed) ? parsed : (parsed.triples || parsed.relations || []);
            return list as GraphTriple[];
        } catch (error) {
            console.error("[GraphRAGHelper] Triple extraction failed:", error);
            return [];
        }
    }
};
