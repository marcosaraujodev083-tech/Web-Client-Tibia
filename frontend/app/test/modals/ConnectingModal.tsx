'use client';

interface Props {
  isOpen: boolean;
  message?: string;
}

export default function ConnectingModal({ isOpen, message = "Connecting to server..." }: Props) {
  // Se não estiver aberto, o React simplesmente não renderiza nada (substitui o 'hidden')
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto select-none">
      <div className="bg-neutral-900 border border-neutral-800 rounded-md p-6 w-72 text-center shadow-2xl space-y-3 animate-pulse">
        <div className="text-xs font-bold tracking-widest text-amber-500 uppercase">
          Connecting
        </div>
        <div className="text-sm text-stone-300">
          {message}
        </div>
      </div>
    </div>
  );
}