import React, { useState } from 'react';
import { Lock, Loader2 } from 'lucide-react';
import { login } from '../services/authService';

interface Props {
  onSuccess: () => void;
}

export const LoginScreen: React.FC<Props> = ({ onSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || busy) return;
    setBusy(true);
    setError('');
    const r = await login(password);
    setBusy(false);
    if (r.ok) {
      onSuccess();
    } else {
      setError(r.error || 'Não foi possível entrar.');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-3">
            <Lock className="w-5 h-5" />
          </div>
          <h1 className="text-lg font-bold text-slate-800">Dashboard de Métricas LM</h1>
          <p className="text-sm text-slate-500 mt-1">Acesso restrito — informe a senha</p>
        </div>

        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Senha"
          autoFocus
          className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />

        {error && <p className="text-sm text-rose-600 mt-3">{error}</p>}

        <button
          type="submit"
          disabled={busy || !password}
          className={`mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors
            ${busy || !password ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
        >
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          {busy ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
};
