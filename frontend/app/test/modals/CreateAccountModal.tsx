'use client';

import { useState } from 'react';

interface Props {
  onClose: () => void;
  // Alterado para receber os dados limpos do formulário, sem gambiarras de DOM
  onSubmit: (payload: any) => Promise<void>;
}

export default function CreateAccountModal({ onClose, onSubmit }: Props) {
  const [accountNumber, setAccountNumber] = useState('');
  const [password, setPassword] = useState('');
  const [charName, setCharName] = useState('');
  const [sex, setSex] = useState('male');
  const [loading, setLoading] = useState(false);

  const handleFormSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!accountNumber || !password || !charName) {
        return alert("Por favor, preencha todos os campos do formulário.");
      }

      setLoading(true);
      try {
        // Corrigido: Mapeia accountNumber explicitamente para a chave 'account'
        await onSubmit({
          account: accountNumber.trim(),
          password: password,
          name: charName.trim(),
          sex: sex
        });
      } catch (error) {
        console.error("[CreateAccountModal] Erro ao processar submissão:", error);
      } finally {
        setLoading(false);
      }
    };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto select-text">
      <div className="bg-neutral-900 border border-neutral-800 rounded-md p-6 w-80 text-left shadow-2xl space-y-3 pointer-events-auto animate-fadeIn">

        <div className="text-xs font-bold tracking-widest text-emerald-500 uppercase border-b border-neutral-800 pb-2 select-none">
          Create Account
        </div>

        {/* Aciona o envio pelo evento nativo do Form ao apertar Enter ou clicar em Create */}
        <form onSubmit={handleFormSubmit} className="space-y-3 w-full">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-stone-500 block mb-1">Account Name</label>
            <input
              className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm rounded focus:outline-none focus:border-amber-500/50 text-stone-200 font-mono"
              type="text"
              placeholder="e.g. tibia123"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-stone-500 block mb-1">Password</label>
            <input
              className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm rounded focus:outline-none focus:border-amber-500/50 text-stone-200 font-mono"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-stone-500 block mb-1">Character Name</label>
            <input
              className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm rounded focus:outline-none focus:border-amber-500/50 text-stone-200"
              type="text"
              placeholder="Character Name"
              value={charName}
              onChange={(e) => setCharName(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-stone-500 block mb-1">Gender</label>
            <select
              className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm rounded focus:outline-none focus:border-amber-500/50 text-stone-300"
              value={sex}
              onChange={(e) => setSex(e.target.value)}
              disabled={loading}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
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
              className="flex-1 py-2 text-xs font-bold tracking-wider uppercase bg-emerald-600 hover:bg-emerald-500 text-neutral-950 rounded transition cursor-pointer border-0 outline-none"
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}