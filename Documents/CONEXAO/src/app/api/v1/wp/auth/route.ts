import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { encode } from 'next-auth/jwt';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { action, email, password, name, whatsapp } = body;

        if (!email || !password) {
            return NextResponse.json({ error: 'Email e senha são obrigatórios' }, { status: 400 });
        }

        const secret = process.env.NEXTAUTH_SECRET || '';

        // Cadastrar nova conta pelo WordPress
        if (action === 'register') {
            const existing = await prisma.tenant.findUnique({ where: { email } });
            if (existing) {
                return NextResponse.json({ error: 'Email já cadastrado. Use a opção de apenas inserir o Token.' }, { status: 400 });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            
            const starterPlan = await prisma.plan.findFirst({
                 where: { name: { contains: 'Starter', mode: 'insensitive' } }
            });

            const newTenant = await prisma.tenant.create({
                data: {
                    email,
                    password: hashedPassword,
                    name: name || '',
                    whatsapp: whatsapp || null,
                    role: 'USER',
                    usageCounter: {
                        create: {
                            messagesLimit: starterPlan?.messageLimit || 5000,
                            botsLimit: starterPlan?.botLimit || 1,
                            periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                        }
                    }
                }
            });

            const token = await encode({
                token: { id: newTenant.id, email: newTenant.email, role: newTenant.role },
                secret,
                maxAge: 10 * 365 * 24 * 60 * 60 // 10 years expiration for WP Integration Token
            });

            return NextResponse.json({ token, tenantId: newTenant.id, message: 'Conta criada com sucesso!' });
        }

        // Fazer login e obter token pelo WordPress
        if (action === 'login') {
            const tenant = await prisma.tenant.findUnique({ where: { email } });
            if (!tenant || !tenant.password) {
                return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
            }

            const isValid = await bcrypt.compare(password, tenant.password);
            if (!isValid) {
                return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
            }

            const token = await encode({
                token: { id: tenant.id, email: tenant.email, role: tenant.role },
                secret,
                maxAge: 10 * 365 * 24 * 60 * 60
            });

            return NextResponse.json({ token, tenantId: tenant.id, message: 'Login realizado com sucesso!' });
        }

        return NextResponse.json({ error: 'Ação inválida (use login ou register)' }, { status: 400 });

    } catch (error: any) {
        console.error('WP Auth Error:', error);
        return NextResponse.json({ error: 'Erro interno ao tentar autenticar via Plugin WP.' }, { status: 500 });
    }
}
