import { Direction } from '../../network/constants/enum';
import { Position } from './position';
import { Outfit } from './outfit';

// 🆕 Estrutura de uma Skill Individual
export interface PlayerSkill {
  level: number;
  percentage: number; // Progresso de 0 a 100% até o próximo nível
}

// 🆕 Dicionário com todas as Skills do Personagem
export interface PlayerSkills {
  fist?: PlayerSkill;
  club?: PlayerSkill;
  sword?: PlayerSkill;
  axe?: PlayerSkill;
  distance?: PlayerSkill;
  shielding?: PlayerSkill;
  magic?: PlayerSkill;
}

export interface PlayerState {
  name: string;               // 🎯 Sincronizado para o StatusHUD consumir diretamente
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  speed: number;
  level: number;
  experience: number;
  capacity: number;

  // 🆕 CAMPOS ADICIONADOS
  vocation: number;           // 🧙 Vocação (0: None, 1: Knight, 2: Paladin...)
  stamina: number;            // ⚡ Tempo de caça restante (em minutos)
  soul: number;               // 🔮 Soul Points
  skull: number;              // 💀 Marca de PvP (0: None, 1: Yellow, 2: White...)
  inProtectionZone: boolean;  // 🛡️ Status de Zona de Proteção (PZ)

  skills?: PlayerSkills;
}

export interface PlayerInitData {
  guid?: number;
  name?: string;
  direction?: Direction;
  outfit?: Outfit;
  position?: Partial<Position>;
  level?: number;
  health?: number;
  maxHealth?: number;
  mana?: number;
  maxMana?: number;
  speed?: number;
  experience?: number;
  capacity?: number;

  // 🆕 CAMPOS NO INIT
  vocation?: number;
  stamina?: number;
  soul?: number;
  skull?: number;
  inProtectionZone?: boolean;

  skills?: PlayerSkills;
  state?: Partial<PlayerState>;
}

export class Player {
  public guid: number;
  public name: string;
  public position: Position;
  public direction: Direction;
  public outfit: Outfit;
  public state: PlayerState;

  // Controles internos de movimentação
  private __serverWalkConfirmation: boolean = true;
  private __movementBuffer: string | null = null;

  constructor(data?: PlayerInitData) {
    this.guid = data?.guid || 0;
    this.name = data?.name || data?.state?.name || "Player";
    this.direction = data?.direction ?? Direction.SOUTH;

    this.position = {
      x: data?.position?.x ?? 0,
      y: data?.position?.y ?? 0,
      z: data?.position?.z ?? 7
    };

    this.outfit = data?.outfit ?? {
      id: 128,
      head: 0,
      body: 0,
      legs: 0,
      feet: 0
    };

    this.state = {
      name: this.name, // 🎯 Garante que o estado inicial contém o nome real
      health: data?.health ?? data?.state?.health ?? 100,
      maxHealth: data?.maxHealth ?? data?.state?.maxHealth ?? 100,
      mana: data?.mana ?? data?.state?.mana ?? 100,
      maxMana: data?.maxMana ?? data?.state?.maxMana ?? 100,
      speed: data?.speed ?? data?.state?.speed ?? 100,
      level: data?.level ?? data?.state?.level ?? 1,
      experience: data?.experience ?? data?.state?.experience ?? 0,
      capacity: data?.capacity ?? data?.state?.capacity ?? 0,

      // 🆕 Inicializa os novos campos com valores padrão seguros
      vocation: data?.vocation ?? data?.state?.vocation ?? 0,
      stamina: data?.stamina ?? data?.state?.stamina ?? 2520,
      soul: data?.soul ?? data?.state?.soul ?? 100,
      skull: data?.skull ?? data?.state?.skull ?? 0,
      inProtectionZone: data?.inProtectionZone ?? data?.state?.inProtectionZone ?? false,

      // Skills padrão
      skills: data?.skills ?? data?.state?.skills ?? {
        fist: { level: 10, percentage: 0 },
        club: { level: 10, percentage: 0 },
        sword: { level: 10, percentage: 0 },
        axe: { level: 10, percentage: 0 },
        distance: { level: 10, percentage: 0 },
        shielding: { level: 10, percentage: 0 },
        magic: { level: 0, percentage: 0 }
      }
    };
  }

  /**
   * 📍 Retorna uma cópia da posição atual
   */
  public getPosition(): Position {
    return { ...this.position };
  }

  /**
   * 🏃 Retorna a velocidade do jogador
   */
  public getSpeed(): number {
    return this.state.speed;
  }

  /**
   * 🏷️ Atualiza o nome do jogador mantendo o estado sincronizado
   */
  public setName(name: string): void {
    this.name = name;
    this.state.name = name;
  }

  /**
   * 🔄 Atualiza a posição e direção do jogador
   */
  public updatePosition(x: number, y: number, z: number, direction?: Direction): void {
    this.position = { x, y, z };
    if (direction !== undefined) {
      this.direction = direction;
    }
  }

  /**
   * 🩺 Atualiza os atributos vitais de vida e mana
   */
  public updateStats(health: number, maxHealth: number, mana: number, maxMana: number): void {
    this.state.health = health;
    this.state.maxHealth = maxHealth;
    this.state.mana = mana;
    this.state.maxMana = maxMana;
  }

  /**
   * ⚡ Atualiza status secundários (Stamina, Soul, Skull, PZ)
   */
  public updateSecondaryStats(stamina: number, soul: number, skull: number, inPz: boolean): void {
    this.state.stamina = stamina;
    this.state.soul = soul;
    this.state.skull = skull;
    this.state.inProtectionZone = inPz;
  }

  /**
   * ⚔️ Atualiza as habilidades do jogador de forma reativa
   */
  public updateSkills(newSkills: Partial<PlayerSkills>): void {
    this.state.skills = {
      ...this.state.skills,
      ...newSkills
    };
  }

  /**
   * 👔 Atualiza o visual (outfit) do personagem
   */
  public setOutfit(outfit: Outfit): void {
    this.outfit = { ...outfit };
  }

  /**
   * 🚶 Confirmação de passo do servidor
   */
  public confirmServerWalk(): void {
    this.__serverWalkConfirmation = true;
  }

  public isWalkConfirmed(): boolean {
    return this.__serverWalkConfirmation;
  }

  public setPendingWalk(): void {
    this.__serverWalkConfirmation = false;
  }
}