'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PacketReader } from '../network/protocol/packet-reader';
import { PacketDiagnosticData } from '../network/services/network-manager';

interface NetworkManagerProps {
  send?: (data: ArrayBuffer | Uint8Array | string) => void;
  rawSocket?: WebSocket | null;
  subscribe?: <T = any>(event: number | string, callback: (data: T) => void) => () => void;
  onPacketReceived?: ((opcode: number, reader: PacketReader) => void) | null;
}

interface DebugControlsProps {
  network: NetworkManagerProps;
}

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'unhandled' | 'parsed' | 'sent';
  message: string;
  diagnostic?: PacketDiagnosticData;
}

export function DebugControls({ network }: DebugControlsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'unhandled' | 'parsed' | 'sent'>('parsed');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Guardamos o método de envio original em um Ref para nunca perder a referência nativa
  const originalSendRef = useRef<Function | null>(null);

  // Helper para adicionar entradas estruturadas aos logs
  const addLog = useCallback((type: 'unhandled' | 'parsed' | 'sent', message: string, diagnostic?: PacketDiagnosticData) => {
    const entry: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
      diagnostic,
    };

    setLogs((prev) => [...prev.slice(-199), entry]); // Mantém os últimos 200 logs
  }, []);

  // Helper para limpar os logs
  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  // Interceptação de INBOUND, OUTBOUND e DIAGNÓSTICOS
  useEffect(() => {
    if (!network) return;

    addLog('parsed', '🔌 Inspector tático acoplado ao NetworkManager.');

    // 1. ESCUTA DE DIAGNÓSTICO DE PACOTES TRATADOS E REGISTRO DE BYTES
    let unsubDiagnostic: (() => void) | null = null;
    if (typeof network.subscribe === 'function') {
      unsubDiagnostic = network.subscribe('debug:packet_diagnostic', (diag: PacketDiagnosticData) => {
        const hexOpCode = `0x${diag.opcode.toString(16).padStart(2, '0').toUpperCase()}`;
        const statusIcon = diag.isFullyParsed ? '🟢' : '⚠️';
        const msg = `${statusIcon} [${hexOpCode}] ${diag.name} — ${diag.bytesRead}/${diag.totalBytes}b (${diag.byteCoveragePercent}%)`;

        addLog(diag.isFullyParsed ? 'parsed' : 'unhandled', msg, diag);
      });
    }

    // 2. ESCUTA DE PACOTES RECEBIDOS NÃO TRATADOS
    network.onPacketReceived = (opcode: number, reader: any) => {
      try {
        const hexOpCode = `0x${opcode.toString(16).padStart(2, '0').toUpperCase()}`;

        let buffer: Uint8Array;
        if (reader.buffer instanceof Uint8Array) {
          buffer = reader.buffer;
        } else if (typeof reader.getBuffer === 'function') {
          buffer = reader.getBuffer();
        } else {
          buffer = new Uint8Array(0);
        }

        const hexBytes = Array.from(buffer.slice(0, 10))
          .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
          .join(' ');

        addLog(
          'unhandled',
          `📥 UNHANDLED [OpCode: ${hexOpCode}] (${buffer.length}b) -> [${hexBytes}${buffer.length > 10 ? '...' : ''}]`
        );
      } catch (err) {
        addLog('unhandled', `❌ Erro no logger de entrada: ${err}`);
      }
    };

    // 3. ESCUTA DE PACOTES ENVIADOS (OUTBOUND) SEGURO
    const socket = network.rawSocket;
    if (socket && !(socket as any).__isPatched) {
      // Guarda a referência nativa original
      const nativeSend = socket.send.bind(socket);
      originalSendRef.current = nativeSend;

      socket.send = (data: string | ArrayBufferLike | Blob | ArrayBufferView) => {
        try {
          if (typeof data === 'string') {
            addLog('sent', `📤 TEXT: ${data}`);
          } else {
            let buffer: Uint8Array;
            if (data instanceof ArrayBuffer) {
              buffer = new Uint8Array(data);
            } else if (ArrayBuffer.isView(data)) {
              buffer = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
            } else {
              buffer = new Uint8Array(0);
            }

            if (buffer.length > 0) {
              const rawOpCode = buffer[0];
              const hexOpCode = `0x${rawOpCode.toString(16).padStart(2, '0').toUpperCase()}`;
              const hexBytes = Array.from(buffer.slice(0, 10))
                .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
                .join(' ');

              addLog(
                'sent',
                `📤 OUTBOUND [OpCode: ${hexOpCode}] (${buffer.length}b) -> [${hexBytes}${buffer.length > 10 ? '...' : ''}]`
              );
            }
          }
        } catch (e) {
          // Ignorado com segurança
        }

        // Executa estritamente a função nativa original
        return nativeSend(data);
      };

      // Marca o socket para evitar que seja interceptado mais de uma vez
      (socket as any).__isPatched = true;
    }

    // Cleanup: Remove os listeners e restaura o socket original ao desmontar
    return () => {
      if (unsubDiagnostic) unsubDiagnostic();
      if (network) {
        network.onPacketReceived = null;
        if (network.rawSocket && (network.rawSocket as any).__isPatched && originalSendRef.current) {
          network.rawSocket.send = originalSendRef.current as any;
          delete (network.rawSocket as any).__isPatched;
        }
      }
    };
  }, [network, addLog]);

  // Filtros por Aba
  const unhandledLogs = logs.filter((l) => l.type === 'unhandled');
  const parsedLogs = logs.filter((l) => l.type === 'parsed');
  const sentLogs = logs.filter((l) => l.type === 'sent');

  const currentLogs =
    activeTab === 'unhandled'
      ? unhandledLogs
      : activeTab === 'parsed'
      ? parsedLogs
      : sentLogs;

  // Auto-scroll
  useEffect(() => {
    if (isOpen) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, activeTab, isOpen]);

  return (
    <>
      {/* Botão para abrir no Canto Superior Direito */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute top-4 right-4 z-50 bg-neutral-900/90 hover:bg-neutral-800 border border-amber-500/40 text-amber-500 font-mono text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg backdrop-blur-sm transition-all flex items-center gap-2 cursor-pointer"
      >
        <span>🛠️</span> DevTools
        {logs.length > 0 && (
          <span className="bg-amber-500/20 text-amber-400 text-[10px] px-1.5 py-0.5 rounded border border-amber-500/30">
            {logs.length}
          </span>
        )}
      </button>

      {/* Pop-up Flutuante de DevTools */}
      {isOpen && (
        <div className="absolute top-14 right-4 z-50 w-96 h-[480px] bg-neutral-950/95 border border-neutral-800 rounded-xl shadow-2xl backdrop-blur-md flex flex-col overflow-hidden font-mono text-xs">

          {/* Header */}
          <div className="bg-neutral-900 border-b border-neutral-800 px-4 py-2.5 flex items-center justify-between shrink-0">
            <span className="text-amber-500 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <span className="text-emerald-500">●</span> Protocol Inspector
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={clearLogs}
                title="Limpar Logs"
                className="text-neutral-500 hover:text-amber-400 text-xs px-1 cursor-pointer"
              >
                🗑️
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-neutral-500 hover:text-neutral-200 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>

          {/* ESTEIRA DE 3 ABAS */}
          <div className="flex border-b border-neutral-800 bg-neutral-900/50 shrink-0">
            <button
              onClick={() => setActiveTab('unhandled')}
              className={`flex-1 py-2 text-[10px] font-bold text-center border-b-2 transition-colors cursor-pointer ${
                activeTab === 'unhandled'
                  ? 'border-rose-500 text-rose-400 bg-neutral-900/80'
                  : 'border-transparent text-neutral-500 hover:text-neutral-300'
              }`}
            >
              ⚠️ Pendentes ({unhandledLogs.length})
            </button>

            <button
              onClick={() => setActiveTab('parsed')}
              className={`flex-1 py-2 text-[10px] font-bold text-center border-b-2 transition-colors cursor-pointer ${
                activeTab === 'parsed'
                  ? 'border-emerald-500 text-emerald-400 bg-neutral-900/80'
                  : 'border-transparent text-neutral-500 hover:text-neutral-300'
              }`}
            >
              ✅ Tratados ({parsedLogs.length})
            </button>

            <button
              onClick={() => setActiveTab('sent')}
              className={`flex-1 py-2 text-[10px] font-bold text-center border-b-2 transition-colors cursor-pointer ${
                activeTab === 'sent'
                  ? 'border-cyan-500 text-cyan-400 bg-neutral-900/80'
                  : 'border-transparent text-neutral-500 hover:text-neutral-300'
              }`}
            >
              📤 Enviados ({sentLogs.length})
            </button>
          </div>

          {/* Lista de Logs */}
          <div className="p-3 flex-1 flex flex-col min-h-0 bg-black/60 overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-[10px] select-text scrollbar-thin">
              {currentLogs.length === 0 ? (
                <p className="text-neutral-600 italic text-center pt-12">
                  {activeTab === 'unhandled'
                    ? 'Nenhum pacote com bytes pendentes...'
                    : activeTab === 'parsed'
                    ? 'Aguardando pacotes tratados...'
                    : 'Nenhum pacote enviado...'}
                </p>
              ) : (
                currentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-1.5 rounded bg-neutral-900/60 border border-neutral-800/80 flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between text-[9px] text-neutral-500">
                      <span>[{log.timestamp}]</span>
                      {log.diagnostic && (
                        <span className="text-amber-500 font-semibold">
                          Dev: {log.diagnostic.manualProgress}% | Bytes: {log.diagnostic.byteCoveragePercent}%
                        </span>
                      )}
                    </div>

                    <div
                      className={
                        log.type === 'sent'
                          ? 'text-cyan-400/90'
                          : log.type === 'unhandled'
                          ? 'text-rose-400/90'
                          : 'text-emerald-400/90'
                      }
                    >
                      {log.message}
                    </div>

                    {/* Detalhe visual de progresso quando houver dados de diagnóstico */}
                    {log.diagnostic && (
                      <div className="w-full bg-neutral-950 h-1 rounded-full overflow-hidden border border-neutral-800">
                        <div
                          className={`h-full ${
                            log.diagnostic.isFullyParsed
                              ? 'bg-emerald-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${log.diagnostic.byteCoveragePercent}%` }}
                        />
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          </div>

          {/* Footer Status */}
          <div className="bg-neutral-900/80 border-t border-neutral-800 px-3 py-1.5 text-[9px] text-neutral-500 flex justify-between shrink-0">
            <span>PACKET INSPECTOR V2</span>
            <span>TOTAL: {logs.length} EV</span>
          </div>
        </div>
      )}
    </>
  );
}