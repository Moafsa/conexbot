import { headers } from "next/headers";

export const dynamic = 'force-dynamic';

export default async function EmbedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Não carregamos a Sidebar (Shell) aqui. Exibiremos puramente as páginas embutidas.
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col p-4 w-full">
            {children}
            <div className="mt-8 text-center text-xs text-gray-400">
                Powered by Conexão AI
            </div>
        </div>
    );
}
