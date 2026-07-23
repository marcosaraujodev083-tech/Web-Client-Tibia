// app/test/game/components/GameStage.tsx
'use client';

import React, { useEffect, useRef } from 'react';
import { NetworkManager } from '../network/services/network-manager';

interface GameStageProps {
  network: NetworkManager;
}

const TILE_SIZE = 32; // Tamanho do tile em pixels

export function GameStage({ network }: GameStageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const playerPosRef = useRef<{ x: number; y: number; z: number }>({ x: 96, y: 96, z: 8 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. OUVINTE DE REDE: Atualiza a posição do player quando o servidor responder
    const unsubPosition = network.subscribe('player:position', (pos: { x: number; y: number; z: number }) => {
      playerPosRef.current = pos;
      render();
    });

    const unsubMove = network.subscribe('player:move', (pos: { x: number; y: number; z: number }) => {
      playerPosRef.current = pos;
      render();
    });

    // 2. FUNÇÃO DE RENDERIZAÇÃO DO MAPA E PLAYER
    const render = () => {
      // Limpa o Canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const playerPos = playerPosRef.current;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // 🗺️ DESENHA O GRID DO MAPA (TILES)
      const range = 10; // Quantos tiles renderizar ao redor do player
      for (let dx = -range; dx <= range; dx++) {
        for (let dy = -range; dy <= range; dy++) {
          const tileX = playerPos.x + dx;
          const tileY = playerPos.y + dy;

          // Calcula a posição x,y na tela centralizada no player
          const screenX = centerX + dx * TILE_SIZE - TILE_SIZE / 2;
          const screenY = centerY + dy * TILE_SIZE - TILE_SIZE / 2;

          // Cor alternada do chão (grade visual temporária)
          ctx.fillStyle = (tileX + tileY) % 2 === 0 ? '#1e293b' : '#0f172a';
          ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

          // Borda dos tiles
          ctx.strokeStyle = '#334155';
          ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        }
      }

      // 🧙‍♂️ DESENHA O VISUAL DO PLAYER (NO CENTRO DA TELA)
      const playerScreenX = centerX - TILE_SIZE / 2;
      const playerScreenY = centerY - TILE_SIZE / 2;

      // Corpo do Player
      ctx.fillStyle = '#3b82f6'; // Azul
      ctx.beginPath();
      ctx.arc(centerX, centerY, TILE_SIZE / 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Nome do Player sobre a cabeça
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Player', centerX, playerScreenY - 4);

      // Coordenadas formatadas abaixo do Player
      ctx.fillStyle = '#94a3b8';
      ctx.font = '9px monospace';
      ctx.fillText(`${playerPos.x}, ${playerPos.y}, ${playerPos.z}`, centerX, centerY + TILE_SIZE / 1.5);
    };

    // Renderização Inicial
    render();

    return () => {
      unsubPosition();
      unsubMove();
    };
  }, [network]);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden rounded-xl border border-neutral-800">
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        className="bg-neutral-950 rounded shadow-2xl"
      />
    </div>
  );
}