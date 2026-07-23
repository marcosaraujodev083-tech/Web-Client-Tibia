'use client';

interface Props {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: Props) {
  return (
    <div id="settings-box" className="modal hidden fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-neutral-800 rounded-md p-6 w-80 text-left shadow-2xl space-y-4">
        <div className="text-xs font-bold tracking-widest text-amber-500 uppercase border-b border-neutral-800 pb-2">
          Connection Settings
        </div>
        <div>
          <label className="text-[10px] text-stone-500 tracking-wider uppercase block mb-1">
            Login Server Address
          </label>
          <input
            style={{ textAlign: 'center' }}
            id="host"
            className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm rounded focus:outline-none text-stone-200"
            placeholder="127.0.0.1:1337"
            defaultValue="127.0.0.1:1337"
          />
        </div>
        <button id="clear-database" className="w-full py-1.5 text-xs border border-rose-900/50 bg-rose-950/20 text-rose-400 hover:bg-rose-950/50 rounded transition">
          Reset Client Database
        </button>
        <button type="button" onClick={onClose} className="w-full py-2 text-xs font-bold tracking-wider uppercase bg-neutral-800 hover:bg-neutral-700 rounded transition text-stone-300">
          Close
        </button>
      </div>
    </div>
  );
}