'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function WpOnboardingPage() {
  const [token, setToken] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleConnect = () => {
    if (!token) {
      alert('Para testes, insira um token!');
      return;
    }

    try {
      // Envia a mensagem para a janela pai (o iframe no Admin do WordPress)
      window.parent.postMessage({
        type: 'CONEXBOT_AUTH',
        token: token
      }, '*');
      
      setStatus('success');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Bem-vindo ao Conexão AI
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Integração nativa com WordPress
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <div>
              <p className="text-sm text-gray-700 mb-4">
                (Modo de Teste) Esta página simula a jornada do cliente. Futuramente, aqui ficará o formulário de login/cadastro oficial e os planos. Para validar a integração Seamless, cole o Token provisório e clique em Conectar.
              </p>
            </div>

            <div>
              <label htmlFor="token" className="block text-sm font-medium text-gray-700">
                JWT Token (Simulação)
              </label>
              <div className="mt-1">
                <input
                  id="token"
                  name="token"
                  type="text"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5c..."
                />
              </div>
            </div>

            <div>
              <button
                onClick={handleConnect}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Simular Conexão & Pagamento
              </button>
            </div>

            {status === 'success' && (
              <div className="rounded-md bg-green-50 p-4 mt-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">
                      Mensagem disparada com sucesso para o WordPress! O painel deve recarregar em instantes.
                    </h3>
                  </div>
                </div>
              </div>
            )}
            
            {status === 'error' && (
              <div className="rounded-md bg-red-50 p-4 mt-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Erro ao disparar mensagem para o iframe parent.
                    </h3>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
