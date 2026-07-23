'use client';

import { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentHost: string;
  onHostChange: (newHost: string) => void;
}

export default function SettingsModal({ isOpen, onClose, currentHost, onHostChange }: Props) {
  const [hostInput, setHostInput] = useState(currentHost);

  // Se não estiver ativo no estado do page.tsx, não renderiza nada (substitui o 'hidden')
  if (!isOpen) return null;

  const handleClearDatabase = () => {
    if (confirm("Tem certeza que deseja resetar os dados locais do cliente? Isto apagará sessões e personagens salvos.")) {
      sessionStorage.clear();
      localStorage.clear();
      alert("Banco de dados do cliente resetado com sucesso!");
      window.location.reload(); // Recarrega a página para limpar os estados do React
    }
  };

  const handleClose = () => {
    // Se o usuário alterou o IP, envia de volta para o componente pai salvar
    if (hostInput.trim() !== '') {
      onHostChange(hostInput.trim());
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto select-text">
      <div className="bg-neutral-900 border border-neutral-800 rounded-md p-6 w-80 text-left shadow-2xl space-y-4 animate-fadeIn">

        <div className="text-xs font-bold tracking-widest text-amber-500 uppercase border-b border-neutral-800 pb-2 select-none">
          Connection Settings
        </div>

        {/* Input de IP do Servidor */}
        <div>
          <label className="text-[10px] text-stone-500 tracking-wider uppercase block mb-1 select-none">
            Login Server Address
          </label>
          <input
            type="text"
            className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm rounded focus:outline-none focus:border-amber-500/50 text-stone-200 text-center font-mono"
            placeholder="127.0.0.1:1337"
            value={hostInput}
            onChange={(e) => setHostInput(e.target.value)}
          />
        </div>

        {/* Botão de Wipe / Reset */}
        <button
          onClick={handleClearDatabase}
          className="w-full py-1.5 text-xs border border-rose-900/50 bg-rose-950/20 text-rose-400 hover:bg-rose-950/50 rounded transition cursor-pointer"
        >
          Reset Client Database
        </button>

        {/* Botão para Fechar e Aplicar */}
        <button
          type="button"
          onClick={handleClose}
          className="w-full py-2 text-xs font-bold tracking-wider uppercase bg-neutral-800 hover:bg-neutral-700 rounded transition text-stone-300 cursor-pointer border-0 outline-none block"
        >
          Close
        </button>

      </div>
    </div>
  );
}