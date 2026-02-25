import { Suspense } from "react";
import AIArchitect from "@/components/Dashboard/AIArchitect";

export default function CreateBotPage() {
    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Arquiteto de Automação</h1>
                <p className="text-gray-400">
                    Vamos criar seu novo agente. Basta conversar com a IA abaixo.
                </p>
            </div>

            <Suspense fallback={<div className="text-gray-400">Carregando...</div>}>
                <AIArchitect />
            </Suspense>
        </div>
    );
}
