export interface PacketDefinition {
  opcode: number;
  name: string;
  status: 'DONE' | 'IN_PROGRESS' | 'PENDING';
  estimatedCompletion: number; // Porcentagem de 0 a 100%
  description?: string;
}

export const PACKET_REGISTRY: Record<number, PacketDefinition> = {
  // === PACOTES DE INICIALIZAÇÃO E LOGIN ===
  0x00: {
    opcode: 0x00,
    name: 'LOGIN_SUCCESS_RAW',
    status: 'DONE',
    estimatedCompletion: 100,
    description: 'Dados iniciais de login sem tratamento'
  },
  0x01: {
    opcode: 0x01,
    name: 'PING_POSITION_SYNC',
    status: 'IN_PROGRESS',
    estimatedCompletion: 50,
    description: 'Sincronização de tick de posição e keep-alive'
  },
  0x07: {
    opcode: 0x07,
    name: 'SERVER_TIME_OFFSET',
    status: 'DONE',
    estimatedCompletion: 100,
    description: 'Offset de relógio do servidor'
  },
  0x0A: {
    opcode: 0x0A, // 10 em decimal (LOGIN_SUCCESS no SERVER_OPCODES)
    name: 'LOGIN_SUCCESS',
    status: 'DONE',
    estimatedCompletion: 100,
    description: 'Dados completos do player: Vida, Mana, Vocação, Stamina, Soul, Skull, PZ, Equipamentos e Skills'
  },

  // === MUNDO, CIDADE E VISUALIZAÇÃO ===
  0x12: {
    opcode: 0x12,
    name: 'VIEWPORT_DIMENSIONS',
    status: 'IN_PROGRESS',
    estimatedCompletion: 50,
    description: 'Dimensões da câmera de visão (Viewport XYZ)'
  },
  0x20: {
    opcode: 0x20, // 32 em decimal (SEND_SERVER_DATA no SERVER_OPCODES)
    name: 'SERVER_DATA_CONFIG',
    status: 'DONE',
    estimatedCompletion: 100,
    description: 'Configurações de mapa, versão, tick rate e mundo'
  },
  0x2A: {
    opcode: 0x2A,
    name: 'ZONE_INFORMATION',
    status: 'IN_PROGRESS',
    estimatedCompletion: 50,
    description: 'Informações da zona / ambiente / clima'
  },
  0x2D: {
    opcode: 0x2D,
    name: 'TOWN_INFORMATION',
    status: 'IN_PROGRESS',
    estimatedCompletion: 50,
    description: 'Nome da cidade e descrição da região'
  },
  0x30: {
    opcode: 0x30,
    name: 'WORLD_GAME_TIME',
    status: 'IN_PROGRESS',
    estimatedCompletion: 50,
    description: 'Ciclo dia/noite e relógio interno do jogo'
  },

  // === CRIATURAS E JOGADOR ===
  0x08: {
    opcode: 0x08,
    name: 'CREATURE_INFO',
    status: 'DONE',
    estimatedCompletion: 100,
    description: 'Informações detalhadas sobre entidades/monstros'
  },
  0x1E: {
    opcode: 0x1E,
    name: 'PLAYER_STATS_UPDATE',
    status: 'DONE',
    estimatedCompletion: 100,
    description: 'Atualização dinâmica de HP, Mana, Stamina, Soul e Status de PZ/Skull'
  },
  0x21: {
    opcode: 0x21,
    name: 'CREATURE_MOVE',
    status: 'DONE',
    estimatedCompletion: 100,
    description: 'Movimentação e passos de monstros/jogadores'
  },
  0x31: {
    opcode: 0x31,
    name: 'PLAYER_BASIC_STATS',
    status: 'DONE',
    estimatedCompletion: 100,
    description: 'Status básicos carregados no spawn do jogador'
  },

  // === INVENTÁRIO E CONTAINERS ===
  0x38: {
    opcode: 0x38,
    name: 'CONTAINER_INDEX_DATA',
    status: 'IN_PROGRESS',
    estimatedCompletion: 50,
    description: 'Lista de contêineres/mochilas abertas por padrão'
  },

  // === COMUNICAÇÃO E MENSAGENS ===
  0x1C: {
    opcode: 0x1C, // 28 em decimal (PLAYER_LOGIN / CREATURE_SAY)
    name: 'CREATURE_SAY / SPEECH',
    status: 'DONE',
    estimatedCompletion: 100,
    description: 'Mensagens de chat local, fala de criaturas e nome do player'
  },
  0x23: {
    opcode: 0x23,
    name: 'MOTD_WELCOME_MESSAGE',
    status: 'IN_PROGRESS',
    estimatedCompletion: 50,
    description: 'Mensagem do dia (MOTD) / Welcome Back'
  },
  0xAA: {
    opcode: 0xAA,
    name: 'TALK / CHAT_MESSAGE',
    status: 'PENDING',
    estimatedCompletion: 0,
    description: 'Canais de chat globais e privados'
  }
};