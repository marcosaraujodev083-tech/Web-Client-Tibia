'use client';

import { useEffect, useState } from 'react';
import { NetworkManager } from '../../network/services/network-manager';

export interface MinimapPosition {
  x: number;
  y: number;
  z: number;
}

interface UseMinimapNetworkProps {
  network: NetworkManager;
}

export function useMinimapNetwork({ network }: UseMinimapNetworkProps) {
  const [position, setPosition] = useState<MinimapPosition>({ x: 0, y: 0, z: 7 });
  const [isMapLoaded, setIsMapLoaded] = useState<boolean>(false);

  useEffect(() => {
    if (!network) return;

    // 🎯 1. Escuta quando o Jogador entra no jogo (Login/Spawn)
    const unsubSpawn = network.subscribe('player:spawn', (playerData: { position: MinimapPosition }) => {
      if (playerData?.position) {
        setPosition(playerData.position);
        setIsMapLoaded(true);
      }
    });

    // 🎯 2. Escuta quando o Jogador anda/se move no mapa
    const unsubPosition = network.subscribe('player:position', (newPosition: MinimapPosition) => {
      if (newPosition && typeof newPosition.x === 'number') {
        setPosition(newPosition);
        setIsMapLoaded(true);
      }
    });

    // 🎯 3. Escuta confirmação de recebimento de pacotes de mapa
    const unsubMapData = network.subscribe('map:data_received', () => {
      setIsMapLoaded(true);
    });

    // 🚀 PULL MODEL: Pede as estatísticas/posição atual do Player ao montar o hook
    // Garante sincronização caso o spawn já tenha acontecido durante o loading screen
    network.emit('player:request_stats', true);

    return () => {
      unsubSpawn();
      unsubPosition();
      unsubMapData();
    };
  }, [network]);

  return {
    position,
    isMapLoaded,
  };
}