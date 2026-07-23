import { useEffect, useState } from 'react';
import { NetworkManager } from '@/game/network/services/network-manager';

export interface ChatMessage {
  id: string;
  sender?: string;
  message: string;
  type: 'system' | 'private' | 'channel';
  color?: number;
}

interface UseChatNetworkParams {
  network: NetworkManager;
  addLog?: (msg: string) => void;
}

export function useChatNetwork({ network, addLog }: UseChatNetworkParams) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (!network) return;

    // Helper interno para adicionar mensagem ao estado do React
    const pushMessage = (newMsg: ChatMessage) => {
      setMessages((prev) => [...prev, newMsg]);
      if (addLog) addLog(`💬 Chat [${newMsg.type}]: ${newMsg.message}`);
    };

    // 🎯 1. Escuta Mensagens de Chat (Emitidas pelo PacketHandler após parsear)
    const unsubChat = network.subscribe('chat:message', (data: { name?: string; message: string; color?: number }) => {
      pushMessage({
        id: crypto.randomUUID(),
        sender: data.name,
        message: data.message,
        type: 'channel',
        color: data.color
      });
    });

    // 🎯 2. Escuta Mensagens de Sistema / Servidor
    const unsubServerMsg = network.subscribe('server:message', (data: { message: string }) => {
      pushMessage({
        id: crypto.randomUUID(),
        message: data.message,
        type: 'system'
      });
    });

    return () => {
      unsubChat();
      unsubServerMsg();
    };
  }, [network, addLog]);

  return {
    messages, // 👈 O componente de Chat do React consome este array diretamente!
  };
}