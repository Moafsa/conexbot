"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message);
      } else {
        setError(data.error || "Ocorreu um erro. Tente novamente.");
      }
    } catch (err) {
      setError("Falha na conexão. Verifique sua internet.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10 animate-float">
          <Link href="/" className="text-3xl font-bold tracking-tighter">
            Conext <span className="text-gradient">Bot</span>
          </Link>
          <p className="text-gray-500 mt-2">Recuperação de Senha.</p>
        </div>

        <div className="glass p-8 rounded-2xl border-white/10 shadow-2xl">
          {message ? (
            <div className="text-center space-y-4">
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
                {message}
              </div>
              <p className="text-gray-400 text-sm">
                Se não receber em alguns minutos, verifique sua caixa de spam.
              </p>
              <Link
                href="/auth/login"
                className="btn-primary w-full inline-block py-3 text-center"
              >
                Voltar para Login
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <p className="text-gray-400 text-sm mb-6">
                Informe seu e-mail cadastrado para enviarmos as instruções de redefinição.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    placeholder="joao@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center py-3"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Enviar Instruções"
                  )}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-400">
                Lembrou a senha?{" "}
                <Link href="/auth/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
                  Fazer login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
