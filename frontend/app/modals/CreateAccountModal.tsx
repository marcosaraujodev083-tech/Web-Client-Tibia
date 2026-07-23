'use client';

interface Props {
  onClose: () => void;
  onIntercept: (actionType: 'create-account-close', element: HTMLButtonElement) => Promise<boolean>;
}

export default function CreateAccountModal({ onClose, onIntercept }: Props) {
  return (
    <div id="floater-create" className="modal hidden fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-neutral-800 rounded-md p-6 w-80 text-left shadow-2xl space-y-3">
        <div className="text-xs font-bold tracking-widest text-amber-500 uppercase border-b border-neutral-800 pb-2">
          Create Account
        </div>

        <input
          className="password-input w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm rounded focus:outline-none text-stone-200"
          id="create-username"
          type="password"
          placeholder="Account Number"
        />

        <input
          className="password-input w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm rounded focus:outline-none text-stone-200"
          id="create-password"
          type="password"
          placeholder="Account Password"
        />

        <input
          className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm rounded focus:outline-none text-stone-200"
          id="create-name"
          placeholder="Character Name"
        />

        <select
          className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm rounded focus:outline-none text-stone-300"
          id="create-sex"
        >
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 text-xs font-bold tracking-wider uppercase bg-neutral-800 hover:bg-neutral-700 rounded transition text-stone-400"
          >
            Cancel
          </button>

          <button
            id="create-account-close"
            onClick={async (e) => {
              const target = e.currentTarget;

              // Se o bypass já foi ativo, deixa o fluxo nativo seguir
              if (target.getAttribute('data-bypass') === 'true') return;

              // Previne comportamentos padrão indesejados no clique
              e.preventDefault();

              console.log("[Modal] Disparando criação de conta e acionando a ponte...");
              await onIntercept('create-account-close', target);
            }}
            className="flex-1 py-2 text-xs font-bold tracking-wider uppercase bg-amber-600 hover:bg-amber-500 text-neutral-950 rounded transition"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}