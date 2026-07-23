import { useEffect, useRef } from 'react';
import { NetworkManager } from '../../network/services/network-manager';
import { Player } from '../models/player';
import { getValidPosition, sessionCharIsMe } from '../utils/position-utils';
import { InputManager } from '../controllers/input-manager';
import { SERVER_OPCODES } from '../../network/constants/opcodes';
import { Direction } from '../../network/constants/enum';

interface UsePlayerNetworkParams {
  network: NetworkManager;
  selectedChar: string;
  addLog?: (msg: string) => void;
}

export function usePlayerNetwork({
  network,
  selectedChar,
  addLog
}: UsePlayerNetworkParams) {
  const playerRef = useRef<Player | null>(null);

  useEffect(() => {
    if (!network) return;

    // Helper interno para atualizar o Player e notificar os inscritos do Pub/Sub
    const applyPositionUpdate = (x: number, y: number, z: number, direction?: Direction) => {
      const safePos = getValidPosition({ x, y, z }, addLog);

      if (playerRef.current) {
        playerRef.current.updatePosition(safePos.x, safePos.y, safePos.z, direction);
      }

      network.emit('player:position', safePos);
    };

    // Helper para emitir estado de forma Reativa para o React
    const emitPlayerStats = () => {
      if (playerRef.current) {
        console.log('📢 [usePlayerNetwork] Emitindo player:stats para o HUD:', playerRef.current.state);
        network.emit('player:stats', { ...playerRef.current.state });
      }
    };

    // 0. 🆕 Ouve pedidos diretos de sincronização vindos da UI/HUD
    const unsubRequestStats = network.subscribe('player:request_stats', () => {
      console.log('📬 [usePlayerNetwork] HUD solicitou dados do jogador! Respondendo...');
      emitPlayerStats();
    });

    // 1. Ouve Login Success / Dados do Player (LOGIN_SUCCESS)
    const unsubLogin = network.subscribe(SERVER_OPCODES.LOGIN_SUCCESS, (playerInfo) => {
      const safePos = getValidPosition(
        {
          x: playerInfo.position?.x,
          y: playerInfo.position?.y,
          z: playerInfo.position?.z ?? 7
        },
        addLog
      );

      if (addLog) {
        addLog(`🧙‍♂️ Player Carregado: ${playerInfo.name || selectedChar} (Level ${playerInfo.level || 1})`);
        addLog(`📍 Posição Sincronizada: X:${safePos.x} Y:${safePos.y} Z:${safePos.z}`);
      }

      // Garante que os dados do servidor alimentem a instância imediatamente!
      if (!playerRef.current) {
        playerRef.current = new Player({
          guid: playerInfo.guid || playerInfo.id || 0,
          name: playerInfo.name || selectedChar,
          position: safePos,
          level: playerInfo.level || 1,
          experience: playerInfo.experience || 0,
          health: playerInfo.health ?? 150,
          maxHealth: playerInfo.maxHealth ?? 150,
          mana: playerInfo.mana ?? 55,
          maxMana: playerInfo.maxMana ?? 55,
          vocation: playerInfo.vocation ?? 0,
          stamina: playerInfo.stamina ?? 2520,
          soul: playerInfo.soul ?? 100,
          skull: playerInfo.skull ?? 0,
          inProtectionZone: playerInfo.inProtectionZone ?? false,
          capacity: playerInfo.capacity ?? 400
        });
      }

      // Atualizações explícitas de estado (executam SEMPRE, seja criação nova ou reconexão)
      playerRef.current.state.name = playerInfo.name || selectedChar;
      playerRef.current.state.level = playerInfo.level ?? 1;
      playerRef.current.state.experience = playerInfo.experience ?? 0;
      playerRef.current.state.vocation = playerInfo.vocation ?? 0;
      playerRef.current.state.stamina = playerInfo.stamina ?? 2520;
      playerRef.current.state.soul = playerInfo.soul ?? 100;
      playerRef.current.state.skull = playerInfo.skull ?? 0;
      playerRef.current.state.inProtectionZone = playerInfo.inProtectionZone ?? false;
      playerRef.current.state.capacity = playerInfo.capacity ?? 400;

      playerRef.current.updateStats(
        playerInfo.health ?? 150,
        playerInfo.maxHealth ?? 150,
        playerInfo.mana ?? 55,
        playerInfo.maxMana ?? 55
      );

      if (playerInfo.skills) {
        playerRef.current.state.skills = {
          ...playerRef.current.state.skills,
          ...playerInfo.skills
        };
      }

      applyPositionUpdate(safePos.x, safePos.y, safePos.z);

      // Notifica o StatusHUD
      emitPlayerStats();
    });

    // 2. Ouve Atualização de Status / Vida, Mana e Status Secundários
    const unsubStats = network.subscribe('player:stats_update', (stats: any) => {
      if (playerRef.current) {
        if (stats.health !== undefined) playerRef.current.state.health = stats.health;
        if (stats.maxHealth !== undefined) playerRef.current.state.maxHealth = stats.maxHealth;
        if (stats.mana !== undefined) playerRef.current.state.mana = stats.mana;
        if (stats.maxMana !== undefined) playerRef.current.state.maxMana = stats.maxMana;
        if (stats.stamina !== undefined) playerRef.current.state.stamina = stats.stamina;
        if (stats.soul !== undefined) playerRef.current.state.soul = stats.soul;
        if (stats.skull !== undefined) playerRef.current.state.skull = stats.skull;
        if (stats.inProtectionZone !== undefined) playerRef.current.state.inProtectionZone = stats.inProtectionZone;

        emitPlayerStats();
      }
    });

    // 3. Ouve Atualização de Skills
    const unsubSkills = network.subscribe('player:skills_update', (skillsData: any) => {
      if (playerRef.current) {
        playerRef.current.state.skills = {
          ...playerRef.current.state.skills,
          ...skillsData
        };

        if (addLog) addLog('⚔️ Habilidades/Skills atualizadas pelo servidor.');

        emitPlayerStats();
      }
    });

    // 4. Ouve Criaturas e Atualizações de Movimento
    const unsubCreature = network.subscribe(SERVER_OPCODES.CREATURE_INFO, (creatureInfo) => {
      const safePos = getValidPosition(
        {
          x: creatureInfo.position?.x,
          y: creatureInfo.position?.y,
          z: creatureInfo.position?.z ?? 7
        },
        addLog
      );

      if (sessionCharIsMe(creatureInfo.name, selectedChar)) {
        if (!playerRef.current) {
          playerRef.current = new Player({
            guid: creatureInfo.guid || creatureInfo.id || 0,
            name: creatureInfo.name || selectedChar,
            position: safePos
          });
        }

        applyPositionUpdate(safePos.x, safePos.y, safePos.z, creatureInfo.direction);
      }
    });

    // 5. Ouve Passos Locais do Jogador ('player:step')
    const unsubStep = network.subscribe('player:step', ({ opcode }) => {
      if (!playerRef.current) return;

      const currentPos = playerRef.current.getPosition();

      let newX = currentPos.x;
      let newY = currentPos.y;
      let newZ = currentPos.z ?? 7;

      const dir = InputManager.lastRequestedDirection;

      switch (dir) {
        case Direction.WEST:      newX -= 1; break;
        case Direction.NORTH:     newY -= 1; break;
        case Direction.EAST:      newX += 1; break;
        case Direction.SOUTH:     newY += 1; break;
        case Direction.NORTHWEST: newX -= 1; newY -= 1; break;
        case Direction.NORTHEAST: newX += 1; newY -= 1; break;
        case Direction.SOUTHEAST: newX += 1; newY += 1; break;
        case Direction.SOUTHWEST: newX -= 1; newY += 1; break;
      }

      applyPositionUpdate(newX, newY, newZ, dir);

      if (addLog) addLog(`🚶 Passo efetuado (0x${opcode.toString(16).toUpperCase()}): X:${newX} Y:${newY}`);
    });

    return () => {
      unsubRequestStats();
      unsubLogin();
      unsubStats();
      unsubSkills();
      unsubCreature();
      unsubStep();
    };
  }, [network, selectedChar, addLog]);

  return { playerRef };
}