// app/test/game/player/controllers/input-manager.ts

import { NetworkManager } from 'app/test/game/network/services/network-manager';

export const WALK_OPCODES = {
  WEST:  3,  // Esquerda (X - 1)
  NORTH: 4,  // Cima (Y - 1)
  EAST:  5,  // Direita (X + 1)
  SOUTH: 6,  // Baixo (Y + 1)
  NORTHWEST: 7,
  NORTHEAST: 8,
  SOUTHEAST: 9,
  SOUTHWEST: 10,
} as const;

export class InputManager {
  private network: NetworkManager;
  private isListening: boolean = false;
  private lastActionTime: number = 0;
  private actionDelayMs: number = 200; // ⏱️ Intervalo mínimo entre passos (200ms)

  // 🔒 Guarda as teclas que estão atualmente pressionadas
  private pressedKeys: Set<string> = new Set();

  public static lastRequestedDirection: number | null = null;

  constructor(network: NetworkManager) {
    this.network = network;
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
  }

  public start() {
    if (this.isListening || typeof window === 'undefined') return;
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    this.isListening = true;
  }

  public stop() {
    if (!this.isListening || typeof window === 'undefined') return;
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.pressedKeys.clear();
    this.isListening = false;
  }

  private handleKeyUp(event: KeyboardEvent) {
    // Libera a tecla para poder andar de novo
    this.pressedKeys.delete(event.code);
  }

  private handleKeyDown(event: KeyboardEvent) {
    const target = event.target as HTMLElement;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
      return;
    }

    // 🛑 Se a tecla já estiver pressionada (manteve o dedo no botão), ignora o auto-repeat do browser
    if (this.pressedKeys.has(event.code)) {
      return;
    }

    const now = Date.now();
    if (now - this.lastActionTime < this.actionDelayMs) return;

    let walkOpcode: number | null = null;

    // 🎯 Mapeamento WASD / Setas / Numpad
    switch (event.code) {
      case 'ArrowUp':    case 'KeyW': walkOpcode = WALK_OPCODES.NORTH; break;
      case 'ArrowRight': case 'KeyD': walkOpcode = WALK_OPCODES.EAST;  break;
      case 'ArrowDown':  case 'KeyS': walkOpcode = WALK_OPCODES.SOUTH; break;
      case 'ArrowLeft':  case 'KeyA': walkOpcode = WALK_OPCODES.WEST;  break;

      case 'Numpad7': walkOpcode = WALK_OPCODES.NORTHWEST; break;
      case 'Numpad9': walkOpcode = WALK_OPCODES.NORTHEAST; break;
      case 'Numpad3': walkOpcode = WALK_OPCODES.SOUTHEAST; break;
      case 'Numpad1': walkOpcode = WALK_OPCODES.SOUTHWEST; break;
    }

    if (walkOpcode !== null) {
      event.preventDefault();

      // Registra que a tecla está pressionada e atualiza o tempo da ação
      this.pressedKeys.add(event.code);
      this.lastActionTime = now;
      InputManager.lastRequestedDirection = walkOpcode;

      // Envia exatamente 1 passo por toque
      this.network.send(new Uint8Array([walkOpcode]));
    }
  }

  public sendWalk(direction: number) {
    const now = Date.now();
    if (now - this.lastActionTime < this.actionDelayMs) return;

    this.lastActionTime = now;
    InputManager.lastRequestedDirection = direction;
    this.network.send(new Uint8Array([direction]));
  }
}