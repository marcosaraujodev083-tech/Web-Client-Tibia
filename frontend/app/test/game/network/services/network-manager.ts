import { PacketReader } from '../protocol/packet-reader';
import { PacketHandler } from '../protocol/packet-handler';
import { PACKET_REGISTRY, PacketDefinition } from '../protocol/packet-registry';

// Tipo de callback para os inscritos no Pub/Sub
export type PacketCallback<T = any> = (data: T) => void;

// Interface do Diagnóstico emitido para a UI / DebugControls
export interface PacketDiagnosticData {
  opcode: number;
  name: string;
  registryStatus: 'DONE' | 'IN_PROGRESS' | 'PENDING';
  manualProgress: number;
  byteCoveragePercent: number;
  bytesRead: number;
  totalBytes: number;
  unreadBytes: number;
  isFullyParsed: boolean;
}

export class NetworkManager {
  private socket: WebSocket | null = null;
  private host: string = "127.0.0.1:8080";

  // 📡 PUB/SUB MAPPER: Suporta Opcodes numéricos (0x00, 0x0A) ou Strings ('player:stats', 'WAITING_QUEUE')
  private subscribers: Map<number | string, Set<PacketCallback>> = new Map();

  // ⚙️ Instância acoplada do interpretador de pacotes
  private packetHandler: PacketHandler;

  // Callbacks de ciclo de vida da conexão
  public onConnect: (() => void) | null = null;
  public onDisconnect: (() => void) | null = null;
  public onError: ((error: string) => void) | null = null;

  // Callback opcional de inspeção/debug de pacotes brutos
  public onPacketReceived: ((opcode: number, reader: PacketReader) => void) | null = null;

  constructor() {
    // Inicializa o gerenciador de pacotes conectando-o ao próprio NetworkManager
    this.packetHandler = new PacketHandler(this);
    console.log("[NetworkManager] Inicializado e integrado ao PacketHandler (Pub/Sub).");
  }

  /**
   * 🟢 PUB/SUB: Registra um ouvinte de eventos (Alias para compatibilidade com network.on)
   */
  public on<T = any>(eventOrOpcode: number | string, callback: PacketCallback<T>): () => void {
    return this.subscribe(eventOrOpcode, callback);
  }

  /**
   * 🔴 PUB/SUB: Remove uma inscrição de evento específica
   */
  public off<T = any>(eventOrOpcode: number | string, callback: PacketCallback<T>): void {
    const callbacks = this.subscribers.get(eventOrOpcode);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.subscribers.delete(eventOrOpcode);
      }
    }
  }

  /**
   * 🎯 PUB/SUB: Inscreve um callback para escutar um Opcode ou Evento específico.
   * Retorna a função de Unsubscribe automática para ser usada em hooks do React.
   */
  public subscribe<T = any>(opcodeOrEvent: number | string, callback: PacketCallback<T>): () => void {
    if (!this.subscribers.has(opcodeOrEvent)) {
      this.subscribers.set(opcodeOrEvent, new Set());
    }

    this.subscribers.get(opcodeOrEvent)!.add(callback);

    return () => {
      this.off(opcodeOrEvent, callback);
    };
  }

  /**
   * 📢 PUB/SUB: Emite dados parseados para todos os componentes inscritos naquele evento.
   */
  public emit(opcodeOrEvent: number | string, parsedData: any): void {
    const callbacks = this.subscribers.get(opcodeOrEvent);
    if (callbacks) {
      callbacks.forEach((cb) => cb(parsedData));
    }
  }

  /**
   * Getter seguro para o socket ativo
   */
  public get rawSocket(): WebSocket | null {
    return this.socket;
  }

  /**
   * Conecta ao servidor WebSocket
   */
  public connect(characterName: string, accountToken: string, customHost?: string): void {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      console.log("[NetworkManager] Conexão em andamento ou já ativa.");
      return;
    }

    if (customHost) this.host = customHost;

    // Normaliza o protocolo do host
    const formattedHost = this.host.startsWith('ws://') || this.host.startsWith('wss://')
      ? this.host
      : `ws://${this.host}`;

    const wsUrl = `${formattedHost}?character=${encodeURIComponent(characterName)}&token=${encodeURIComponent(accountToken)}`;
    console.log(`[NetworkManager] Conectando ao GameServer em ${wsUrl}...`);

    try {
      this.socket = new WebSocket(wsUrl);
      this.socket.binaryType = 'arraybuffer';

      this.socket.onopen = () => {
        console.log("[NetworkManager] ✅ Túnel WebSocket estabelecido e autenticado!");
        if (this.onConnect) this.onConnect();
      };

      this.socket.onmessage = async (event: MessageEvent) => {
        await this.handleIncomingMessage(event);
      };

      this.socket.onerror = (error) => {
        console.error("[NetworkManager] ❌ Erro na conexão socket:", error);
        if (this.onError) this.onError("Erro na conexão com o servidor de jogo.");
      };

      this.socket.onclose = (event) => {
        console.log(`[NetworkManager] 🔌 Conexão fechada. Código: ${event.code}, Razão: ${event.reason || "Nenhuma informada"}`);
        if (this.onDisconnect) this.onDisconnect();
        this.socket = null;
      };

    } catch (err: any) {
      console.error("[NetworkManager] Falha crítica ao inicializar WebSocket:", err);
      if (this.onError) this.onError(err.message);
    }
  }

  /**
   * Fatiamento de stream WebSocket e envio direto para o PacketHandler ou Eventos JSON
   */
  private async handleIncomingMessage(event: MessageEvent): Promise<void> {
    let arrayBuffer: ArrayBuffer;

    // 💡 TRATAMENTO DE TEXTO/JSON (Eventos de controle do servidor como Fila, Chat, Status)
    if (typeof event.data === 'string') {
      try {
        const jsonMessage = JSON.parse(event.data);
        if (jsonMessage && jsonMessage.type) {
          this.emit(jsonMessage.type, jsonMessage);
        } else if (jsonMessage && jsonMessage.opcode !== undefined) {
          this.emit(jsonMessage.opcode, jsonMessage);
        }
      } catch (err) {
        console.log("[NetworkManager] Mensagem de texto não-JSON recebida:", event.data);
      }
      return;
    }

    // 💡 TRATAMENTO BINÁRIO (Pacotes do protocolo do jogo)
    if (event.data instanceof ArrayBuffer) {
      arrayBuffer = event.data;
    } else if (event.data instanceof Blob) {
      arrayBuffer = await event.data.arrayBuffer();
    } else {
      return;
    }

    const fullBuffer = new Uint8Array(arrayBuffer);

    if (fullBuffer.length === 0) return;

    let currentIdx = 0;

    // Tenta fatiar o buffer caso venha com cabeçalho de 2 bytes de tamanho por pacote
    while (currentIdx < fullBuffer.length) {
      if (currentIdx + 2 > fullBuffer.length) {
        const rawPacket = fullBuffer.subarray(currentIdx);
        this.processRawPacket(rawPacket);
        break;
      }

      // Lê os 2 primeiros bytes como tamanho em Little-Endian
      const packetLength = fullBuffer[currentIdx] | (fullBuffer[currentIdx + 1] << 8);
      const headerSize = 2;

      // VERIFICAÇÃO: Se o tamanho bate exatamente com o chunk restante do buffer
      const isValidLengthHeader = packetLength > 0 && (currentIdx + headerSize + packetLength <= fullBuffer.length);

      if (isValidLengthHeader) {
        currentIdx += headerSize;
        const packetData = fullBuffer.subarray(currentIdx, currentIdx + packetLength);
        this.processRawPacket(packetData);
        currentIdx += packetLength;
      } else {
        // CASO DIRETO: O servidor enviou o pacote direto sem cabeçalho de 2b
        const rawPacket = fullBuffer.subarray(currentIdx);
        this.processRawPacket(rawPacket);
        break;
      }
    }
  }

  /**
   * Processa individualmente a fatia de bytes de um pacote e emite o diagnóstico
   */
  private processRawPacket(packetData: Uint8Array): void {
    const reader = new PacketReader(packetData);

    if (reader.readable()) {
      const opcode = reader.readUInt8();

      // 🎯 1. Tenta processar via PacketHandler
      const handledByHandler = this.packetHandler.handlePacket(opcode, reader);

      // 🎯 2. Verifica se existem inscritos diretos via Pub/Sub
      const hasSubscribers = this.subscribers.has(opcode) && (this.subscribers.get(opcode)?.size ?? 0) > 0;

      // Se não foi tratado pelo PacketHandler mas há inscritos no Pub/Sub, emite o evento
      if (!handledByHandler && hasSubscribers) {
        this.emit(opcode, packetData);
      }

      // 📋 3. DIAGNÓSTICO E CHECKLIST DE BYTES (CROSS-REFERENCE COM PACKET_REGISTRY)
      const packetDef: PacketDefinition = PACKET_REGISTRY[opcode] || {
        opcode,
        name: `UNKNOWN_OPCODE_0x${opcode.toString(16).toUpperCase()}`,
        status: 'PENDING',
        estimatedCompletion: 0
      };

      const totalBytes = packetData.length;

      // Obtém o índice atual lido pelo reader
      const bytesRead = typeof reader.index === 'number'
        ? reader.index
        : totalBytes;

      const unreadBytes = Math.max(0, totalBytes - bytesRead);
      const byteCoveragePercent = totalBytes > 0 ? Math.round((bytesRead / totalBytes) * 100) : 100;

      const diagnosticData: PacketDiagnosticData = {
        opcode,
        name: packetDef.name,
        registryStatus: packetDef.status,
        manualProgress: packetDef.estimatedCompletion,
        byteCoveragePercent,
        bytesRead,
        totalBytes,
        unreadBytes,
        isFullyParsed: unreadBytes === 0
      };

      // 📢 Emite o evento de diagnóstico para o DebugControls escutar
      this.emit('debug:packet_diagnostic', diagnosticData);

      const isHandled = handledByHandler || hasSubscribers;

      // 🎯 4. Notifica o listener de debug caso ninguém tenha tratado o pacote
      if (!isHandled && this.onPacketReceived) {
        reader.index = 0; // Reset seguro
        this.onPacketReceived(opcode, reader);
      }
    }
  }

  /**
   * Envia dados brutos binários ou strings para o servidor
   */
  public send(data: ArrayBuffer | Uint8Array | string): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(data);
    } else {
      console.warn("[NetworkManager] Tentativa de envio falhou: Socket desconectado.");
    }
  }

  /**
   * 📤 Helper para construir e enviar pacotes binários formatados com Opcode
   */
  public sendPacket(opcode: number, payload?: Uint8Array): void {
    const payloadLength = payload ? payload.length : 0;
    const packet = new Uint8Array(1 + payloadLength);
    packet[0] = opcode;
    if (payload) {
      packet.set(payload, 1);
    }
    this.send(packet);
  }

  public sendLatencyResponse(latencyOpcode: number): void {
    const buffer = new Uint8Array([latencyOpcode]);
    this.send(buffer);
  }

  public close(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}