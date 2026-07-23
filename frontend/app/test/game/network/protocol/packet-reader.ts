import { PacketReaderBase } from './packet-reader-base';
import type { Position } from '../../../player/models/position';

export interface CharacterStatistics {
  capacity: number;
  attack: number;
  armor: number;
  speed: number;
}

export interface CharacterInformation {
  name: string;
  level: number;
  gender: number;
}

// ⚔️ 🆕 Incluído o 'fist' na interface do mapa de skills
export interface PlayerSkillsMap {
  fist: { level: number; percentage: number };
  club: { level: number; percentage: number };
  sword: { level: number; percentage: number };
  axe: { level: number; percentage: number };
  distance: { level: number; percentage: number };
  shielding: { level: number; percentage: number };
  magic: { level: number; percentage: number };
}

export class PacketReader extends PacketReaderBase {
  // O construtor é herdado automaticamente da classe base

  // ✅ ESTRUTURAS DE RPG E FLUXO DO JOGO
  public readCharacterStatistics(): CharacterStatistics {
    return {
      capacity: this.readUInt32(),
      attack: this.readUInt8(),
      armor: this.readUInt8(),
      speed: this.readUInt16()
    };
  }

  public readCharacterInformation(): CharacterInformation {
    return {
      name: this.readString(),
      level: this.readUInt16(),
      gender: this.readUInt8()
    };
  }

  public readToggleCondition() {
    return {
      guid: this.readUInt32(),
      toggle: this.readBoolean(),
      cid: this.readUInt16()
    };
  }

  public readCastSpell() {
    return {
      id: this.readUInt16(),
      cooldown: this.readUInt32()
    };
  }

  public readSingleTradeOffer() {
    return {
      id: this.readUInt16(),
      name: this.readString(),
      price: this.readUInt32(),
      type: this.readBoolean() ? "sell" : "buy"
    };
  }

  public readTradeOffer() {
    const id = this.readUInt32();
    const offers = [];
    const length = this.readUInt8();

    for (let i = 0; i < length; i++) {
      offers.push(this.readSingleTradeOffer());
    }

    return { id, offers };
  }

  public readReadable() {
    return {
      writeable: this.readBoolean(),
      content: this.readString(),
      name: this.readString()
    };
  }

  public readAddAchievement() {
    return {
      title: this.readString(),
      description: this.readString()
    };
  }

  public readZoneInformation() {
    return {
      name: this.readString(),
      title: this.readString(),
      music: this.readString(),
      weather: this.readUInt8() / 255,
      ambient: {
        r: this.readUInt8(),
        g: this.readUInt8(),
        b: this.readUInt8(),
        a: this.readUInt8()
      },
      rain: this.readBoolean()
    };
  }

  public readDefaultMessage() {
    return {
      id: this.readUInt32(),
      type: this.readUInt8(),
      message: this.readString(),
      color: this.readUInt8()
    };
  }

  public readFriend() {
    return {
      name: this.readString(),
      online: this.readBoolean()
    };
  }

  public readAnimationLength() {
    return {
      min: this.readUInt32(),
      max: this.readUInt32()
    };
  }

  public readLight() {
    return {
      level: this.readUInt16(),
      color: this.readUInt16()
    };
  }

  public readRemoveItem() {
    return {
      position: this.readPosition(),
      index: this.readUInt8(),
      count: this.readUInt8()
    };
  }

  public readContainerItemRemove() {
    return {
      containerIndex: this.readUInt32(),
      slotIndex: this.readUInt8(),
      count: this.readUInt8()
    };
  }

  // 🛠️ Atualizado para UInt32
  public readGainExperience() {
    return {
      id: this.readUInt32(),
      experience: this.readUInt32()
    };
  }

  public readDamageEvent() {
    return {
      source: this.readUInt32(),
      target: this.readUInt32(),
      damage: this.readUInt32(),
      color: this.readUInt8()
    };
  }

  // 🛠️ Atualizado para UInt32
  public readIncreaseHealth() {
    return {
      id: this.readUInt32(),
      amount: this.readUInt32()
    };
  }

  public readOpenChannel() {
    return {
      id: this.readUInt32(),
      name: this.readString()
    };
  }

  public readOpenContainer() {
    return {
      cid: this.readUInt32(),
      id: this.readUInt16(),
      title: this.readString(),
      items: this.readItems()
    };
  }

  public readCreatureTeleport() {
    return {
      id: this.readUInt32(),
      position: this.readPosition()
    };
  }

  public readEntityMove() {
    return {
      id: this.readUInt32(),
      position: this.readPosition(),
      speed: this.readUInt16()
    };
  }

  public __readChunkTiles() {
    const tiles = [];
    const totalTiles = 8 * 8 * 8;

    for (let i = 0; i < totalTiles; i++) {
      const idOrNull = this.readUInt32();

      if (idOrNull !== 0) {
        const tileId = idOrNull & 0xFFFF;
        const flags = (idOrNull >> 16) & 0xFF;
        const zoneId = (idOrNull >> 24) & 0xFF;

        tiles.push({
          index: i,
          id: tileId,
          flags: flags,
          zoneId: zoneId
        });
      }
    }
    return tiles;
  }

  public readServerWorldConfig() {
    return {
      width: this.readUInt16(),
      height: this.readUInt16(),
      depth: this.readUInt8(),
      chunk: {
        width: this.readUInt8(),
        height: this.readUInt8(),
        depth: this.readUInt8()
      },
      tick: this.readUInt8(),
      clock: this.readUInt16(),
      version: this.readString(),
      clientVersion: this.readUInt16()
    };
  }

  public readContainerItemAdd() {
    return {
      containerId: this.readUInt32(),
      slot: this.readUInt8(),
      itemId: this.readUInt16(),
      count: this.readUInt8(),
    };
  }

  public readTileItemAdd() {
    return {
      id: this.readUInt16(),
      count: this.readUInt8(),
      position: this.readPosition(),
      slot: this.readUInt8()
    };
  }

  public readCreatureTurn() {
    return {
      id: this.readUInt32(),
      direction: this.readUInt8()
    };
  }

  public readDistanceEffect() {
    return {
      from: this.readPosition(),
      to: this.readPosition(),
      type: this.readUInt8()
    };
  }

  public readMagicEffect() {
    return {
      position: this.readPosition(),
      type: this.readUInt8()
    };
  }

  public readChangeOutfit() {
    return {
      id: this.readUInt32(),
      outfit: this.readOutfit()
    };
  }

  public readTransformTile() {
    return {
      position: this.readPosition(),
      id: this.readUInt16()
    };
  }

  public readOutfitDetails() {
    return {
      head: this.readUInt8(),
      body: this.readUInt8(),
      legs: this.readUInt8(),
      feet: this.readUInt8()
    };
  }

  public readLookType() {
    const id = this.readUInt16();
    const details = {
      head: this.readInt8(),
      body: this.readInt8(),
      legs: this.readInt8(),
      feet: this.readInt8()
    };
    const mount = this.readUInt16();
    return { id, details, mount };
  }

  public readItems() {
    const size = this.readUInt8();
    const items = [];
    for (let i = 0; i < size; i++) {
      items.push(this.readItem());
    }
    return items;
  }

  public readCreatureType(): string {
    const type = this.readUInt8();
    switch (type) {
      case 0: return "Player";
      case 1: return "Monster";
      default: return "NPC";
    }
  }

  public readConditions(): number[] {
    const size = this.readUInt8();
    const conditions = [];
    for (let i = 0; i < size; i++) {
      conditions.push(this.readUInt8());
    }
    return conditions;
  }

  public readCreatureInfo() {
    const id = this.readUInt32();
    const type = this.readUInt8();
    const position = this.readPosition();
    const direction = this.readUInt8();
    const outfit = this.readOutfit();
    const health = this.readUInt32();
    const maxHealth = this.readUInt32();
    const speed = this.readUInt16();
    this.skip(1); // creatureTypeAttr
    const name = this.readString();
    const conditionsCount = this.readUInt8();
    this.skip(conditionsCount); // Pula IDs das condições

    return {
      id,
      type,
      position,
      direction,
      outfit,
      health,
      maxHealth,
      speed,
      name
    };
  }

  public readChunkData() {
    return {
      id: this.readUInt32(),
      position: this.readPosition(),
      tiles: this.__readChunkTiles()
    };
  }

  public readPrivateMessage() {
    return {
      name: this.readString(),
      message: this.readString()
    };
  }

  public readChannelMessage() {
    return {
      id: this.readUInt32(),
      name: this.readString(),
      message: this.readString(),
      color: this.readUInt8()
    };
  }

  public readItemInformation() {
    return {
      sid: this.readUInt16(),
      cid: this.readUInt16(),
      weight: this.readUInt16(),
      attack: this.readUInt8(),
      armor: this.readUInt8(),
      distanceReadable: this.readString(),
      article: this.readString(),
      name: this.readString(),
      description: this.readString(),
      count: this.readUInt8()
    };
  }

  /**
   * Lê os 10 Slots de equipamento do personagem
   */
  public readEquipment() {
    const items = [];
    for (let i = 0; i < 10; i++) {
      items.push(this.readItem());
    }
    return items;
  }

  /**
   * ⚔️ 🆕 Leitura ordenada das 7 Habilidades (Skills), incluindo Fist Fighting
   */
  public readSkills(): PlayerSkillsMap {
    return {
      fist: { level: this.readUInt16(), percentage: this.readUInt8() },
      club: { level: this.readUInt16(), percentage: this.readUInt8() },
      sword: { level: this.readUInt16(), percentage: this.readUInt8() },
      axe: { level: this.readUInt16(), percentage: this.readUInt8() },
      distance: { level: this.readUInt16(), percentage: this.readUInt8() },
      shielding: { level: this.readUInt16(), percentage: this.readUInt8() },
      magic: { level: this.readUInt16(), percentage: this.readUInt8() }
    };
  }

  /**
   * 🎯 Leitura Alinhada do Pacote 0x0A (Login Success / Player Info)
   */
  public readPlayerInfo() {
    const baseCreature = this.readCreatureInfo();

    // Stats Básicos
    const experience = this.readUInt32();
    const level = this.readUInt16();
    const vocation = this.readUInt8();           // 🧙 Vocação

    // Mana
    const mana = this.readUInt32();              // 💧 Mana
    const maxMana = this.readUInt32();           // 💧 MaxMana

    // Stats Secundários
    const stamina = this.readUInt16();           // ⚡ Stamina
    const soul = this.readUInt8();               // 🔮 Soul
    const skull = this.readUInt8();              // 💀 Skull
    const inProtectionZone = this.readBoolean(); // 🛡️ PZ

    const attack = this.readUInt8();
    this.skip(1); // attackSlowness

    // Equipamentos (10 slots)
    const equipment = this.readEquipment();
    const capacity = this.readUInt32();

    // Skills
    const skills = this.readSkills();

    // Montarias e Outfits no final da stream
    const mounts = this.readMounts();
    const outfits = this.readOutfits();

    return {
      guid: baseCreature.id,
      creatureType: baseCreature.type,
      position: baseCreature.position,
      direction: baseCreature.direction,
      outfit: baseCreature.outfit,
      health: baseCreature.health,
      maxHealth: baseCreature.maxHealth,
      speed: baseCreature.speed,
      name: baseCreature.name,
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
      skills,
      mounts,
      outfits
    };
  }

  public readMounts() {
    const length = this.readUInt8();
    const mounts = [];
    for (let i = 0; i < length; i++) {
      mounts.push({
        id: this.readUInt16(),
        name: this.readString()
      });
    }
    return mounts;
  }

  public readSpells(): number[] {
    const length = this.readUInt8();
    const spells = [];
    for (let i = 0; i < length; i++) {
      spells.push(this.readUInt8());
    }
    return spells;
  }

  public readOutfits() {
    const length = this.readUInt8();
    const outfits = [];
    for (let i = 0; i < length; i++) {
      outfits.push(this.__readSingleOutfit());
    }
    return outfits;
  }

  private __readSingleSpell() {
    return {
      id: this.readUInt8(),
      name: this.readString(),
      description: this.readString(),
      icon: this.readPosition()
    };
  }

  private __readSingleOutfit() {
    return {
      id: this.readUInt16(),
      name: this.readString()
    };
  }
}