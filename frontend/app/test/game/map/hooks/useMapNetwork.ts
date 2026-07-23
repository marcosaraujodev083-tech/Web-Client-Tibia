'use client';

import { useEffect, useState } from 'react';
import { NetworkManager } from '../../game/network/services/network-manager';
import { PlayerSpawnData } from '../../game/network/parsers/parseServerData';

interface UseMapNetworkParams {
  network: NetworkManager;
  setStatus?: (status: string) => void;
  addLog?: (msg: string) => void;
}

export function useMapNetwork({ network, setStatus, addLog }: UseMapNetworkParams) {
  const [playerPosition, setPlayerPosition] = useState<{ x: number; y: number; z: number } | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState<boolean>(false);

  useEffect(() => {
    if (!network) return;

    console.log('🗺️ [useMapNetwork] Hook montado e aguardando eventos do servidor...');

    // 🎯 1. Escuta o evento nomeado 'player:spawn' emitido pelo PacketHandler após o parse
    const unsubSpawn = network.subscribe('player:spawn', (data: PlayerSpawnData) => {
      console.log(`🗺️ [useMapNetwork] Jogador spawnado com sucesso no mundo: ${data.name}`, data);

      if (addLog) addLog(`🗺️ Personagem carregado: ${data.name}`);
      if (setStatus) setStatus(`Mapa ativo para ${data.name}`);

      // Atualiza estado limpo usando os dados desempacotados
      if (data?.position) {
        setPlayerPosition(data.position);
        setIsMapLoaded(true);
      }
    });

    // 🎯 2. Escuta atualizações subsequentes de posição do jogador
    const unsubMove = network.subscribe('player:position', (pos: { x: number; y: number; z: number }) => {
      console.log(`📍 [useMapNetwork] Posição atualizada pelo servidor: (${pos.x}, ${pos.y},${pos.z})`);
      setPlayerPosition(pos);
      setIsMapLoaded(true);
    });

    // 🎯 3. Escuta evento direto de dados de mapa do Socket (ex: 0x64 / descrição do mapa)
    const unsubMapData = network.subscribe('map:data_received', (mapData: any) => {
      console.log('📦 [useMapNetwork] RECEBEU PACOTE DE MAPA BRUTO:', mapData);

      if (setStatus) setStatus('Dados de mapa recebidos e sincronizados.');
      if (addLog) addLog('🗺️ Blocos de mapa recebidos do servidor.');

      setIsMapLoaded(true);

      // Notifica a UI / Minimap que o mapa está pronto
      console.log('📢 [useMapNetwork] Emitindo "map:ready" para a UI/Minimap');
      network.emit('map:ready', { isLoaded: true, mapData });
    });

    // 🎯 4. 🚀 Responde a pedidos de sincronização sob demanda da UI/Minimap
    const unsubRequestMap = network.subscribe('map:request_status', () => {
      console.log('📬 [useMapNetwork] Requisição de status do mapa recebida!');
      if (isMapLoaded || playerPosition) {
        console.log('📢 [useMapNetwork] Confirmando que o mapa está ativo para o solicitante.');
        network.emit('map:ready', { isLoaded: true });
      }
    });

    return () => {
      console.log('🔴 [useMapNetwork] Desmontando ouvintes do mapa.');
      unsubSpawn();
      unsubMove();
      unsubMapData();
      unsubRequestMap();
    };
  }, [network, setStatus, addLog, isMapLoaded, playerPosition]);

  return { playerPosition, isMapLoaded };
}