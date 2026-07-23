'use client';

import { useEffect, useState } from 'react';
import EnterGameModal from './modals/EnterGameModal';
import CreateAccountModal from './modals/CreateAccountModal';
import ConnectingModal from './modals/ConnectingModal';
import CharacterSelectionModal from './modals/CharacterSelectionModal';

export default function Home() {
  const [status, setStatus] = useState('Preparando interface...');
  const [gameStarted, setGameStarted] = useState(false);

  // ⚡ PONTE DE ANTECIPAÇÃO DE LOGIN E CADASTRO
  const interceptEngineAction = async (actionType: 'enter-game' | 'create-account-close', buttonElement: HTMLButtonElement) => {
    console.log(`[Ponte] Interceptando ação para: ${actionType}`);

    if (buttonElement.getAttribute('data-bypass') === 'true') {
      return true;
    }

    try {
      const DEFAULT_HOST = '127.0.0.1:1337';
      const baseUrl = `http://${DEFAULT_HOST}`;

      if (actionType === 'enter-game') {
        const usernameInput = document.getElementById('user-username') as HTMLInputElement;
        const passwordInput = document.getElementById('user-password') as HTMLInputElement;

        const userVal = usernameInput?.value || '';
        const passVal = passwordInput?.value || '';

        const queryUrl = `${baseUrl}/?account=${encodeURIComponent(userVal)}&password=${encodeURIComponent(passVal)}`;
        console.log(`[Ponte Base] Solicitando Token de Login para: ${queryUrl}`);

        const resLogin = await fetch(queryUrl, { method: 'GET', mode: 'cors' });

        if (resLogin.status === 200) {
          const serverData = await resLogin.json();
          console.log("[Ponte Base] Dados originais do servidor:", serverData);

          let ipPuro = "127.0.0.1";
          let portaPura = 1337;

          if (serverData.host) {
            const hostLimpo = serverData.host.replace('ws://', '').replace('wss://', '');
            const partes = hostLimpo.split(':');
            ipPuro = partes[0];
            if (partes[1]) {
              portaPura = parseInt(partes[1], 10);
            }
          }

          const respostaMascarada = {
            ...serverData,
            ip: ipPuro,
            port: portaPura,
            world: {
              ip: ipPuro,
              port: portaPura
            }
          };

          const targetWindow = window as any;
          if (targetWindow.gameClient) {
            targetWindow.gameClient.loginData = respostaMascarada;
          } else if (targetWindow.GameClient) {
            targetWindow.GameClient.loginData = respostaMascarada;
          }

          console.log("[Ponte Base] 🎭 Resposta traduzida injetada globalmente:", respostaMascarada);
          setStatus('Autenticado! Carregando...');

          buttonElement.setAttribute('action', 'confirm');
          buttonElement.setAttribute('data-action', 'confirm');
          buttonElement.setAttribute('data-bypass', 'true');

          const charListModal = document.getElementById('floater-charlist');
          if (charListModal) {
            charListModal.style.display = 'flex';
            charListModal.classList.remove('hidden');
          }

          const buttonRect = buttonElement.getBoundingClientRect();
          const simulatedEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: buttonRect.left + (buttonRect.width / 2),
            clientY: buttonRect.top + (buttonRect.height / 2)
          });
          buttonElement.dispatchEvent(simulatedEvent);

          setTimeout(() => {
            buttonElement.removeAttribute('data-bypass');
            const floaterConnecting = document.getElementById('floater-connecting');
            if (floaterConnecting) floaterConnecting.style.display = 'none';
          }, 100);

          return true;
        } else {
          alert("Conta ou senha incorretas no banco de dados.");
          const floater = document.getElementById('floater-connecting');
          if (floater) floater.style.display = 'none';
          return false;
        }

      } else if (actionType === 'create-account-close') {
        const createUsernameInput = document.getElementById('create-username') as HTMLInputElement;
        const createPasswordInput = document.getElementById('create-password') as HTMLInputElement;
        const createNameInput = document.getElementById('create-name') as HTMLInputElement;
        const createSexInput = document.getElementById('create-sex') as HTMLSelectElement;

        const accVal = createUsernameInput?.value || '';
        const passVal = createPasswordInput?.value || '';
        const charName = (createNameInput?.value || '').toLowerCase().trim().replace(/\s+/g, '');
        const sexVal = createSexInput?.value || 'male';

        if (!accVal || !passVal || !charName) {
          alert("Por favor, preencha todos os campos do formulário antes de criar a conta.");
          return false;
        }

        const createUrl = `${baseUrl}/?account=${encodeURIComponent(accVal)}&password=${encodeURIComponent(passVal)}&name=${encodeURIComponent(charName)}&sex=${encodeURIComponent(sexVal)}`;

        const resCreate = await fetch(createUrl, { method: 'POST', mode: 'cors' });

        if (resCreate.status === 201) {
          closeModal('floater-create');
          openModal('floater-enter');

          const loginUsernameInput = document.getElementById('user-username') as HTMLInputElement;
          const loginPasswordInput = document.getElementById('user-password') as HTMLInputElement;

          if (loginUsernameInput && loginPasswordInput) {
            loginUsernameInput.value = accVal;
            loginPasswordInput.value = passVal;
          }

          setTimeout(() => {
            const enterGameBtn = document.getElementById('enter-game') as HTMLButtonElement;
            if (enterGameBtn) {
              const enterBtnRect = enterGameBtn.getBoundingClientRect();
              const autoClickEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window,
                clientX: enterBtnRect.left + (enterBtnRect.width / 2),
                clientY: enterBtnRect.top + (enterBtnRect.height / 2)
              });
              enterGameBtn.dispatchEvent(autoClickEvent);
            }
          }, 50);

          return true;
        } else if (resCreate.status === 409) {
          alert("Esta conta já existe.");
          return false;
        } else {
          alert("O servidor recusou a criação da conta.");
          return false;
        }
      }
    } catch (error) {
      console.error("❌ [Ponte] Erro na interceptação:", error);
      return false;
    }
    return false;
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 📡 CAPTURA DE ESCOPO GLOBAL
      let tempGameClient: any = null;
      Object.defineProperty(window, 'gameClient', {
        get() { return tempGameClient; },
        set(val) {
          tempGameClient = val;
          console.log("[Ponte] 🌐 gameClient interceptado com sucesso e exposto globalmente!");
        },
        configurable: true
      });

      // 🚀 Carrega o PixiJS v8 instalado nativamente mantendo compatibilidade
      import('pixi.js').then((mPixi) => {
        const legacyBaseTexture = { from: (source: any) => mPixi.Texture.from(source) };
        const legacyTextureFromBuffer = (buffer: any, _w: number, _h: number) => {
          return mPixi.Texture.from(new Uint8Array(buffer));
        };
        (window as any).PIXI = {
          ...mPixi,
          BaseTexture: legacyBaseTexture,
          Texture: { ...mPixi.Texture, fromBuffer: legacyTextureFromBuffer }
        };
      });

      // 📜 SEQUENCIA COMPLETA DE INJEÇÃO (Organizada por Dependência Estrita)
      const scripts = [
        // 1. Utilitários Básicos, Cores e Dados Primal
        '/game/rgba.js',
        '/game/bitflag.js',
        '/game/enum.js',
        '/game/opcodes.js',
        '/game/position.js',
        '/game/proto.js',
        '/game/settings.js',
        '/game/state.js',
        '/game/debugger.js',
        '/game/eventemitter.js',
        '/game/binary-heap.js',
        '/game/heap-event.js',
        '/game/event-queue.js',

        // 2. Buffers de Leitura e Estruturas de Tibia.dat / Sprites
        '/game/object-buffer.js',
        '/game/spritebuffer.js',
        '/game/dataobject.js',
        '/game/packet.js',
        '/game/packetreader.js',
        '/game/packetwriter.js',

        // 3. Objetos Físicos Básicos do Jogo (Things & Game World)
        '/game/thing.js',
        '/game/item.js',
        '/game/outfit.js',
        '/game/creature.js',
        '/game/monster.js',
        '/game/player.js',
        '/game/tile.js',
        '/game/chunk.js',
        '/game/world.js',
        '/game/pathfinder.js',

        // 4. Mecânicas Visuais, Efeitos e Renderizadores de Tela
        '/game/canvas.js',
        '/game/light-canvas.js',
        '/game/outline-canvas.js',
        '/game/weather-canvas.js',
        '/game/renderer.js',
        '/game/animation.js',
        '/game/box-animation.js',
        '/game/distance-animation.js',
        '/game/casting-manager.js',
        '/game/sprite.js',

        // 5. Gerenciamento de Áudio
        '/game/soundbit.js',
        '/game/soundtrace.js',
        '/game/sound-manager.js',

        // 6. Componentes de UI Básicos (Screen Elements)
        '/game/screen-element.js',
        '/game/screen-element-character.js',
        '/game/screen-element-floating.js',
        '/game/screen-element-message.js',
        '/game/screen-element-manager.js',

        // 7. Modais Nativos e Janelas Flutuantes
        '/game/modal.js',
        '/game/modal-chat.js',
        '/game/modal-confirm.js',
        '/game/modal-create-account.js',
        '/game/modal-enter-name.js',
        '/game/modal-map.js',
        '/game/modal-move-item.js',
        '/game/modal-offer.js',
        '/game/modal-outfit.js',
        '/game/modal-readable.js',
        '/game/modal-spellbook.js',
        '/game/modal-text.js',
        '/game/modal-manager.js',

        // 8. Janelas Dinâmicas e UI da HUD do Jogo
        '/game/window.js',
        '/game/window-battle.js',
        '/game/window-friend.js',
        '/game/window-skill.js',
        '/game/window-manager.js',
        '/game/menu.js',
        '/game/menu-chat-body.js',
        '/game/menu-chat-header.js',
        '/game/menu-friend-list.js',
        '/game/menu-friend-window.js',
        '/game/menu-hotbar.js',
        '/game/menu-message.js',
        '/game/menu-screen.js',
        '/game/menu-manager.js',

        // 9. Comunicação, Chat e Controles Finais
        '/game/channel.js',
        '/game/local-channel.js',
        '/game/private-channel.js',
        '/game/channel-manager.js',
        '/game/clock.js',
        '/game/book.js',
        '/game/condition.js',
        '/game/container.js',
        '/game/equipment.js',
        '/game/friendlist.js',
        '/game/spellbook.js',
        '/game/slot.js',
        '/game/status-bar.js',
        '/game/hotbar-manager.js',
        '/game/message.js',
        '/game/message-character.js',
        '/game/minimap.js',
        '/game/notification.js',
        '/game/keyboard.js',
        '/game/mouse.js',

        // 10. Core Executável do Motor
        '/game/game-loop.js',
        '/game/packet-handler.js',
        '/game/network-manager.js',
        '/game/replay-manager.js',
        '/game/gameclient.js',
        '/game/interface.js',
        '/game/index.js'
      ];

      const loadScriptsSequentially = async (index = 0) => {
        if (index >= scripts.length) {
          setStatus('Scripts carregados. Aguardando inicialização do motor...');

          // ⏳ Injeção automática síncrona dos arquivos
          setTimeout(async () => {
            try {
              setStatus('Injetando assets automaticamente...');

              const [sprResponse, datResponse] = await Promise.all([
                fetch('/data/74/Tibia.spr'),
                fetch('/data/74/Tibia.dat')
              ]);

              if (!sprResponse.ok || !datResponse.ok) {
                throw new Error("Assets binários não localizados na pasta /data/74/");
              }

              const sprBlob = await sprResponse.blob();
              const datBlob = await datResponse.blob();

              const sprFile = new File([sprBlob], "Minibia.spr", { type: "application/octet-stream" });
              const datFile = new File([datBlob], "Minibia.dat", { type: "application/octet-stream" });

              const assetSelector = document.getElementById('asset-selector') as HTMLInputElement;

              if (assetSelector) {
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(sprFile);
                dataTransfer.items.add(datFile);
                assetSelector.files = dataTransfer.files;

                const changeEvent = new Event('change', { bubbles: true, cancelable: true });
                assetSelector.dispatchEvent(changeEvent);

                setStatus('Assets injetados com sucesso!');
                console.log("[Ponte] 🚀 Evento 'change' disparado com injeção síncrona!");
              }
            } catch (error) {
              console.error("Erro no auto-load:", error);
              setStatus('Erro no carregamento automático dos assets.');
            }
          }, 1500);
          return;
        }

        const scriptUrl = scripts[index];

        if (document.querySelector(`script[src="${scriptUrl}"]`)) {
          loadScriptsSequentially(index + 1);
          return;
        }

        const script = document.createElement('script');
        script.src = scriptUrl;
        script.async = false;
        script.onload = () => loadScriptsSequentially(index + 1);
        script.onerror = () => {
          console.error(`Erro ao carregar o script: ${scriptUrl}`);
          setStatus(`Erro ao carregar script: ${scriptUrl}`);
        };
        document.body.appendChild(script);
      };

      const timer = setTimeout(() => {
        loadScriptsSequentially();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, []);

  const openModal = (id: string) => {
    const modal = document.getElementById(id);
    if (modal) {
      modal.style.display = 'flex';
      modal.classList.remove('hidden');
    }
  };

  const closeModal = (id: string) => {
    const modal = document.getElementById(id);
    if (modal) {
      modal.style.display = 'none';
      modal.classList.add('hidden');
    }
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-stone-200 select-none font-sans antialiased">
      <input type="file" id="asset-selector" className="hidden" multiple />
      <input id="load-save" type="file" className="hidden" />
      <input type="text" id="host" defaultValue="127.0.0.1:1337" className="hidden" />

      <div className="hidden">
        <audio id="rain" src="/sounds/rain.ogg" preload="none" type="audio/ogg" />
        <audio id="field" src="/sounds/field.ogg" preload="none" type="audio/ogg" />
        <audio id="cave" src="/sounds/cave.ogg" preload="none" type="audio/ogg" />
        <audio id="forest" src="/sounds/forest.ogg" preload="none" type="audio/ogg" />
        <audio id="wind" src="/sounds/wind.ogg" preload="none" type="audio/ogg" />
        <audio id="thunder-1" src="/sounds/thunder1.ogg" preload="none" type="audio/ogg" />
      </div>

      <div id="battle-window-target" className="hidden">
        <canvas id="battle-window-target-canvas"></canvas>
      </div>
      <div id="spellbook-wrapper-prototype" className="hidden"><canvas></canvas></div>

      <div
        id="login-wrapper"
        className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-neutral-950/85 backdrop-blur-md ${gameStarted ? '!hidden' : ''}`}
        style={{ display: gameStarted ? 'none' : 'flex' }}
      >
        <div id="login-inner" className="w-full max-w-md text-center flex flex-col items-center px-6 justify-center">
          <div className="login-version mb-12 text-[11px] tracking-widest text-stone-500 uppercase space-y-1 bg-neutral-900/40 px-5 py-2.5 rounded-full border border-neutral-800/50 backdrop-blur-sm">
            <div>Client: <span id="client-version" className="text-stone-300">...</span></div>
            <div className="flex gap-3 justify-center mt-1">
              <span>Sprites: <span id="sprites-loaded" className="text-rose-500 font-medium">Missing</span></span>
              <span className="text-neutral-700">|</span>
              <span>Objects: <span id="data-loaded" className="text-rose-500 font-medium">Missing</span></span>
            </div>
            <div className="text-[9px] text-amber-500/70 mt-1 lowercase italic">{status}</div>
          </div>

          <div className="mb-10 select-none pointer-events-none">
            <h2 className="text-xs font-bold tracking-[0.3em] text-amber-500/80 uppercase mb-2">The Legacy of</h2>
            <h1 className="text-4xl font-black tracking-wider text-stone-100 uppercase drop-shadow-md">Tibia HTML5</h1>
            <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent mx-auto mt-6" />
          </div>

          <div className="login-settings flex flex-col items-center w-full space-y-3 my-4">
            <button id="login-info" onClick={() => openModal('floater-enter')} className="w-full py-2 text-sm font-medium tracking-[0.2em] uppercase text-stone-400 hover:text-amber-400 transition-colors duration-200 block bg-transparent border-0 outline-none cursor-pointer">
              Enter Game
            </button>
            <button id="create-account" onClick={() => openModal('floater-create')} className="w-full py-2 text-sm font-medium tracking-[0.2em] uppercase text-stone-400 hover:text-amber-400 transition-colors duration-200 block bg-transparent border-0 outline-none cursor-pointer">
              Create Account
            </button>
          </div>

          <div className="mt-10 text-[11px] text-stone-500 hover:text-indigo-400 transition-colors flex items-center gap-2 bg-neutral-900/20 px-4 py-2 rounded-md border border-neutral-800/30 tracking-wider uppercase cursor-pointer">
            <span>Acesse nosso Discord Oficial</span>
          </div>

          <div className="modal-wrapper">
            <EnterGameModal onClose={() => closeModal('floater-enter')} onIntercept={interceptEngineAction} />
            <CreateAccountModal onClose={() => closeModal('floater-create')} onIntercept={interceptEngineAction} />
            <ConnectingModal />
            <CharacterSelectionModal
              onClose={() => closeModal('floater-charlist')}
              onConfirm={() => setGameStarted(true)}
            />
          </div>
        </div>
      </div>

      <div
        id="game-wrapper"
        className="w-screen h-screen flex items-center justify-center bg-black relative"
        style={{ minWidth: '800px', minHeight: '600px' }}
      >
        <div className="main w-full h-full flex items-center justify-center p-4">
          <div
            id="canvas-id"
            className="overflow-hidden shadow-2xl border border-neutral-800 rounded-md bg-zinc-900 flex items-center justify-center"
            style={{ width: '800px', height: '600px' }}
          >
            <canvas
              id="canvas"
              width={480}
              height={352}
              className="block w-full h-full pointer-events-auto"
              style={{
                display: 'block',
                width: '100%',
                height: '100%',
                imageRendering: 'pixelated',
                objectFit: 'contain'
              }}
            />
          </div>
        </div>
      </div>
    </main>
  );
}