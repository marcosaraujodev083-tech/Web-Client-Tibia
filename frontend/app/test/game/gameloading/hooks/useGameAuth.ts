'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { NetworkManager } from '../../network/services/network-manager';

export interface QueueInfo {
  position: number;
  totalInQueue: number;
}

export interface UseGameAuthReturn {
  network: NetworkManager;
  loading: boolean;
  progress: number;
  status: string;
  isConnected: boolean;
  selectedChar: string;
  queueInfo: QueueInfo | null;
}

export function useGameAuth(): UseGameAuthReturn {
  const router = useRouter();

  // Estados visuais
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Iniciando conexão rúnica...');
  const [isConnected, setIsConnected] = useState(false);
  const [selectedChar, setSelectedChar] = useState<string>('Player');
  const [queueInfo, setQueueInfo] = useState<QueueInfo | null>(null);

  // Instância única do NetworkManager
  const network = useMemo(() => new NetworkManager(), []);

  // Flag para evitar finalização dupla (Opcode 0x00 + GAME_READY)
  const isAuthCompletedRef = useRef(false);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    // 1. Validação de Sessão
    const sessionRaw = sessionStorage.getItem('game_session');

    if (!sessionRaw) {
      setStatus('Sessão não encontrada. Redirecionando...');
      const timer = setTimeout(() => router.push('/test'), 1500);
      timeoutsRef.current.push(timer);
      return;
    }

    let session: any;
    try {
      session = JSON.parse(sessionRaw);
    } catch (e) {
      console.error('[useGameAuth] Erro ao parsear game_session:', e);
      router.push('/test');
      return;
    }

    // Extração do Personagem
    let charName = 'Player';
    if (session.selectedCharacter) {
      charName = typeof session.selectedCharacter === 'object'
        ? session.selectedCharacter.name
        : session.selectedCharacter;
    } else if (session.characters && session.characters.length > 0) {
      charName = typeof session.characters[0] === 'object'
        ? session.characters[0].name
        : session.characters[0];
    }

    const token = session.token || 'guest';
    const host = session.host || '127.0.0.1:8080';

    setSelectedChar(charName);
    setProgress(15);
    setStatus(`Conectando personagem: ${charName}`);

    // 2. Evento de Fila de Espera
    const unsubQueue = network.subscribe('WAITING_QUEUE', (data: QueueInfo) => {
      setLoading(true);
      setQueueInfo(data);
      setProgress(40);
      setStatus(`Aguardando na fila do reino (#${data.position})`);
    });

    // 3. Finalização Única e Segura
    const completeAuthSequence = () => {
      // Trava para evitar que rode duas vezes se receber 0x00 e GAME_READY
      if (isAuthCompletedRef.current) return;
      isAuthCompletedRef.current = true;

      setQueueInfo(null);
      setProgress(85);
      setStatus('Sincronizando feitiços e mapa...');

      const timer1 = setTimeout(() => {
        setProgress(100);
        const timer2 = setTimeout(() => {
          setIsConnected(true);
          setLoading(false);
          setStatus(`Online - Jogando com ${charName}`);
        }, 200);
        timeoutsRef.current.push(timer2);
      }, 400);

      timeoutsRef.current.push(timer1);
    };

    // Escuta evento 'GAME_READY' ou Pacote de Login (0x00 / 'player:spawn')
    const unsubGameReady = network.subscribe('GAME_READY', completeAuthSequence);
    const unsubMapData = network.subscribe(0x00, completeAuthSequence);
    const unsubSpawn = network.subscribe('player:spawn', completeAuthSequence);

    // Callbacks do ciclo de vida do Socket
    network.onConnect = () => {
      setProgress(35);
      setStatus('Conexão estabelecida! Aguardando o reino...');
    };

    network.onDisconnect = () => {
      setIsConnected(false);
      setLoading(false);
      setQueueInfo(null);
      setProgress(0);
      setStatus('Desconectado do reino');
    };

    network.onError = (err) => {
      console.error(`[useGameAuth] Erro no WebSocket: ${err}`);
      setStatus(`Erro de Conexão: ${err}`);
    };

    // Conecta ao servidor
    network.connect(charName, token, host);

    // Cleanup seguro ao desmontar
    return () => {
      // Limpa timeouts pendentes para evitar memory leaks
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];

      if (typeof unsubQueue === 'function') unsubQueue();
      if (typeof unsubGameReady === 'function') unsubGameReady();
      if (typeof unsubMapData === 'function') unsubMapData();
      if (typeof unsubSpawn === 'function') unsubSpawn();

      network.close();
    };
  }, [network, router]);

  return {
    network,
    loading,
    progress,
    status,
    isConnected,
    selectedChar,
    queueInfo,
  };
}