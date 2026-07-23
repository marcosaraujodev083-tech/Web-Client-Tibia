'use client';

import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';

export function usePixiCanvas() {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const pixiAppRef = useRef<PIXI.Application | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // 1. Cria a aplicação PixiJS
    const app = new PIXI.Application();

    // 2. Inicializa o Pixi (compatível com PixiJS v7/v8)
    const initPixi = async () => {
      await app.init({
        width: 800,
        height: 600,
        backgroundColor: 0x1099bb,
        resolution: window.devicePixelRatio || 1,
      });

      if (canvasRef.current) {
        canvasRef.current.appendChild(app.canvas);
      }

      pixiAppRef.current = app;
    };

    initPixi();

    // 🧹 Lifecycle Unmount: Limpa a memória e destroi o canvas ao fechar a página
    return () => {
      if (pixiAppRef.current) {
        pixiAppRef.current.destroy(true, { children: true, texture: true });
        pixiAppRef.current = null;
      }
    };
  }, []);

  // 🎨 Método para desenhar/renderizar os dados recebidos pelo useMapNetwork
  const renderMap = (mapData: Uint8Array) => {
    if (!pixiAppRef.current) return;

    console.log('[PixiCanvas] Renderizando mapa no Canvas com os bytes recebidos:', mapData.length);

    // Aqui você adiciona os Sprites / Container de tiles no Pixi:
    // pixiAppRef.current.stage.addChild(...)
  };

  return {
    canvasRef,
    pixiAppRef,
    renderMap,
  };
}