'use client';

import { useEffect, useState } from 'react';

interface Props {
  onClose?: () => void;
  onConfirm?: () => void; // Gatilho para fechar a tela de login no React
}

export default function CharacterSelectionModal({ onClose, onConfirm }: Props) {
  const [characterName, setCharacterName] = useState('Loading...');
  const [isSelected, setIsSelected] = useState(false);

  useEffect(() => {
    // Loop de monitoramento para capturar o nome do personagem
    const interval = setInterval(() => {
      const modal = document.getElementById('floater-charlist');
      if (modal && (modal.style.display === 'flex' || !modal.classList.contains('hidden'))) {
        const loginUserInput = document.getElementById('user-username') as HTMLInputElement;
        const globalClientName = (window as any).gameClient?.player?.name;

        const detectedName = globalClientName || loginUserInput?.value || 'Player';

        if (characterName === 'Loading...') {
          setCharacterName(detectedName);
        }
      }
    }, 300);

    return () => clearInterval(interval);
  }, [characterName]);

  // Função cirúrgica para simular o comando nativo que a engine espera
  const triggerEngineConfirm = () => {
    console.log(`[Ponte] Disparando clique nativo para a Engine...`);

    // Procura se a engine injetou ou espera o botão de confirmação original
    const nativeConfirmBtn = document.querySelector('button[data-action="confirm"]') || document.getElementById('charlist-confirm');

    if (nativeConfirmBtn) {
      const simulatedEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      nativeConfirmBtn.dispatchEvent(simulatedEvent);
    } else {
      // Caso a engine dependa apenas do evento global por Atributo de Ação
      const dummy = document.createElement('button');
      dummy.setAttribute('data-action', 'confirm');
      dummy.setAttribute('action', 'confirm');
      dummy.style.display = 'none';
      document.body.appendChild(dummy);

      const simulatedEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
      dummy.dispatchEvent(simulatedEvent);
      dummy.remove();
    }
  };

  const handleConfirmClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    // Ativa o estado selecionado no item de lista antes de confirmar
    setIsSelected(true);

    // 1. Remove a cortina de login do React (Destrava a visão do jogo)
    if (onConfirm) onConfirm();

    // 2. Entrega o fluxo de rede para a Engine conectar no mundo
    setTimeout(() => {
      triggerEngineConfirm();
    }, 50);
  };

  return (
    <div
      id="floater-charlist"
      className="modal hidden fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <div className="bg-neutral-900 border border-neutral-800 rounded-md p-6 w-96 text-left shadow-2xl space-y-4">

        <div className="text-xs font-bold tracking-widest text-amber-500 uppercase border-b border-neutral-800 pb-2">
          Select Character
        </div>

        <div
          id="characters-container"
          className="bg-neutral-950 border border-neutral-800 rounded p-2 min-h-[120px] max-h-[250px] overflow-y-auto text-sm text-stone-300 space-y-1"
        >
          <div
            id="character-list-item-0"
            data-index="0"
            data-name={characterName}
            onClick={() => setIsSelected(true)}
            onDoubleClick={(e) => {
              setIsSelected(true);
              if (onConfirm) onConfirm();
              setTimeout(() => triggerEngineConfirm(), 50);
            }}
            className={`w-full text-left px-3 py-2.5 rounded border transition flex justify-between items-center group cursor-pointer character-list-item active ${
              isSelected
                ? 'bg-amber-500/20 border-amber-500 text-amber-400 font-semibold selected'
                : 'bg-neutral-900/50 border-neutral-800 text-stone-400 hover:bg-neutral-800/50'
            }`}
          >
            <span className="pointer-events-none">{characterName}</span>
            <span className="text-[10px] text-amber-500/60 uppercase tracking-wider group-hover:text-amber-400 pointer-events-none">Level 1</span>
          </div>
        </div>

        <div className="flex gap-2 pt-2 border-t border-neutral-800/60">
          <button
            type="button"
            id="charlist-cancel"
            onClick={onClose}
            className="flex-1 py-2 text-xs font-bold tracking-wider uppercase bg-neutral-800 hover:bg-neutral-700 rounded transition text-stone-400"
          >
            Cancel
          </button>

          <button
            type="button"
            id="react-charlist-confirm" // ID alterado para não dar conflito com a busca interna da engine
            onClick={handleConfirmClick}
            className="flex-1 py-2 text-xs font-bold tracking-wider uppercase bg-amber-600 hover:bg-amber-500 text-neutral-950 rounded transition font-semibold"
          >
            Ok
          </button>
        </div>

      </div>
    </div>
  );
}