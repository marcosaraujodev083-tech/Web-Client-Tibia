// Direções de movimento tradicionais do Tibia
export enum Direction {
  NORTH = 0,
  EAST = 1,
  SOUTH = 2,
  WEST = 3,
  NORTH_EAST = 4,
  SOUTH_EAST = 5,
  SOUTH_WEST = 6,
  NORTH_WEST = 7
}

// Tipos de Criaturas no mundo (útil para creature.ts e player.ts)
export enum CreatureType {
  PLAYER = 0,
  MONSTER = 1,
  NPC = 2
}

// Estados de conexao do NetworkManager
export enum ConnectionState {
  DISCONNECTED = 0,
  CONNECTING = 1,
  CONNECTED = 2
}

// Modos de combate clássicos
export enum FightMode {
  OFFENSIVE = 1,
  BALANCED = 2,
  DEFENSIVE = 3
}