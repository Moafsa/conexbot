import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import prisma from './prisma';

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            async clientId() {
                const config = await prisma.globalConfig.findUnique({ where: { id: 'system' } });
                return config?.googleClientId || process.env.GOOGLE_CLIENT_ID || '';
            },
            async clientSecret() {
                const config = await prisma.globalConfig.findUnique({ where: { id: 'system' } });
                return config?.googleClientSecret || process.env.GOOGLE_CLIENT_SECRET || '';
            },
        } as any),
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Senha', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Email e senha são obrigatórios');
                }

                const tenant = await prisma.tenant.findUnique({
                    where: { email: credentials.email },
                });

                if (!tenant || !tenant.password) {
                    throw new Error('Credenciais inválidas');
                }

                const isValid = await bcrypt.compare(credentials.password, tenant.password);
                if (!isValid) {
                    throw new Error('Credenciais inválidas');
                }

                return {
                    id: tenant.id,
                    email: tenant.email,
                    name: tenant.name,
                    role: tenant.role,
                };
            },
        }),
    ],
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    callbacks: {
        async signIn({ user, account, profile }) {
            if (account?.provider === 'google') {
                // Check if tenant exists, if not create one
                const existingTenant = await prisma.tenant.findUnique({
                    where: { email: user.email! }
                });

                if (!existingTenant) {
                    await prisma.tenant.create({
                        data: {
                            email: user.email!,
                            name: user.name,
                            role: 'USER',
                        }
                    });
                }
            }
            return true;
        },
        async jwt({ token, user, account }) {
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
            }

            if (token.id && !user) {
                const dbUser = await prisma.tenant.findUnique({
                    where: { id: token.id as string },
                    select: { id: true, role: true }
                });
                if (dbUser) {
                    token.id = dbUser.id;
                    token.role = dbUser.role;
                }
            }

            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id;
                (session.user as any).role = token.role;
            }
            return session;
        },
    },
    pages: {
        signIn: '/auth/login',
        error: '/auth/login',
    },
    secret: process.env.NEXTAUTH_SECRET,
};

export default authOptions;
