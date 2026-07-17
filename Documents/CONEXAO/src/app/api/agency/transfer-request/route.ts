import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getRedis } from '@/lib/redis';
import crypto from 'crypto';
import { NotificationService } from '@/services/notification/service';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        let tenantId = session.user.id;
        if (!tenantId && session.user.email) {
            const t = await prisma.tenant.findUnique({ where: { email: session.user.email }, select: { id: true } });
            tenantId = t?.id;
        }

        const agency = await prisma.agency.findUnique({
            where: { tenantId },
            include: { tenant: true },
        });
        if (!agency) return NextResponse.json({ error: 'Not an agency' }, { status: 403 });

        const body = await req.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json({ error: 'E-mail do cliente é obrigatório' }, { status: 400 });
        }

        const targetClient = await prisma.tenant.findUnique({ where: { email } });
        if (!targetClient) {
            return NextResponse.json({ error: 'Cliente não encontrado com este e-mail.' }, { status: 404 });
        }

        if (targetClient.agencyId === agency.id) {
            return NextResponse.json({ error: 'O cliente já pertence a esta agência.' }, { status: 400 });
        }

        // Generate token and store in Redis
        const token = crypto.randomBytes(32).toString('hex');
        const redis = getRedis();
        const key = `transfer_request:${token}`;
        const payload = {
            clientId: targetClient.id,
            newAgencyId: agency.id,
            newAgencyName: agency.tenant.name || 'Agência Conextbot',
            email: targetClient.email,
        };

        // Expira em 7 dias
        await redis.set(key, JSON.stringify(payload), 'EX', 7 * 24 * 60 * 60);

        // Send Email
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const link = `${appUrl}/transfer/${token}`;
        
        const subject = 'Solicitação de Transferência de Agência - Conextbot';
        const text = `Olá, ${targetClient.name || 'Cliente'}!\n\nA agência ${payload.newAgencyName} solicitou a transferência da sua conta para a gestão deles na Conextbot.\n\nPara aprovar a transferência e permitir que a nova agência gerencie seu bot e serviços, acesse o link abaixo:\n\n${link}\n\nSe você não solicitou isso ou desconhece esta agência, basta ignorar este e-mail. A sua conta permanecerá segura com a agência atual.\n\nAtenciosamente,\nEquipe Conextbot`;
        
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
                <h2 style="color: #10b981;">Solicitação de Transferência de Agência</h2>
                <p>Olá, <strong>${targetClient.name || 'Cliente'}</strong>!</p>
                <p>A agência <strong>${payload.newAgencyName}</strong> solicitou a transferência da sua conta para a gestão deles na plataforma Conextbot.</p>
                <p>Ao aprovar, a nova agência terá acesso para configurar seu bot, fluxos de atendimento e gerenciar suas assinaturas.</p>
                
                <div style="margin: 30px 0; text-align: center;">
                    <a href="${link}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Aprovar Transferência</a>
                </div>
                
                <p style="font-size: 14px; color: #666;">Se você não solicitou essa mudança ou não conhece a agência, apenas ignore este e-mail. Nada será alterado na sua conta.</p>
                
                <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
                <p style="font-size: 12px; color: #999;">Equipe Conextbot</p>
            </div>
        `;

        try {
            await NotificationService.sendEmail(targetClient.email, subject, text, html);
        } catch (error) {
            console.error("Erro ao enviar email de transferencia:", error);
            return NextResponse.json({ error: 'Erro ao disparar e-mail para o cliente.' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error in transfer request:', error);
        return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
    }
}
