import { getRedis } from '@/lib/redis';
import TransferClient from './TransferClient';
import { AlertCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function TransferPage({ params }: { params: { token: string } }) {
    const redis = getRedis();
    const dataStr = await redis.get(`transfer_request:${params.token}`);
    
    if (!dataStr) {
        return (
            <div className="min-h-screen bg-[#0b0f1a] flex items-center justify-center p-6 text-white font-sans">
                <div className="bg-[#111827] border border-red-500/30 rounded-3xl p-10 max-w-md w-full text-center shadow-2xl">
                    <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="text-red-400" size={40} />
                    </div>
                    <h2 className="text-2xl font-bold mb-4">Link Inválido</h2>
                    <p className="text-gray-400 mb-8">
                        Este link de transferência é inválido ou já expirou. 
                        Peça para a agência solicitar a transferência novamente.
                    </p>
                    <a 
                        href="/"
                        className="inline-block w-full py-4 rounded-2xl bg-[#1a2235] hover:bg-[#243049] font-bold transition-all border border-white/10"
                    >
                        Voltar para o Início
                    </a>
                </div>
            </div>
        );
    }
    
    const payload = JSON.parse(dataStr);
    
    return <TransferClient token={params.token} payload={payload} />
}
