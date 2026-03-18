import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  let logo = "/favicon.png";
  try {
    const prisma = (await import('@/lib/prisma')).default;
    const config = await prisma.globalConfig.findUnique({ where: { id: 'system' } }) as any;
    if (config?.logoWhiteUrl || config?.logoColoredUrl) {
      logo = config.logoWhiteUrl || config.logoColoredUrl;
    }
  } catch {
    // Evita que falha de BD/Prisma no metadata derrube a página (ex.: /admin em build standalone)
  }
  return {
    title: "Conext Bot | Automação Inteligente",
    description: "Crie bots humanizados com IA em segundos. Integrado com WhatsApp, Instagram e ElevenLabs.",
    icons: { icon: logo, shortcut: logo, apple: logo },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
