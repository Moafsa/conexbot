import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import { NotificationService } from '@/services/notification/service';

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 });
        }

        const tenant = await prisma.tenant.findUnique({
            where: { email }
        });

        // For security, even if email doesn't exist, we don't leak it
        if (!tenant) {
            return NextResponse.json({ message: 'Se este email estiver cadastrado, você receberá um link de recuperação.' });
        }

        // Generate token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour

        await prisma.tenant.update({
            where: { id: tenant.id },
            data: {
                resetToken,
                resetTokenExpires
            }
        });

        const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;

        const subject = 'Recuperação de Senha - ConextBot';
        const text = `Você solicitou a recuperação de senha. Clique no link para redefinir: ${resetUrl}`;
        const html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Recuperação de Senha</h2>
                <p>Olá,</p>
                <p>Recebemos uma solicitação para redefinir a senha da sua conta ConextBot.</p>
                <p>Clique no botão abaixo para criar uma nova senha. Este link expira em 1 hora.</p>
                <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">Redefinir Senha</a>
                <p>Se você não solicitou isso, ignore este e-mail.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 12px; color: #666;">Se o botão não funcionar, copie e cole este link no seu navegador: ${resetUrl}</p>
            </div>
        `;

        await NotificationService.sendEmail(tenant.email, subject, text, html);

        return NextResponse.json({ message: 'Se este email estiver cadastrado, você receberá um link de recuperação.' });
    } catch (error) {
        console.error('[Forgot Password Error]', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}
