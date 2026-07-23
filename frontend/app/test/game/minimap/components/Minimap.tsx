'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useMinimapNetwork } from '../hooks/useMinimapNetwork';
import { NetworkManager } from '../../network/services/network-manager';

interface Position {
  x: number;
  y: number;
  z: number;
}

interface MinimapProps {
  network?: NetworkManager;
  isMapLoaded?: boolean;
}

export function Minimap({ network, isMapLoaded: parentMapLoaded = true }: MinimapProps) {
  // 🔌 Consome a posição real do Player no servidor (Passagem segura)
  const { position: playerPosition, isMapLoaded: hookMapLoaded } = useMinimapNetwork({
    network: network as NetworkManager,
  });

  // Consolida a prontidão do mapa
  const mapReady = parentMapLoaded && hookMapLoaded;

  // 📷 1. POSIÇÃO DA CÂMERA DO MINIMAP & ESTADO DE TRAVA
  const [cameraPosition, setCameraPosition] = useState<Position>({ x: 0, y: 0, z: 7 });
  const [isLockedToPlayer, setIsLockedToPlayer] = useState(true);

  // Sincroniza a câmera com o Player automaticamente enquanto estiver travado
  useEffect(() => {
    if (isLockedToPlayer && playerPosition && (playerPosition.x !== 0 || playerPosition.y !== 0)) {
      setCameraPosition(playerPosition);
    }
  }, [playerPosition, isLockedToPlayer]);

  // 🖱️ 2. ESTADOS E REFS PARA O ARRASTE GLOBAL DA JANELA (WINDOW DRAG)
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Apenas clique esquerdo
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - offset.x,
      y: e.clientY - offset.y,
    };
  };

  // Escuta os movimentos Globais do Mouse na Janela para o Arraste Perfeito
  useEffect(() => {
    const handleWindowMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setOffset({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      });
    };

    const handleWindowMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleWindowMouseMove);
      window.addEventListener('mouseup', handleWindowMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [isDragging]);

  // 🕹️ 3. CONTROLES DE MOVIMENTAÇÃO DA CÂMERA DO MINIMAP
  const moveCamera = (dx: number, dy: number) => {
    setIsLockedToPlayer(false); // Destrava do player para navegação livre
    setCameraPosition((prev) => ({
      ...prev,
      x: prev.x + dx,
      y: prev.y + dy,
    }));
  };

  const changeFloor = (dz: number) => {
    setIsLockedToPlayer(false);
    setCameraPosition((prev) => ({
      ...prev,
      z: Math.max(0, Math.min(15, prev.z + dz)),
    }));
  };

  const centerOnPlayer = () => {
    if (playerPosition) {
      setCameraPosition(playerPosition);
      setIsLockedToPlayer(true);
    }
  };

  return (
    <div
      style={{
        ...minimapContainerStyle,
        transform: `translate(${offset.x}px, ${offset.y}px)`,
      }}
    >
      {/* HEADER TÁTICO (ARRASTÁVEL) */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          ...headerStyle,
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
      >
        <span style={titleStyle}>Tactical Radar</span>
        <span style={{ fontSize: '8px', color: mapReady ? '#10b981' : '#f59e0b' }}>
          {mapReady ? '● ONLINE' : '○ SYNCING'}
        </span>
      </div>

      {/* ÁREA DO MAPA (VIEWPORT DA CÂMERA) */}
      <div style={mapViewStyle}>
        {!mapReady ? (
          <div style={loadingOverlayStyle}>
            <span style={{ fontSize: '9px', color: '#f59e0b' }}>Aguardando Mapa...</span>
          </div>
        ) : (
          <>
            {/* Overlay com as coordenadas do Player e Modo da Câmera */}
            <div style={coordsOverlayStyle}>
              <div>Player: {playerPosition.x}, {playerPosition.y}, {playerPosition.z}</div>
              <div style={{ color: isLockedToPlayer ? '#10b981' : '#f59e0b', marginTop: '2px' }}>
                {isLockedToPlayer ? '🔒 Fixed to Player' : '🔓 Free Cam'}
              </div>
            </div>

            {/* Marcador do Player (Exibido apenas se estiver no mesmo andar Z da Câmera) */}
            {playerPosition.z === cameraPosition.z && (
              <div
                style={{
                  ...playerIndicatorStyle,
                  // Calcula o offset visual em pixels do player relativo ao centro da câmera
                  transform: `translate(${(playerPosition.x - cameraPosition.x) * 4}px, ${(playerPosition.y - cameraPosition.y) * 4}px)`,
                  transition: 'all 0.2s ease-out',
                }}
                title={`Player Position: ${playerPosition.x}, ${playerPosition.y}, ${playerPosition.z}`}
              />
            )}

            <div style={watermarkStyle}>GRID_SYS_ACTIVE</div>
          </>
        )}
      </div>

      {/* 🎮 PAINEL DE BOTÕES DE NAVEGAÇÃO DA CÂMERA */}
      <div style={controlsContainerStyle}>
        {/* D-PAD DIRECIONAL */}
        <div style={dpadGridStyle}>
          <div></div>
          <button style={navBtnStyle} onClick={() => moveCamera(0, -10)} title="Mover Câmera Norte">▲</button>
          <div></div>

          <button style={navBtnStyle} onClick={() => moveCamera(-10, 0)} title="Mover Câmera Oeste">◄</button>
          <button
            style={{
              ...centerBtnStyle,
              borderColor: isLockedToPlayer ? '#10b981' : '#f59e0b',
            }}
            onClick={centerOnPlayer}
            title="Recentralizar no Player"
          >
            🎯
          </button>
          <button style={navBtnStyle} onClick={() => moveCamera(10, 0)} title="Mover Câmera Leste">►</button>

          <div></div>
          <button style={navBtnStyle} onClick={() => moveCamera(0, 10)} title="Mover Câmera Sul">▼</button>
          <div></div>
        </div>

        {/* BOTÕES DE NÍVEL / ANDAR (PISO Z) */}
        <div style={floorControlsStyle}>
          <button style={floorBtnStyle} onClick={() => changeFloor(-1)} title="Andar de Cima">
            Floor ▲
          </button>
          <button style={floorBtnStyle} onClick={() => changeFloor(1)} title="Andar de Baixo">
            Floor ▼
          </button>
        </div>
      </div>

      {/* FOOTER EXIBINDO AS COORDENADAS DA CÂMERA / FOCO DO MINIMAP */}
      <div style={footerStyle}>
        {(['x', 'y', 'z'] as const).map((axis) => (
          <div key={axis} style={coordBoxStyle}>
            {axis.toUpperCase()}:{' '}
            <span style={coordValueStyle}>
              {mapReady ? cameraPosition[axis] : '---'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// 🎨 ESTILOS PERMANECEM OS MESMOS
const minimapContainerStyle: React.CSSProperties = {
  position: 'absolute',
  width: '180px',
  backgroundColor: '#0c0c0e',
  border: '1px solid #3c3d42',
  boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.85)',
  fontFamily: '"Courier New", Courier, monospace',
  zIndex: 1000,
  display: 'flex',
  flexDirection: 'column',
  borderRadius: '4px',
  overflow: 'hidden',
  userSelect: 'none',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  backgroundColor: '#070708',
  borderBottom: '1px solid #232428',
  padding: '6px 10px',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const titleStyle: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 'bold',
  color: '#f59e0b',
  textTransform: 'uppercase',
  letterSpacing: '1px',
};

const mapViewStyle: React.CSSProperties = {
  height: '130px',
  backgroundColor: '#070708',
  borderBottom: '1px solid #232428',
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundImage: 'radial-gradient(#1c1d22 1px, transparent 1px)',
  backgroundSize: '10px 10px',
  overflow: 'hidden',
};

const loadingOverlayStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  height: '100%',
  backgroundColor: '#07070880',
};

const coordsOverlayStyle: React.CSSProperties = {
  position: 'absolute',
  top: '4px',
  left: '6px',
  fontSize: '7.5px',
  backgroundColor: 'rgba(7, 7, 8, 0.85)',
  padding: '2px 4px',
  borderRadius: '2px',
  border: '1px solid #1e2025',
  zIndex: 10,
};

const playerIndicatorStyle: React.CSSProperties = {
  width: '8px',
  height: '8px',
  backgroundColor: '#f59e0b',
  borderRadius: '1px',
  boxShadow: '0px 0px 10px #f59e0b',
  position: 'absolute',
};

const watermarkStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: '4px',
  left: '6px',
  fontSize: '7px',
  color: '#232428',
  letterSpacing: '0.5px',
};

const controlsContainerStyle: React.CSSProperties = {
  padding: '6px',
  backgroundColor: '#090a0c',
  borderBottom: '1px solid #232428',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
};

const dpadGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '2px',
};

const navBtnStyle: React.CSSProperties = {
  backgroundColor: '#111215',
  border: '1px solid #232428',
  color: '#9ca3af',
  fontSize: '9px',
  padding: '3px 0',
  cursor: 'pointer',
  fontWeight: 'bold',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const centerBtnStyle: React.CSSProperties = {
  backgroundColor: '#18181b',
  border: '1px solid #f59e0b',
  color: '#ffffff',
  fontSize: '9px',
  padding: '3px 0',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const floorControlsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '4px',
};

const floorBtnStyle: React.CSSProperties = {
  flex: 1,
  backgroundColor: '#111215',
  border: '1px solid #232428',
  color: '#d1d5db',
  fontSize: '8px',
  padding: '4px 0',
  cursor: 'pointer',
  fontWeight: 'bold',
};

const footerStyle: React.CSSProperties = {
  display: 'flex',
  backgroundColor: '#111215',
  padding: '6px',
  justifyContent: 'space-between',
  gap: '4px',
};

const coordBoxStyle: React.CSSProperties = {
  flex: 1,
  backgroundColor: '#070708',
  border: '1px solid #232428',
  fontSize: '9px',
  padding: '4px 0',
  textAlign: 'center',
  color: '#4b5563',
  fontWeight: 'bold',
};

const coordValueStyle: React.CSSProperties = {
  color: '#e2e8f0',
};