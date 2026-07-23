import { PacketReader } from '../protocol/packet-reader';
import { CreatureType, Direction } from '../enums';

export interface PlayerSkillsData {
  sword: { level: number; percentage: number };
  axe: { level: number; percentage: number };
  club: { level: number; percentage: number };
  distance: { level: number; percentage: number };
  shielding: { level: number; percentage: number };
  magic: { level: number; percentage: number };
}

export interface PlayerSpawnData {
  guid: number;
  creatureType: CreatureType;
  position: { x: number; y: number; z: number };
  direction: Direction;
  outfit: { id: number; head: number; body: number; legs: number; feet: number };
  health: number;
  maxHealth: number;
  speed: number;
  name: string;
  experience: number;
  level: number;

  // 🆕 Novas propriedades de Status
  vocation: number;
  mana: number;
  maxMana: number;
  stamina: number;
  soul: number;
  skull: number;
  inProtectionZone: boolean;

  attack: number;
  capacity: number;
  equipment: Array<{ clientId: number; count: number }>;
  skills: PlayerSkillsData;
}

const TOTAL_EQUIPMENT_SLOTS = 10;

/**
 * Helper seguro para obter a posição atual do ponteiro de leitura sem dar NaN
 */
function getReaderIndex(reader: any): number {
  return reader.index ?? reader.offset ?? reader.pointer ?? 0;
}

/**
 * 🛠️ Parser para desempacotar o pacote LOGIN_SUCCESS
 * Sincronizado cirurgicamente com PacketWriter.prototype.writeLoginSuccess
 */
export function parseServerData(reader: PacketReader): PlayerSpawnData | null {
  try {
    const startIndex = getReaderIndex(reader);

    // === PARTE 1: writeCreatureInfo() ===
    const guid = reader.readUInt32();                           // 4 bytes
    const creatureType = reader.readUInt8() as CreatureType;   // 1 byte

    // Position (writePosition -> UInt16 x, UInt16 y, UInt16 z)
    const position = typeof (reader as any).readPosition === 'function'
      ? (reader as any).readPosition()
      : { x: reader.readUInt16(), y: reader.readUInt16(), z: reader.readUInt16() }; // 6 bytes

    const direction = reader.readUInt8() as Direction;          // 1 byte

    // Outfit (writeOutfit)
    const outfitId = reader.readUInt16();                        // 2 bytes
    const head = reader.readUInt8();                             // 1 byte
    const body = reader.readUInt8();                             // 1 byte
    const legs = reader.readUInt8();                             // 1 byte
    const feet = reader.readUInt8();                             // 1 byte

    // Addons / Mounts no writeOutfit (5 bytes nulos ou flags)
    if (typeof (reader as any).skip === 'function') {
      (reader as any).skip(5);
    } else {
      for (let i = 0; i < 5; i++) reader.readUInt8();
    }

    const health = reader.readUInt32();                         // 4 bytes
    const maxHealth = reader.readUInt32();                      // 4 bytes
    const speed = reader.readUInt16();                          // 2 bytes
    reader.readUInt8(); // creatureTypeAttr / skip(1)            // 1 byte

    const name = reader.readString();                            // String com prefixo UInt16

    // Conditions
    const conditionsCount = reader.readUInt8();
    if (typeof (reader as any).skip === 'function') {
      (reader as any).skip(conditionsCount);
    } else {
      for (let i = 0; i < conditionsCount; i++) reader.readUInt8();
    }

    // === PARTE 2: Status do Jogador (ORDEM EXATA DO SERVER) ===
    const experience = reader.readUInt32();                      // 4 bytes
    const level = reader.readUInt16();                           // 2 bytes
    const vocation = reader.readUInt8();                         // 🧙 1 byte

    // 💧 Mana
    const mana = reader.readUInt32();                            // 4 bytes
    const maxMana = reader.readUInt32();                         // 4 bytes

    // ⚡ Stamina e Soul
    const stamina = reader.readUInt16();                         // 2 bytes
    const soul = reader.readUInt8();                             // 1 byte

    // 💀 Skull e Zona de Proteção (PZ)
    const skull = reader.readUInt8();                            // 1 byte
    const inProtectionZone = reader.readUInt8() > 0;             // 1 byte (boolean)

    const attack = reader.readUInt8();                           // 1 byte
    reader.readUInt8(); // attackSlowness / skip(1)               // 1 byte

    // === PARTE 3: Equipamentos (10 slots esperados) ===
    const equipment: Array<{ clientId: number; count: number }> = [];
    for (let i = 0; i < TOTAL_EQUIPMENT_SLOTS; i++) {
      const clientId = reader.readUInt16();
      const count = reader.readUInt8();
      equipment.push({ clientId, count });
    }

    // Capacidade
    const capacity = reader.readUInt32();                        // 4 bytes

    // === PARTE 4: Skills (writeSkills -> 6 skills x [UInt16, UInt8]) ===
    const skillKeys: (keyof PlayerSkillsData)[] = ['sword', 'axe', 'club', 'distance', 'shielding', 'magic'];
    const skills: Partial<PlayerSkillsData> = {};

    skillKeys.forEach(key => {
      const skLevel = reader.readUInt16();
      const skPercentage = reader.readUInt8();
      skills[key] = { level: skLevel, percentage: skPercentage };
    });

    // === PARTE 5: Montarias e Outfits no final do buffer ===
    if (typeof (reader as any).readMounts === 'function') {
      (reader as any).readMounts();
    } else {
      const mountsCount = reader.readUInt8();
      for (let i = 0; i < mountsCount; i++) {
        reader.readUInt16();
        reader.readString();
      }
    }

    if (typeof (reader as any).readOutfits === 'function') {
      (reader as any).readOutfits();
    } else {
      const outfitsCount = reader.readUInt8();
      for (let i = 0; i < outfitsCount; i++) {
        reader.readUInt16();
        reader.readString();
      }
    }

    // 🕵️‍♂️ DIAGNÓSTICO DE BYTES CONSUMIDOS
    const currentIndex = getReaderIndex(reader);
    const totalBytes = (reader as any).buffer ? (reader as any).buffer.length : 0;
    const bytesConsumed = currentIndex - startIndex;

    console.log(
      `🎯 [parseServerData] Consumiu ${bytesConsumed} bytes do pacote (Ponteiro atual: ${currentIndex}/${totalBytes}b)`
    );

    return {
      guid,
      creatureType,
      position,
      direction,
      outfit: { id: outfitId, head, body, legs, feet },
      health,
      maxHealth,
      speed,
      name,
      experience,
      level,
      vocation,
      mana,
      maxMana,
      stamina,
      soul,
      skull,
      inProtectionZone,
      attack,
      capacity,
      equipment,
      skills: skills as PlayerSkillsData,
    };
  } catch (error) {
    console.error("❌ [Parser LOGIN_SUCCESS] Erro crítico ao desempacotar o pacote:", error);
    return null;
  }
}