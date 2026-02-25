import Link from "next/link";
import { CheckCircle } from "lucide-react";

export default function BillingSuccess() {
    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
            <div className="max-w-md w-full glass p-8 rounded-3xl text-center border border-green-500/30">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-green-400">
                    <CheckCircle size={40} />
                </div>
                <h1 className="text-3xl font-bold mb-2">Pagamento Iniciado!</h1>
                <p className="text-gray-400 mb-8">
                    Sua assinatura está sendo processada. Assim que confirmarmos o pagamento, seu acesso será liberado.
                </p>

                <Link href="/dashboard" className="btn-primary w-full block">
                    Acessar Dashboard
                </Link>
            </div>
        </div>
    );
}
