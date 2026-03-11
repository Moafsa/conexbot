import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';
import GoogleProvider from 'next-auth/providers/google';
import prisma from '@/lib/prisma';
import { NextRequest } from 'next/server';

async function handler(req: NextRequest, ctx: { params: { nextauth: string[] } }) {
    let config = null;
    try {
        config = await prisma.globalConfig.findUnique({ where: { id: 'system' } });
    } catch (e) {
        console.error("Error fetching config for NextAuth", e);
    }

    const baseProviders = (authOptions.providers || []).filter(
        // @ts-ignore
        p => p.id !== 'google'
    );
    const providers = [...baseProviders];
    
    if (config?.googleClientId && config?.googleClientSecret) {
        providers.push(
            GoogleProvider({
                clientId: config.googleClientId,
                clientSecret: config.googleClientSecret,
            })
        );
    } else if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
        providers.push(
            GoogleProvider({
                clientId: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            })
        );
    }

    return NextAuth({
        ...authOptions,
        providers
    })(req, ctx);
}

export { handler as GET, handler as POST };
