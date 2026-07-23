'use client';

import React, { useState } from 'react';
import { useInventoryNetwork, InventorySlots } from '../../../game/inventory/hooks/useInventoryNetwork';
import { NetworkManager } from '../../game/network/services/network-manager';

interface InventoryProps {
  network: NetworkManager;
}

export function Inventory({ network }: InventoryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'equip' | 'bag'>('equip');

  // 🎯 1. Consome o Hook oficial de Rede para obter os equipamentos
  const { inventory } = useInventoryNetwork(network);

  // Estado local para a Bag (20 slots padrão)
  const [bagSlots] = useState<Array<{ clientId: number; count: number } | null>>(
    Array(20).fill(null)
  );

  return (
    <>
      {/* 🎒 1. BOTÃO FLUTUANTE DE ABERTURA */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="absolute bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2 bg-[#0c0d10]/95 border-2 border-[#8c733e] hover:border-[#e2b755] text-[#e2b755] font-mono text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(0,0,0,0.8)] hover:shadow-[0_0_20px_rgba(226,183,85,0.25)] active:scale-95 transition-all cursor-pointer rounded-sm"
        >
          <span className="text-sm select-none">🎒</span> Equipment & Bag
        </button>
      )}

      {/* 🛡️ 2. PAINEL MEDIEVAL DO INVENTÁRIO */}
      {isOpen && (
        <div className="absolute bottom-4 right-4 z-50 w-72 bg-[#0d0e12]/95 border-2 border-[#8c733e] rounded-sm flex flex-col font-mono shadow-[0_10px_30px_rgba(0,0,0,0.9)] overflow-hidden">

          {/* CABEÇALHO */}
          <div className="bg-gradient-to-r from-[#14161d] via-[#282216] to-[#14161d] border-b border-[#8c733e]/60 px-3 h-9 flex items-center justify-between shrink-0 select-none">
            <div className="flex items-center gap-1.5">
              <span className="text-amber-500 font-black text-xs">⚡</span>
              <span className="text-xs font-bold uppercase tracking-wider text-[#e2b755] drop-shadow-[0_1px_2px_rgba(0,0,0,1)]">
                {activeTab === 'equip' ? 'Equipment' : 'Backpack'}
              </span>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="text-[#8c733e] hover:text-red-400 font-bold text-sm transition-colors p-1 leading-none"
            >
              ✕
            </button>
          </div>

          {/* NAVEGAÇÃO ENTRE ABAS */}
          <div className="flex bg-[#07080a] border-b border-[#282319] p-1 gap-1">
            <button
              onClick={() => setActiveTab('equip')}
              className={`flex-1 py-1 text-[10px] font-bold uppercase tracking-wider transition-all rounded-xs border ${
                activeTab === 'equip'
                  ? 'bg-[#1b1c24] text-[#e2b755] border-[#8c733e]'
                  : 'text-stone-500 border-transparent hover:text-stone-300'
              }`}
            >
              🛡️ Body
            </button>
            <button
              onClick={() => setActiveTab('bag')}
              className={`flex-1 py-1 text-[10px] font-bold uppercase tracking-wider transition-all rounded-xs border ${
                activeTab === 'bag'
                  ? 'bg-[#1b1c24] text-[#e2b755] border-[#8c733e]'
                  : 'text-stone-500 border-transparent hover:text-stone-300'
              }`}
            >
              🎒 Items (20)
            </button>
          </div>

          {/* 🕹️ ABA 1: BODY EQUIPMENT */}
          {activeTab === 'equip' && (
            <div className="p-4 bg-[#111216] flex flex-col items-center gap-2">

              {/* Head Slot */}
              <Slot item={inventory.head} label="HEAD" />

              {/* Weapon - Armor - Shield */}
              <div className="flex gap-2">
                <Slot item={inventory.weapon} label="L-HAND" />
                <Slot item={inventory.armor} label="CHEST" />
                <Slot item={inventory.shield} label="R-HAND" />
              </div>

              {/* Legs - Backpack */}
              <div className="flex gap-2">
                <Slot item={inventory.legs} label="LEGS" />
                <Slot item={inventory.backpack} label="BAG" />
              </div>

              {/* Boots */}
              <Slot item={inventory.feet} label="FEET" />
            </div>
          )}

          {/* 🎒 ABA 2: BACKPACK SLOTS */}
          {activeTab === 'bag' && (
            <div className="p-3 bg-[#111216] grid grid-cols-4 gap-1.5 max-h-[260px] overflow-y-auto scrollbar-thin">
              {bagSlots.map((item, index) => (
                <div
                  key={index}
                  className="w-12 h-12 bg-[#07080a] border border-[#282319] hover:border-[#8c733e] rounded-sm flex items-center justify-center cursor-pointer transition-colors shadow-inner relative group"
                >
                  {item ? (
                    <span className="text-xs font-bold text-stone-200 select-none drop-shadow-[0_1px_2px_rgba(0,0,0,1)]">
                      ID: {item.clientId}
                    </span>
                  ) : (
                    <span className="text-[8px] font-bold text-neutral-700 select-none">
                      {index + 1}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* RODAPÉ */}
          <div className="bg-[#07080a] border-t border-[#282319] px-3 py-1.5 flex items-center justify-between text-[9px] text-stone-500 font-mono">
            <span>Slots: Active</span>
            <span className="text-amber-500/80 font-bold">Online</span>
          </div>

        </div>
      )}
    </>
  );
}

// 🛡️ COMPONENTE AUXILIAR
function Slot({ item, label }: { item: { clientId: number; count: number } | null; label: string }) {
  const hasItem = Boolean(item && item.clientId > 0);

  return (
    <div
      className={`w-14 h-14 bg-[#07080a] flex flex-col items-center justify-center p-1 text-center cursor-pointer select-none transition-all rounded-sm shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)] ${
        hasItem
          ? 'border-2 border-[#eab308] bg-[#16171d] shadow-[0_0_10px_rgba(234,179,8,0.15)]'
          : 'border border-[#282319] hover:border-[#8c733e]/60'
      }`}
    >
      {hasItem ? (
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold text-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] break-words leading-tight">
            #{item!.clientId}
          </span>
          {item!.count > 1 && (
            <span className="text-[8px] color-[#e2e8f0]">x{item!.count}</span>
          )}
        </div>
      ) : (
        <span className="text-[8px] font-bold text-neutral-600 tracking-wider">
          {label}
        </span>
      )}
    </div>
  );
}