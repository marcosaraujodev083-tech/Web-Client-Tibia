'use client';

export default function ConnectingModal() {
  return (
    <div id="floater-connecting" className="modal hidden fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-neutral-800 rounded-md p-6 w-72 text-center shadow-2xl space-y-3 animate-pulse">
        <div className="text-xs font-bold tracking-widest text-amber-500 uppercase">Connecting</div>
        <div className="text-sm text-stone-300"><span id="serve-feedback">Connecting to server...</span></div>
      </div>
    </div>
  );
}