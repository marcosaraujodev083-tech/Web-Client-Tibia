// app/test/components/game-migration/DebugControls.tsx
'use client';

import React, { useState } from 'react';

interface DebugControlsProps {
  network: {
    send: (data: ArrayBuffer | Uint8Array | string) => void;
  };
  addLog: (message: string) => void;
}

export function DebugControls({ network, addLog }: DebugControlsProps) {
  const [isOpen, setIsOpen] = useState(true);

  // Opcodes clássicos de movimento
  const move = (direction: string, opcode: number) => {
    addLog(`🕹️ Enviando comando: Andar para o ${direction} (0x${opcode.toString(16).toUpperCase()})`);
    network.send(new Uint8Array([opcode]));
  };

  return (
    <>
      {!isOpen && (
        <button onClick={() => setIsOpen(true)} style={toggleButtonStyle}>
          🛠️ Dev Tools
        </button>
      )}

      {isOpen && (
        <div style={containerStyle}>
          <div style={headerStyle}>
            <span style={titleStyle}>D-Pad Diagnostic</span>
            <button onClick={() => setIsOpen(false)} style={closeButtonStyle}>✕</button>
          </div>

          <div style={panelBodyStyle}>
            <p style={descStyle}>Clique nas setas abaixo para forçar o envio de pacotes de movimento ao servidor:</p>

            <div style={gridStyle}>
              <div></div>
              <button onClick={() => move('Norte', 0x65)} style={btnStyle}>▲</button>
              <div></div>

              <button onClick={() => move('Oeste', 0x68)} style={btnStyle}>◀</button>
              <div style={centerDotStyle}>●</div>
              <button onClick={() => move('Leste', 0x66)} style={btnStyle}>▶</button>

              <div></div>
              <button onClick={() => move('Sul', 0x67)} style={btnStyle}>▼</button>
              <div></div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// 🎨 Estilos do Modal Premium (Preto e Dourado tático)
const containerStyle: React.CSSProperties = {
  position: 'absolute', bottom: '16px', left: '16px', width: '190px',
  backgroundColor: '#0c0c0e', border: '1px solid #232428',
  boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.85)',
  fontFamily: '"Courier New", Courier, monospace', zIndex: 1100,
};

const headerStyle: React.CSSProperties = {
  display: 'flex', backgroundColor: '#070708', borderBottom: '1px solid #232428',
  padding: '6px 10px', alignItems: 'center', justifyContent: 'space-between'
};

const titleStyle: React.CSSProperties = { fontSize: '10px', fontWeight: 'bold', color: '#f59e0b', textTransform: 'uppercase' };
const closeButtonStyle: React.CSSProperties = { background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '11px' };
const panelBodyStyle: React.CSSProperties = { padding: '10px', display: 'flex', flexDirection: 'column', gap: '10px' };
const descStyle: React.CSSProperties = { fontSize: '8px', color: '#4b5563', margin: 0, lineHeight: '1.2' };

const gridStyle: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', width: '120px', margin: '0 auto'
};

const btnStyle: React.CSSProperties = {
  backgroundColor: '#111215', border: '1px solid #3c3d42', color: '#f59e0b',
  fontWeight: 'bold', cursor: 'pointer', height: '36px', display: 'flex',
  alignItems: 'center', justifyCenter: 'center', fontSize: '14px', borderRadius: '2px'
};

const centerDotStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#232428', fontSize: '10px' };
const toggleButtonStyle: React.CSSProperties = { position: 'absolute', bottom: '16px', left: '16px', backgroundColor: '#0c0c0e', border: '1px solid #3c3d42', color: '#6b7280', padding: '6px 10px', fontSize: '9px', fontWeight: 'bold', cursor: 'pointer', zIndex: 1100, fontFamily: 'monospace' };