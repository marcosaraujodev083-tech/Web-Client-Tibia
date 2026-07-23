'use client';

interface QueueInfo {
  position: number;
  totalInQueue: number;
}

interface GameLoadingOverlayProps {
  progress: number;
  status: string;
  queueInfo: QueueInfo | null;
}

export function GameLoadingOverlay({ progress, status, queueInfo }: GameLoadingOverlayProps) {
  return (
    <div className="z-50 bg-neutral-950/90 backdrop-blur-md p-8 md:p-10 rounded-xl border border-amber-500/40 max-w-md w-full shadow-[0_0_50px_rgba(217,119,6,0.15)] relative overflow-hidden flex flex-col items-center">

      {/* 🛡️ DETALHES ORNAMENTAIS MEDIEVAIS (CANTOS DOURADOS DE MOLDURA) */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-amber-400" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-amber-400" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-amber-400" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-amber-400" />

      {/* 🌟 BRILHO DE BACKGROUND (Luz mística de fundo) */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {queueInfo ? (
        /* ────────────── VISUAL 1: FILA DE ESPERA MEDIEVAL ────────────── */
        <div className="space-y-4 w-full text-center relative z-10">

          {/* Anel de Runa Giratório */}
          <div className="relative w-14 h-14 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 border-2 border-amber-500/20 border-t-amber-400 rounded-full animate-spin" />
            <span className="text-amber-400 text-xl select-none">ᚱ</span>
          </div>

          <div>
            <h2 className="text-xs font-bold text-amber-500/90 uppercase tracking-[0.3em] font-serif">
              Fila do Reino
            </h2>
            <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent mx-auto my-2" />
          </div>

          <div className="py-2">
            <p className="text-4xl font-black text-amber-100 font-serif tracking-wider drop-shadow-[0_2px_10px_rgba(245,158,11,0.3)]">
              #{queueInfo.position}
            </p>
            <p className="text-[10px] text-amber-500/70 uppercase tracking-widest mt-1 font-mono">
              Aguardando Portões ({queueInfo.totalInQueue} na fila)
            </p>
          </div>

          <p className="text-xs text-stone-400/90 leading-relaxed font-sans max-w-xs mx-auto">
            Os guardas estão regulando a entrada para manter a estabilidade no mundo.
          </p>
        </div>
      ) : (
        /* ────────────── VISUAL 2: BARRA DE PROGRESSO DOURADA ────────────── */
        <div className="w-full space-y-6 relative z-10">

          {/* Cabeçalho de Status */}
          <div className="text-center space-y-1.5">
            <div className="flex items-center justify-center gap-2">
              <span className="h-[1px] w-6 bg-gradient-to-r from-transparent to-amber-500/60" />
              <p className="text-[10px] text-amber-400/90 tracking-[0.3em] uppercase font-bold font-serif">
                Invocando Mundo
              </p>
              <span className="h-[1px] w-6 bg-gradient-to-l from-transparent to-amber-500/60" />
            </div>

            <p className="text-xs text-stone-300 font-medium tracking-wide h-5 truncate font-mono">
              {status}
            </p>
          </div>

          {/* Container da Barra de Progresso com Moldura Dourada Reluzente */}
          <div className="space-y-2">
            <div className="relative p-0.5 rounded-sm bg-neutral-900 border border-amber-600/40 shadow-[inner_0_2px_4px_rgba(0,0,0,0.8)]">

              {/* Moldura de Ouro Fina */}
              <div className="h-2.5 w-full bg-neutral-950/90 rounded-none overflow-hidden relative">

                {/* Preenchimento de Energia Dourada / Reluzente */}
                <div
                  className="h-full bg-gradient-to-r from-amber-700 via-amber-500 to-amber-300 transition-all duration-500 ease-out relative shadow-[0_0_15px_rgba(245,158,11,0.8)]"
                  style={{ width: `${progress}%` }}
                >
                  {/* Efeito de Reflexo Reluzente Passando pela Barra */}
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)] animate-pulse" />
                </div>

              </div>
            </div>

            {/* Porcentagem e Rodapé */}
            <div className="flex justify-between items-center text-[10px] font-mono">
              <span className="text-stone-500 uppercase tracking-widest">Ativos Carregados</span>
              <span className="text-amber-400 font-bold tracking-wider drop-shadow-[0_0_6px_rgba(245,158,11,0.5)]">
                {progress}%
              </span>
            </div>
          </div>

          {/* Rodapé Decorativo */}
          <div className="pt-2 text-center">
            <p className="text-[9px] text-amber-500/50 uppercase tracking-[0.25em] font-serif">
              ✦ Tibia HTML5 Engine ✦
            </p>
          </div>

        </div>
      )}

    </div>
  );
}