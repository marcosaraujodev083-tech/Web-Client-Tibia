'use client';

import { useEffect, useState } from 'react';
import { NetworkManager } from '../../network/services/network-manager';
import { PlayerSpawnData } from '../../network/parsers/parseServerData';

// Estrutura mapeada dos 10 slots clássicos de equipamento
export interface InventorySlots {
  head: { clientId: number; count: number } | null;
  amulet: { clientId: number; count: number } | null;
  backpack: { clientId: number; count: number } | null;
  armor: { clientId: number; count: number } | null;
  weapon: { clientId: number; count: number } | null;
  shield: { clientId: number; count: number } | null;
  legs: { clientId: number; count: number } | null;
  feet: { clientId: number; count: number } | null;
  ring: { clientId: number; count: number } | null;
  ammo: { clientId: number; count: number } | null;
}

const INITIAL_INVENTORY: InventorySlots = {
  head: null,
  amulet: null,
  backpack: null,
  armor: null,
  weapon: null,
  shield: null,
  legs: null,
  feet: null,
  ring: null,
  ammo: null,
};

export function useInventoryNetwork(network: NetworkManager) {
  const [inventory, setInventory] = useState<InventorySlots>(INITIAL_INVENTORY);

  useEffect(() => {
    if (!network) return;

    // 🎯 1. Escuta o evento 'player:spawn' emitido após o parseServerData processar o pacote 0x00
    const unsubSpawn = network.subscribe('player:spawn', (playerData: PlayerSpawnData) => {
      if (playerData.equipment && playerData.equipment.length >= 10) {
        const eq = playerData.equipment;

        // Mapeia o array de 10 posições exatas retornado do parseServerData
        setInventory({
          head: eq[0].clientId > 0 ? eq[0] : null,
          amulet: eq[1].clientId > 0 ? eq[1] : null,
          backpack: eq[2].clientId > 0 ? eq[2] : null,
          armor: eq[3].clientId > 0 ? eq[3] : null,
          weapon: eq[4].clientId > 0 ? eq[4] : null,
          shield: eq[5].clientId > 0 ? eq[5] : null,
          legs: eq[6].clientId > 0 ? eq[6] : null,
          feet: eq[7].clientId > 0 ? eq[7] : null,
          ring: eq[8].clientId > 0 ? eq[8] : null,
          ammo: eq[9].clientId > 0 ? eq[9] : null,
        });
      }
    });

    // 🎯 2. Escuta atualizações futuras do inventário (Ex: equipar/desequipar item durante o jogo)
    const unsubUpdate = network.subscribe('inventory:update', (updatedSlots: InventorySlots) => {
      setInventory(updatedSlots);
    });

    return () => {
      unsubSpawn();
      unsubUpdate();
    };
  }, [network]);

  return {
    inventory, // 👈 O componente visual <Inventory /> consome isso diretamente!
  };
}