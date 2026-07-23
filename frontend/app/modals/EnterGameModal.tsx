'use client';

interface Props {
  onClose: () => void;
  onIntercept: (actionType: 'enter-game', element: HTMLButtonElement) => Promise<boolean>;
}

export default function EnterGameModal({ onClose, onIntercept }: Props) {
  return (
    <div id="floater-enter" className="modal hidden fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-neutral-800 rounded-md p-6 w-80 text-left shadow-2xl space-y-4">
        <div className="text-xs font-bold tracking-widest text-amber-500 uppercase border-b border-neutral-800 pb-2">
          Account Information
        </div>

        <form onSubmit={(e) => e.preventDefault()} className="space-y-3">
          <div>
            <label className="text-[10px] text-stone-500 tracking-wider uppercase block mb-1">
              Username
            </label>
            <input
              className="password-input w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm rounded focus:outline-none focus:border-amber-500/50 text-stone-200"
              name="username"
              id="user-username"
              type="text"
              placeholder="Account Name"
            />
          </div>
          <div>
            <label className="text-[10px] text-stone-500 tracking-wider uppercase block mb-1">
              Password
            </label>
            <input
              className="password-input w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm rounded focus:outline-none focus:border-amber-500/50 text-stone-200"
              name="password"
              id="user-password"
              type="password"
              placeholder="Account Password"
            />
          </div>
        </form>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 text-xs font-bold tracking-wider uppercase bg-neutral-800 hover:bg-neutral-700 rounded transition text-stone-400"
          >
            Cancel
          </button>

          <button
            id="enter-game"
            onClick={async (e) => {
              const target = e.currentTarget;

              // Se o bypass já foi ativado pela ponte, permite que o evento passe direto
              if (target.getAttribute('data-bypass') === 'true') {
                return;
              }

              // Evita qualquer recarregamento ou envio padrão do formulário HTML
              e.preventDefault();

              console.log("[Modal] Disparando interceptação da ponte React...");
              await onIntercept('enter-game', target);
            }}
            className="flex-1 py-2 text-xs font-bold tracking-wider uppercase bg-amber-600 hover:bg-amber-500 text-neutral-950 rounded transition"
          >
            Enter Game
          </button>
        </div>
      </div>
    </div>
  );
}