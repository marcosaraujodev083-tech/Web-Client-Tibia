import { PacketReader } from '../protocol/packet-reader';
import { SERVER_OPCODES } from '../constants/opcodes';
import { NetworkManager } from './network-manager';

export class PacketHandler {
  private network: NetworkManager;
  private lastPlayerInfo: any = null;

  constructor(networkManager: NetworkManager) {
    this.network = networkManager;
    this.setupListeners();
  }

  /**
   * Registra ouvintes para requisições do frontend (ex: sync forçado)
   */
  private setupListeners(): void {
    // Escuta pedidos de re-sincronização do Minimap ou da UI
    this.network.subscribe('player:request_stats', () => {
      if (this.lastPlayerInfo) {
        console.log('🔄 [PacketHandler] Reenviando dados em cache a pedido da UI:', this.lastPlayerInfo);

        if (this.lastPlayerInfo.position) {
          this.network.emit('player:spawn', {
            name: this.lastPlayerInfo.name,
            position: this.lastPlayerInfo.position,
          });
          this.network.emit('player:position', this.lastPlayerInfo.position);
        }

        this.network.emit('player:stats', this.lastPlayerInfo);
      }
    });
  }

  /**
   * Processa o leitor binário síncrono e dispara o evento no Pub/Sub.
   * Retorna `true` se o pacote foi tratado por algum handler.
   */
  public handlePacket(opcode: number, reader: PacketReader): boolean {
    try {
      console.log(`📥 [PacketHandler] Recebido Opcode: 0x${opcode.toString(16).toUpperCase()} (${opcode})`);
      return this.processOpcode(opcode, reader);
    } catch (error) {
      console.error(`💥 [PacketHandler] EXCEÇÃO CRÍTICA ao processar opcode 0x${opcode.toString(16).toUpperCase()}:`, error);
      return false;
    }
  }

  /**
   * Lê os bytes síncronos e despacha os dados parseados via network.emit()
   */
  private processOpcode(opcode: number, reader: PacketReader): boolean {
    switch (opcode) {

      // 🎉 LOGIN SUCCESS / SERVER DATA (0x00 ou 10/0x0A)
      case 0:
      case 0x00:
      case 10:
      case 0x0A:
      case SERVER_OPCODES.LOGIN_SUCCESS: {
        console.log(`🔑 [PacketHandler] Tentando processar LOGIN_SUCCESS (Opcode 0x${opcode.toString(16).toUpperCase()})...`);

        try {
          const playerInfo = reader.readPlayerInfo();

          console.log(`✅ [PacketHandler] readPlayerInfo() executado com sucesso! Dados extraídos:`, playerInfo);

          if (playerInfo) {
            this.lastPlayerInfo = playerInfo;

            this.network.emit(SERVER_OPCODES.LOGIN_SUCCESS, playerInfo);
            this.network.emit(0x00, playerInfo);

            if (playerInfo.position) {
              console.log(`🗺️ [PacketHandler] Disparando "player:spawn" e "player:position"...`, playerInfo.position);

              this.network.emit('player:spawn', {
                name: playerInfo.name,
                position: playerInfo.position,
              });

              this.network.emit('player:position', playerInfo.position);
            } else {
              console.warn(`⚠️ [PacketHandler] playerInfo.position veio indefinido!`);
            }

            console.log(`📢 [PacketHandler] Disparando evento "player:stats"...`);
            this.network.emit('player:stats', {
              name: playerInfo.name,
              health: playerInfo.health,
              maxHealth: playerInfo.maxHealth,
              mana: playerInfo.mana,
              maxMana: playerInfo.maxMana,
              level: playerInfo.level,
              experience: playerInfo.experience,
              vocation: playerInfo.vocation,
              stamina: playerInfo.stamina,
              soul: playerInfo.soul,
              skull: playerInfo.skull,
              inProtectionZone: playerInfo.inProtectionZone,
              capacity: playerInfo.capacity,
              skills: playerInfo.skills,
              equipment: playerInfo.equipment,
              position: playerInfo.position,
            });
          } else {
            console.warn(`⚠️ [PacketHandler] playerInfo retornou nulo ou indefinido!`);
          }

        } catch (readErr) {
          console.error(`❌ [PacketHandler] ERRO DE PARSING em readPlayerInfo():`, readErr);
        }

        this.consumeRemainingBytes(reader);
        return true;
      }

      // 🔄 OP CODE 0x01: Ping / Frame Keep-Alive / Sync Position
      case 1:
      case 0x01: {
        this.network.emit(0x01, { opcode: 0x01 });
        this.consumeRemainingBytes(reader);
        return true;
      }

      // 🚨 OP CODE 0x07 / 7: Offset de Tempo
      case 7:
      case 0x07: {
        const timeOffset = reader.readUInt32();
        this.network.emit(opcode, { timeOffset });
        return true;
      }

      // 🚶 OP CODE 0x0E (14): Confirmação de Movimento / Posição do Player
      case 14:
      case 0x0E: {
        try {
          if (typeof (reader as any).skip === 'function') {
            (reader as any).skip(10);
          } else {
            (reader as any).index = ((reader as any).index || 0) + 10;
          }

          const x = reader.readUInt16();
          const y = reader.readUInt16();
          const z = typeof reader.readByte === 'function' ? reader.readByte() : reader.readUInt8();

          const realPosition = { x, y, z };

          console.log(`📍 [PacketHandler 0x0E] Posição REAL sincronizada do servidor:`, realPosition);

          if (this.lastPlayerInfo) {
            this.lastPlayerInfo.position = realPosition;
          }

          this.network.emit('player:position', realPosition);
          this.network.emit('player:move', realPosition);

        } catch (err) {
          console.error(`⚠️ Erro ao decodificar a posição no Opcode 0x0E:`, err);
        }

        this.consumeRemainingBytes(reader);
        return true;
      }

      // 💬 OP CODE 0x1C: Chat Message / Player List / Speeches
      case 0x1C: {
        let speakerName = '';
        try {
          speakerName = reader.readString();
        } catch {
          // Fallback caso seja um payload diferente
        }

        this.network.emit(0x1C, { speakerName });
        this.consumeRemainingBytes(reader);
        return true;
      }

      // 📊 OP CODE 0x1E: Update Stats Dinâmico (HP / MP / Stamina / Soul / Skull)
      case 0x1E: {
        const hp = reader.readUInt32();
        const maxHp = reader.readUInt32();
        const mp = reader.readUInt32();
        const maxMp = reader.readUInt32();

        console.log(`📊 [PacketHandler] Stats dinamicos atualizados (0x1E): HP ${hp}/${maxHp} | MP ${mp}/${maxMp}`);

        this.network.emit(0x1E, { hp, maxHp, mp, maxMp });

        this.network.emit('player:stats_update', {
          health: hp,
          maxHealth: maxHp,
          mana: mp,
          maxMana: maxMp,
        });

        return true;
      }

      // 🌀 OP CODE 0x18 (24): Teleport / Sync de Posição
      case 24:
      case 0x18: {
        try {
          const creatureId = reader.readUInt32 ? reader.readUInt32() : 0;

          const x = reader.readUInt16();
          const y = reader.readUInt16();
          const z = typeof reader.readByte === 'function' ? reader.readByte() : reader.readUInt8();

          const telePos = { x, y, z };

          console.log(`🌀 [PacketHandler 0x18] Teleport/Sync de posição para ID ${creatureId}:`, telePos);

          if (this.lastPlayerInfo) {
            this.lastPlayerInfo.position = telePos;
          }

          this.network.emit('player:position', telePos);
          this.network.emit('player:teleport', { creatureId, position: telePos });

        } catch (err) {
          console.error(`⚠️ Erro ao processar o Opcode 0x18:`, err);
        }

        this.consumeRemainingBytes(reader);
        return true;
      }

      // ⚙️ OP CODE 0x20: Server Data Configuration
      case 0x20: {
        const serverData = reader.readServerData();
        this.network.emit(0x20, serverData);
        return true;
      }

      // 🦁 OP CODE 0x21 / 33: Movimentação de Criatura / Monstro
      case 33:
      case 0x21: {
        try {
          const movement = reader.readEntityMove();
          this.network.emit(opcode, movement);
        } catch (e) {
          console.error(`⚠️ Erro ao processar movimento da criatura 0x21:`, e);
        }
        return true;
      }

      // 📜 OP CODE 0x23: Welcome Message / MOTD
      case 0x23: {
        this.network.emit(0x23, { opcode: 0x23 });
        this.consumeRemainingBytes(reader);
        return true;
      }

      // 🎵 OP CODE 0x2A: Zone Info / Clima
      case 0x2A: {
        const zoneInfo = reader.readZoneInformation();
        this.network.emit(0x2A, zoneInfo);
        return true;
      }

      // 🏰 OP CODE 0x2D: Town / World Information
      case 0x2D: {
        this.network.emit(0x2D, { opcode: 0x2D });
        this.consumeRemainingBytes(reader);
        return true;
      }

      // ⏰ OP CODE 0x30: World Game Time / Tick
      case 0x30: {
        this.network.emit(0x30, { opcode: 0x30 });
        this.consumeRemainingBytes(reader);
        return true;
      }

      // 👤 OP CODE 0x31: Player Basic Stats
      case 0x31: {
        this.network.emit(0x31, { opcode: 0x31 });
        this.consumeRemainingBytes(reader);
        return true;
      }

      // 🎒 OP CODE 0x38: Container Index Data
      case 0x38: {
        this.network.emit(0x38, { opcode: 0x38 });
        this.consumeRemainingBytes(reader);
        return true;
      }

      // 🗺️ OP CODE 0x64 (100) — CANARY FULL MAP DESCRIPTION (Init Game / Map Spawn)
      case 100:
      case 0x64: {
        try {
          console.log(`🗺️ [PacketHandler 0x64] Recebendo descrição completa do mapa Canary...`);

          let chunkData: any = null;
          if (typeof reader.readChunkData === 'function') {
            chunkData = reader.readChunkData();
          }

          this.network.emit('map:description', chunkData);
          this.network.emit('map:update', chunkData);
        } catch (mapErr) {
          console.error(`⚠️ Erro ao ler descrição do mapa 0x64:`, mapErr);
        }

        this.consumeRemainingBytes(reader);
        return true;
      }

      // 🧱 OP CODES 0x65-0x6A (101-106) — CANARY MAP BOUNDARY UPDATES (Bordas de Passo)
      case 101: case 0x65: // Move North Edge
      case 102: case 0x66: // Move East Edge
      case 103: case 0x67: // Move South Edge
      case 104: case 0x68: // Move West Edge
      case 105: case 0x69: // Floor Change Up
      case 106: case 0x6A: // Floor Change Down
      {
        try {
          console.log(`🧱 [PacketHandler 0x${opcode.toString(16).toUpperCase()}] Atualização de borda do mapa recebida.`);

          let edgeData: any = null;
          if (typeof reader.readChunkData === 'function') {
            edgeData = reader.readChunkData();
          }

          this.network.emit('map:edge_update', { opcode, data: edgeData });
        } catch (edgeErr) {
          console.error(`⚠️ Erro ao processar borda do mapa (Opcode 0x${opcode.toString(16).toUpperCase()}):`, edgeErr);
        }

        this.consumeRemainingBytes(reader);
        return true;
      }

      // 📦 ITEM ADD
      case SERVER_OPCODES.ITEM_ADD: {
        const itemData = reader.readTileItemAdd();
        this.network.emit(SERVER_OPCODES.ITEM_ADD, itemData);
        return true;
      }

      // 🗺️ WRITE CHUNK (Compatibilidade Legada)
      case SERVER_OPCODES.WRITE_CHUNK: {
        try {
          const chunkData = reader.readChunkData();
          this.network.emit(SERVER_OPCODES.WRITE_CHUNK, chunkData);
          this.network.emit('map:update', chunkData);
        } catch (chunkError) {
          console.error("⚠️ Falha ao processar estrutura interna do Chunk gráfico:", chunkError);
        }
        return true;
      }

      // 🦁 CREATURE INFO / SPAWN
      case SERVER_OPCODES.CREATURE_INFO:
      case SERVER_OPCODES.ENTITY_SPAWN: {
        const creatureInfo = reader.readCreatureInfo();
        this.network.emit(opcode, creatureInfo);
        return true;
      }

      // 🔄 CREATURE TURN
      case SERVER_OPCODES.CREATURE_TURN: {
        const turn = reader.readCreatureTurn();
        this.network.emit(SERVER_OPCODES.CREATURE_TURN, turn);
        return true;
      }

      // 💬 SERVER MESSAGE
      case SERVER_OPCODES.SERVER_MESSAGE: {
        const msg = reader.readDefaultMessage();
        this.network.emit(SERVER_OPCODES.SERVER_MESSAGE, msg);
        return true;
      }

      // 💓 LATENCY / HEARTBEAT
      case SERVER_OPCODES.LATENCY: {
        this.network.emit(SERVER_OPCODES.LATENCY, null);
        return true;
      }

      default: {
        if ((opcode >= 0x60 && opcode <= 0x7F) || opcode === 0x1F) {
          this.network.emit('player:step', { opcode });
          return true;
        }

        console.warn(`⚠️ Opcode desconhecido ou não implementado detectado: 0x${opcode.toString(16).toUpperCase()}`);
        return false;
      }
    }
  }

  /**
   * Helper privado para garantir que todo o buffer de um pacote processado
   * seja marcado como lido.
   */
  private consumeRemainingBytes(reader: PacketReader): void {
    const buffer = (reader as any).buffer;
    const totalLength = buffer && typeof buffer.length === 'number' ? buffer.length : 0;

    const currentPos = (reader as any).index ?? (reader as any).offset ?? (reader as any).pointer ?? 0;

    const remaining = totalLength - currentPos;

    if (!isNaN(remaining) && remaining > 0 && typeof (reader as any).skip === 'function') {
      (reader as any).skip(remaining);
    }
  }
}