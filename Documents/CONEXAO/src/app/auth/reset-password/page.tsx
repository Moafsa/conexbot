"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetPasswordContent() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/auth/login");
        }, 3000);
      } else {
        const data = await res.json();
        setError(data.error || "Ocorreu um erro ao redefinir a senha.");
      }
    } catch (err) {
      setError("Falha na conexão.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="glass p-8 rounded-2xl text-center border-red-500/30">
        <p className="text-red-400">Token de recuperação ausente.</p>
        <Link href="/auth/forgot-password" className="text-indigo-400 mt-4 block">
          Solicitar novo link
        </Link>
      </div>
    );
  }

  return (
    <div className="glass p-8 rounded-2xl border-white/10 shadow-2xl">
      {success ? (
        <div className="text-center space-y-4">
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
            Senha redefinida com sucesso! Redirecionando...
          </div>
          <Link
            href="/auth/login"
            className="btn-primary w-full inline-block py-3 text-center"
          >
            Entrar Agora
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
            Crie uma nova senha segura para sua conta.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Nova Senha
              </label>
              <input
                type="password"
                required
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Confirmar Nova Senha
              </label>
              <input
                type="password"
                required
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder="Repita a senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
                "Redefinir Senha"
              )}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10 animate-float">
          <Link href="/" className="text-3xl font-bold tracking-tighter">
            Conext <span className="text-gradient">Bot</span>
          </Link>
          <p className="text-gray-500 mt-2">Nova Senha.</p>
        </div>

        <Suspense fallback={<div className="text-white text-center">Carregando...</div>}>
          <ResetPasswordContent />
        </Suspense>
      </div>
    </div>
  );
}
