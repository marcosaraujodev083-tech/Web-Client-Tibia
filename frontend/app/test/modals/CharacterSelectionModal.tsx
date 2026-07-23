'use client';

import { useEffect, useState } from 'react';

interface CharacterData {
  name: string;
  level: number;
  vocation: string;
}

interface Props {
  onClose: () => void;
  // Handler moderno que recebe diretamente o objeto do personagem selecionado
  onSelect: (character: CharacterData) => void;
}

export default function CharacterSelectionModal({ onClose, onSelect }: Props) {
  const [characters, setCharacters] = useState<CharacterData[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  useEffect(() => {
    // Carrega os personagens direto da sessão montada pelo NetworkManager no login
    const savedSession = sessionStorage.getItem('game_session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        if (parsed.characters && parsed.characters.length > 0) {
          setCharacters(parsed.characters);
        } else {
          // Fallback seguro caso a estrutura inicial esteja fria
          setCharacters([{ name: parsed.account || 'Player', level: 1 }]);
        }
      } catch (e) {
        console.error("[CharModal] Erro ao descriptografar sessão:", e);
      }
    }
  }, []);

  const handleConfirm = (charToSelect?: CharacterData) => {
    const character = charToSelect || characters[selectedIndex];
    if (!character) return;

    // 1. Persiste a escolha na sessão de forma limpa para futuras consultas
    sessionStorage.setItem('selected_character', JSON.stringify(character));

    // 2. Transmite o comando para o page.tsx e abre o mundo via NetworkManager
    console.log(`[CharModal] Personagem selecionado: ${character.name}. Entrando no mundo...`);
    onSelect(character);
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto select-text">
      <div className="bg-neutral-900 border border-neutral-800 rounded-md p-6 w-96 text-left shadow-2xl space-y-4 pointer-events-auto animate-fadeIn">

        <div className="text-xs font-bold tracking-widest text-amber-500 uppercase border-b border-neutral-800 pb-2 select-none">
          Select Character
        </div>

        {/* Lista Dinâmica de Personagens */}
        <div className="bg-neutral-950 border border-neutral-800 rounded p-2 min-h-[120px] max-h-[250px] overflow-y-auto text-sm text-stone-300 space-y-1 select-none">
          {characters.map((char, index) => {
            const isCurrentSelected = selectedIndex === index;
            return (
              <div
                key={index}
                onClick={() => setSelectedIndex(index)}
                onDoubleClick={() => handleConfirm(char)}
                className={`w-full text-left px-3 py-2.5 rounded border transition flex justify-between items-center group cursor-pointer ${
                  isCurrentSelected
                    ? 'bg-amber-500/20 border-amber-500 text-amber-400 font-semibold'
                    : 'bg-neutral-900/50 border-neutral-800 text-stone-400 hover:bg-neutral-800/50'
                }`}
              >
                <span>{char.name}</span>
                <span className={`text-[10px] uppercase tracking-wider ${
                  isCurrentSelected ? 'text-amber-400' : 'text-amber-500/60 group-hover:text-amber-400'
                }`}>
                  Level {char.level}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex gap-2 pt-2 border-t border-neutral-800/60">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="flex-1 py-2 text-xs font-bold tracking-wider uppercase bg-neutral-800 hover:bg-neutral-700 rounded transition text-stone-400 cursor-pointer border-0 outline-none block"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => handleConfirm()}
            className="flex-1 py-2 text-xs font-bold tracking-wider uppercase bg-amber-600 hover:bg-amber-500 text-neutral-950 rounded transition font-semibold cursor-pointer border-0 outline-none block"
          >
            Ok
          </button>
        </div>

      </div>
    </div>
  );
}