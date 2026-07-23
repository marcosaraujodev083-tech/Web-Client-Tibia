'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useChatNetwork } from '../../../game/chat/hooks/useChatNetwork';
import { NetworkManager } from '../../game/network/services/network-manager';

interface ChatProps {
  network: NetworkManager;
}

export function Chat({ network }: ChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [activeTab, setActiveTab] = useState<'Default' | 'Console'>('Default');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 🎯 1. Consome o Hook oficial de Rede para obter mensagens
  const { messages } = useChatNetwork({ network });

  // Auto-scroll ao receber novas mensagens
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // 🎯 2. Envio de mensagem limpo via NetworkManager
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !network) return;

    const text = inputValue.trim();

    // Dispara a ação de envio no NetworkManager (que montará o pacote CLIENT_OPCODES.CLIENT_MESSAGE)
    network.sendChatMessage(text, activeTab);

    setInputValue('');
  };

  return (
    <>
      {/* 🛑 1. BOTÃO FLUTUANTE */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'absolute',
            bottom: '16px',
            left: '16px',
            backgroundColor: '#0c0c0e',
            border: '1px solid #f59e0b',
            color: '#f59e0b',
            padding: '10px 16px',
            fontSize: '11px',
            fontWeight: 'bold',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            cursor: 'pointer',
            borderRadius: '0px',
            fontFamily: '"Courier New", Courier, monospace',
            boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.6)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '12px' }}>💬</span> Open Chat
        </button>
      )}

      {/* 🖼️ 2. A JANELA DO CHAT */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          width: '460px',
          height: '240px',
          backgroundColor: '#0c0c0e',
          border: '1px solid #3c3d42',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: '"Courier New", Courier, monospace',
          boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.85)',
          zIndex: 1000,
        }}>

          {/* HEADER - TABS + FECHAR */}
          <div style={{
            display: 'flex',
            backgroundColor: '#070708',
            borderBottom: '1px solid #232428',
            padding: '0 4px',
            height: '32px',
            alignItems: 'flex-end',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex' }}>
              <button
                onClick={() => setActiveTab('Default')}
                style={{
                  padding: '6px 14px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  backgroundColor: activeTab === 'Default' ? '#111215' : 'transparent',
                  color: activeTab === 'Default' ? '#f59e0b' : '#6b7280',
                  border: activeTab === 'Default' ? '1px solid #3c3d42' : '1px solid transparent',
                  marginBottom: '-1px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Local Chat
              </button>
              <button
                onClick={() => setActiveTab('Console')}
                style={{
                  padding: '6px 14px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  backgroundColor: activeTab === 'Console' ? '#111215' : 'transparent',
                  color: activeTab === 'Console' ? '#f59e0b' : '#6b7280',
                  border: activeTab === 'Console' ? '1px solid #3c3d42' : '1px solid transparent',
                  marginBottom: '-1px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Console
              </button>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#6b7280',
                fontSize: '14px',
                cursor: 'pointer',
                padding: '4px 10px',
              }}
            >
              ✕
            </button>
          </div>

          {/* HISTÓRICO DE MENSAGENS */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            backgroundColor: '#111215'
          }}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  fontSize: '13px',
                  lineHeight: '1.4',
                  wordBreak: 'break-word',
                  color: msg.type === 'system' ? '#eab308' : msg.type === 'private' ? '#ef4444' : '#4ade80'
                }}
              >
                <span style={{ color: '#52545c', marginRight: '6px' }}>&gt;</span>
                {msg.sender ? `[${msg.sender}]: ` : ''}{msg.message}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* INPUT FORMS */}
          <form
            onSubmit={handleSendMessage}
            style={{
              display: 'flex',
              backgroundColor: '#070708',
              borderTop: '1px solid #232428',
              padding: '6px'
            }}
          >
            <span style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 8px 0 4px',
              color: '#f59e0b',
              fontSize: '12px',
              fontWeight: 'bold',
            }}>
              SAY:
            </span>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Pressione Enter para enviar..."
              style={{
                flex: 1,
                backgroundColor: '#0c0c0e',
                border: '1px solid #232428',
                color: '#ffffff',
                padding: '6px 10px',
                fontSize: '12px',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
          </form>
        </div>
      )}
    </>
  );
}