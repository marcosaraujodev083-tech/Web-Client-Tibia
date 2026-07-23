'use client';

import { useState } from 'react';

interface Props {
  onClose: () => void;
  // Alterado para receber os dados de login limpos diretamente do React
  onSubmit: (payload: any) => Promise<void>;
}

export default function EnterGameModal({ onClose, onSubmit }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      return alert("Por favor, preencha todos os campos.");
    }

    setLoading(true);
    try {
      // Passa o payload estruturado diretamente para o handler no page.tsx
      await onSubmit({
        account: username,
        password: password
      });
    } catch (error) {
      console.error("[EnterGameModal] Erro ao processar o login:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto select-text">
      <div className="bg-neutral-900 border border-neutral-800 rounded-md p-6 w-80 text-left shadow-2xl space-y-4 pointer-events-auto animate-fadeIn">

        <div className="text-xs font-bold tracking-widest text-amber-500 uppercase border-b border-neutral-800 pb-2 select-none">
          Account Information
        </div>

        {/* Formulário agora intercepta o submit nativo (Enter ou clique no botão) */}
        <form onSubmit={handleFormSubmit} className="space-y-3">
          <div>
            <label className="text-[10px] text-stone-500 tracking-wider uppercase block mb-1 select-none">
              Username
            </label>
            <input
              className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm rounded focus:outline-none focus:border-amber-500/50 text-stone-200 font-mono"
              type="text"
              placeholder="Account Name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <label className="text-[10px] text-stone-500 tracking-wider uppercase block mb-1 select-none">
              Password
            </label>
            <input
              className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm rounded focus:outline-none focus:border-amber-500/50 text-stone-200 font-mono"
              type="password"
              placeholder="Account Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              disabled={loading}
              className="flex-1 py-2 text-xs font-bold tracking-wider uppercase bg-neutral-800 hover:bg-neutral-700 rounded transition text-stone-400 cursor-pointer border-0 outline-none"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 text-xs font-bold tracking-wider uppercase bg-amber-600 hover:bg-amber-500 text-neutral-950 rounded transition cursor-pointer border-0 outline-none"
            >
              {loading ? "Connecting..." : "Enter Game"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}