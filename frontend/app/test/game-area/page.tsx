'use client';

import { useEffect, useRef } from 'react';

// 🌐 Input Controller
import { InputManager } from '../game/player/controllers/input-manager';

// 🎨 Renderizador Gráfico PixiJS
import { GameApplication } from '../game/renderer/services/game-application';

// 🧩 Custom Hooks de Negócio & Autenticação
import { useGameAuth } from '../game/gameloading/hooks/useGameAuth';
import { usePlayerNetwork } from '../game/player/hooks/usePlayerNetwork';
import { useMapNetwork } from '../game/map/hooks/useMapNetwork';
import { useChatNetwork } from '../game/chat/hooks/useChatNetwork';
import { useInventoryNetwork } from '../game/inventory/hooks/useInventoryNetwork';

// 💬 Componentes de UI / Overlays / DevTools
import { GameLoadingOverlay } from '../game/gameloading/components/GameLoadingOverlay';
import { Chat } from '../game/chat/components/Chat';
import { Inventory } from '../game/inventory/components/Inventory';
import { StatusHUD } from '../game/player/components/StatusHUD';
import { Minimap } from '../game/minimap/components/Minimap';
import { DebugControls } from '../game/debug/components/DebugControls';
import { GameStage } from '../game/stage/GameStage';

export default function GameAreaPage() {
  // 🛡️ 1. Hook de Autenticação e Estado da Rede
  const {
    network,
    loading,
    progress,
    status,
    setStatus, // 👈 Função para atualizar mensagens dinâmicas
    isConnected,
    selectedChar,
    queueInfo,
  } = useGameAuth();

  // Referências para DOM e Motor Gráfico PixiJS
  const pixiContainerRef = useRef<HTMLDivElement>(null);
  const pixiAppRef = useRef<GameApplication | null>(null);

  // ==========================================
  // 🎨 2. INICIALIZAÇÃO E MONTAGEM DO PIXIJS
  // ==========================================
  useEffect(() => {
    if (pixiContainerRef.current && !pixiAppRef.current) {
      try {
        pixiAppRef.current = new GameApplication(pixiContainerRef.current);
        console.log('[PixiJS] GameApplication anexado com sucesso ao container!');
      } catch (err) {
        console.error('[PixiJS] Falha ao inicializar o motor gráfico:', err);
      }
    }

    return () => {
      if (pixiAppRef.current) {
        try {
          pixiAppRef.current.destroy();
          console.log('[PixiJS] GameApplication destruído e limpo.');
        } catch (e) {
          console.warn('[PixiJS] Exceção ignorada no destroy do PixiJS App:', e);
        }
        pixiAppRef.current = null;
      }
    };
  }, []);

  // ==========================================
  // 🎯 3. INJEÇÃO DOS HOOKS DAS FEATURES (PUB/SUB)
  // ==========================================
  usePlayerNetwork({
    network,
    selectedChar,
  });

  // 🔄 Conectamos o setStatus real do Hook ao Mapa!
  useMapNetwork({
    network,
    pixiAppRef,
    setStatus,
  });

  useChatNetwork({
    network,
  });

  useInventoryNetwork(network);

  // ==========================================
  // 🎮 4. GERENCIADOR DE ENTRADA / TECLADO (WASD / SETAS)
  // ==========================================
  useEffect(() => {
    // Só ativa os controles de andada quando a conexão estiver ativa E a tela de loading sumir
    if (loading || !isConnected || !network) return;

    const inputManager = new InputManager(network);
    inputManager.start();
    console.log('🎮 [InputManager] Teclado ativado para movimentação do jogador!');

    return () => {
      inputManager.stop();
      console.log('🔴 [InputManager] Teclado desativado.');
    };
  }, [loading, isConnected, network]);

  return (
    <main className="h-screen w-screen bg-neutral-950 text-stone-200 font-sans p-4 flex flex-col gap-4 overflow-hidden relative">
      {/* TOP BAR STATUS */}
      <div className="flex items-center justify-between bg-neutral-900 border border-neutral-800 px-6 py-3 rounded-xl shadow-md shrink-0 z-10">
        <div>
          <h1 className="text-lg font-bold tracking-wide text-stone-100 flex items-center gap-2">
            <span className="text-amber-500 font-black">⚡</span> Tibia HTML5 — Game Client
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5 font-mono">{status}</p>
        </div>
        <div className="flex items-center gap-3 bg-neutral-950/60 px-4 py-2 rounded-lg border border-neutral-800">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
            }`}
          />
          <span className="text-xs font-mono font-semibold tracking-wider uppercase text-neutral-300">
            {isConnected ? 'Network Active' : 'Offline'}
          </span>
        </div>
      </div>

      {/* TELA INTEGRAL DO JOGO / VIEWPORT */}
      <div className="flex-1 bg-neutral-900 border border-neutral-800/60 rounded-xl relative flex flex-col items-center justify-center shadow-inner overflow-hidden min-h-0">
        <div className="absolute top-3 left-3 bg-neutral-950/80 text-[10px] font-mono px-2.5 py-1 rounded border border-neutral-800 text-neutral-500 z-20">
          VIEWPORT_RENDER_SCREEN
        </div>

        {/* 🎯 OVERLAY DE CARREGAMENTO MEDIEVAL */}
        {loading && (
          <GameLoadingOverlay
            progress={progress}
            status={status}
            queueInfo={queueInfo}
          />
        )}

        {/* 🎯 CONTEXTO DO CANVAS PIXIJS */}
        <div
          ref={pixiContainerRef}
          className={`transition-all duration-700 shadow-2xl rounded border border-neutral-950/80 ${
            !loading && isConnected
              ? 'opacity-100 scale-100'
              : 'opacity-0 scale-95 absolute pointer-events-none'
          }`}
        />

        {/* 💬 INTERFACE MODULAR & HUD */}
        {!loading && isConnected && (
          <>
            <div className="absolute top-4 left-4 z-30 pointer-events-auto">
              <StatusHUD network={network} />
            </div>

            {/* 🎯 Minimap configurado com controle de visibilidade/carregamento */}
            <div className="absolute top-32 left-4 z-30 pointer-events-auto">
              <Minimap network={network} isMapLoaded={!loading} />
            </div>
            <GameStage network={network} />
            <DebugControls network={network} />
            <Chat network={network} />
            <Inventory network={network} />
          </>
        )}
      </div>
    </main>
  );
}