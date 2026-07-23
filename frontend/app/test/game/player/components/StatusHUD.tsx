'use client';

import React, { useState, useEffect } from 'react';
import { NetworkManager } from '../../network/services/network-manager';
import { PlayerState } from '../models/player';

interface StatusHUDProps {
  network?: NetworkManager;
}

export function StatusHUD({ network }: StatusHUDProps) {
  const [isOpen, setIsOpen] = useState(true);

  // 🔴 ESTADO REATIVO COM FALLBACKS ADEQUADOS (INCLUINDO SKILLS)
  const [playerState, setPlayerState] = useState<PlayerState & { name?: string }>({
    name: 'Hero',
    health: 0,
    maxHealth: 1,
    mana: 0,
    maxMana: 1,
    speed: 200,
    level: 1,
    experience: 0,
    capacity: 400,
    vocation: 0,
    stamina: 2520,
    soul: 100,
    skull: 0,
    inProtectionZone: false,
    skills: {
      fist: { level: 10, percentage: 0 },
      club: { level: 10, percentage: 0 },
      sword: { level: 10, percentage: 0 },
      axe: { level: 10, percentage: 0 },
      distance: { level: 10, percentage: 0 },
      shielding: { level: 10, percentage: 0 },
      magic: { level: 0, percentage: 0 },
    },
  });

  // 🔌 ESCUTA O EVENTO 'player:stats' E SOLICITA ATUALIZAÇÃO INICIAL (PULL MODEL)
  useEffect(() => {
    if (!network) return;

    const handleStats = (data: Partial<PlayerState & { name?: string }>) => {
      if (!data) return;

      console.log('📡 [StatusHUD] Dados reativos recebidos:', data);

      setPlayerState((prev) => {
        // Preserva skills anteriores e combina com as novas enviadas
        const updatedSkills = data.skills
          ? { ...prev.skills, ...data.skills }
          : prev.skills;

        return {
          ...prev,
          ...data,
          // Garante que se 'name' vier indefinido na atualização parcial, o nome anterior é mantido
          name: data.name || prev.name,
          skills: updatedSkills,
        };
      });
    };

    // 1. Inscreve no canal central de estado do jogador
    const unsubscribeStats = network.subscribe('player:stats', handleStats);

    // 2. 🚀 SOLICITA OS DADOS ATUAIS IMEDIATAMENTE AO MONTAR
    // Resolve o atraso da tela de carregamento (Race Condition)
    network.emit('player:request_stats', true);

    return () => {
      unsubscribeStats();
    };
  }, [network]);

  // Cálculos de porcentagem de HP e MP blindados contra divisão por zero
  const hpPercent = Math.max(0, Math.min(100, (playerState.health / (playerState.maxHealth || 1)) * 100));
  const mpPercent = Math.max(0, Math.min(100, (playerState.mana / (playerState.maxMana || 1)) * 100));

  return (
    <>
      {/* 🟢 BOTÃO PARA REABRIR */}
      {!isOpen && (
        <button onClick={() => setIsOpen(true)} style={toggleButtonStyle}>
          ❤️ Status
        </button>
      )}

      {/* 📊 PAINEL DE STATUS PREMIUM */}
      {isOpen && (
        <div style={hudContainerStyle}>
          {/* HEADER COM NOME DO PERSONAGEM E LEVEL */}
          <div style={headerStyle}>
            <span style={titleStyle}>{playerState.name || 'Hero'}</span>
            <span style={levelBadgeStyle}>LVL {playerState.level || 1}</span>
            <button onClick={() => setIsOpen(false)} style={closeButtonStyle}>✕</button>
          </div>

          <div style={contentStyle}>
            {/* BARRA DE VIDA (HEALTH) */}
            <div style={barWrapperStyle}>
              <div style={labelRowStyle}>
                <span>HEALTH</span>
                <span style={{ color: '#ef4444' }}>{playerState.health} / {playerState.maxHealth}</span>
              </div>
              <div style={barBackgroundStyle}>
                <div style={{
                  ...barFillStyle,
                  width: `${hpPercent}%`,
                  backgroundColor: '#ef4444',
                  boxShadow: '0px 0px 8px rgba(239, 68, 68, 0.4)'
                }} />
              </div>
            </div>

            {/* BARRA DE MANA */}
            <div style={barWrapperStyle}>
              <div style={labelRowStyle}>
                <span>MANA</span>
                <span style={{ color: '#3b82f6' }}>{playerState.mana} / {playerState.maxMana}</span>
              </div>
              <div style={barBackgroundStyle}>
                <div style={{
                  ...barFillStyle,
                  width: `${mpPercent}%`,
                  backgroundColor: '#3b82f6',
                  boxShadow: '0px 0px 8px rgba(59, 130, 246, 0.4)'
                }} />
              </div>
            </div>

            {/* 🎒 METRICAS SECUNDÁRIAS (CAPACIDADE, VELOCIDADE E EXP) */}
            <div style={subStatsContainerStyle}>
              <div style={subStatItemStyle}>
                <span style={subStatLabelStyle}>CAP</span>
                <span style={subStatValueStyle}>{playerState.capacity ?? 0} oz</span>
              </div>
              <div style={subStatItemStyle}>
                <span style={subStatLabelStyle}>SPEED</span>
                <span style={subStatValueStyle}>{playerState.speed ?? 200}</span>
              </div>
              <div style={subStatItemStyle}>
                <span style={subStatLabelStyle}>EXP</span>
                <span style={subStatValueStyle}>{playerState.experience?.toLocaleString() || 0}</span>
              </div>
            </div>

            {/* ⚔️ SEÇÃO DE SKILLS DO JOGADOR */}
            {playerState.skills && (
              <div style={skillsContainerStyle}>
                <div style={skillsHeaderStyle}>
                  <span>CHARACTER SKILLS</span>
                </div>

                <div style={skillsGridStyle}>
                  {Object.entries(playerState.skills).map(([skillName, skillData]) => {
                    if (!skillData) return null;

                    const percent = Math.max(0, Math.min(100, skillData.percentage || 0));

                    return (
                      <div key={skillName} style={skillRowStyle}>
                        <div style={skillInfoStyle}>
                          <span style={skillNameStyle}>{skillName.toUpperCase()}</span>
                          <span style={skillLevelStyle}>Lvl {skillData.level || 10}</span>
                        </div>

                        {/* Barra de progresso do próximo level */}
                        <div style={skillBarBgStyle}>
                          <div style={{
                            ...barFillStyle,
                            width: `${percent}%`,
                            backgroundColor: '#f59e0b',
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}

// 🎨 ESTILOS CSS REFINADOS
const hudContainerStyle: React.CSSProperties = {
  position: 'absolute',
  top: '16px',
  left: '16px',
  width: '280px',
  backgroundColor: '#0c0c0e',
  border: '1px solid #3c3d42',
  boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.85)',
  fontFamily: '"Courier New", Courier, monospace',
  zIndex: 1000,
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  backgroundColor: '#070708',
  borderBottom: '1px solid #232428',
  padding: '6px 12px',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const titleStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 'bold',
  color: '#f59e0b',
  textTransform: 'uppercase',
  letterSpacing: '1px',
};

const levelBadgeStyle: React.CSSProperties = {
  fontSize: '10px',
  backgroundColor: '#1e1b4b',
  color: '#818cf8',
  padding: '2px 6px',
  border: '1px solid #312e81',
  fontWeight: 'bold',
};

const contentStyle: React.CSSProperties = {
  padding: '14px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  backgroundColor: '#111215',
};

const barWrapperStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const labelRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '9px',
  fontWeight: 'bold',
  color: '#94a3b8',
  letterSpacing: '0.5px',
};

const barBackgroundStyle: React.CSSProperties = {
  height: '12px',
  backgroundColor: '#070708',
  border: '1px solid #232428',
  position: 'relative',
  overflow: 'hidden',
};

const barFillStyle: React.CSSProperties = {
  height: '100%',
  transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
};

const subStatsContainerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  backgroundColor: '#090a0c',
  border: '1px solid #1e2025',
  padding: '6px 10px',
  borderRadius: '2px',
};

const subStatItemStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '2px',
};

const subStatLabelStyle: React.CSSProperties = {
  fontSize: '8px',
  fontWeight: 'bold',
  color: '#64748b',
};

const subStatValueStyle: React.CSSProperties = {
  fontSize: '9px',
  fontWeight: 'bold',
  color: '#e2e8f0',
};

const toggleButtonStyle: React.CSSProperties = {
  position: 'absolute',
  top: '16px',
  left: '16px',
  backgroundColor: '#0c0c0e',
  border: '1px solid #f59e0b',
  color: '#f59e0b',
  padding: '8px 14px',
  fontSize: '10px',
  fontWeight: 'bold',
  cursor: 'pointer',
  zIndex: 1000,
};

const closeButtonStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#6b7280',
  cursor: 'pointer',
  fontSize: '12px',
  marginLeft: '8px'
};

const skillsContainerStyle: React.CSSProperties = {
  marginTop: '2px',
  paddingTop: '10px',
  borderTop: '1px solid #232428',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const skillsHeaderStyle: React.CSSProperties = {
  fontSize: '9px',
  fontWeight: 'bold',
  color: '#f59e0b',
  letterSpacing: '0.8px',
};

const skillsGridStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
};

const skillRowStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
};

const skillInfoStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '8px',
};

const skillNameStyle: React.CSSProperties = {
  color: '#d1d5db',
  fontWeight: 'bold',
};

const skillLevelStyle: React.CSSProperties = {
  color: '#fbbf24',
};

const skillBarBgStyle: React.CSSProperties = {
  height: '4px',
  backgroundColor: '#070708',
  border: '1px solid #1e2025',
  overflow: 'hidden',
};