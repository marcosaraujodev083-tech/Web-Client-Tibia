// Importação segura do tipo Position
import type { Position } from '../../player/models/position';

export interface OutfitData {
  id: number;
  head: number;
  body: number;
  legs: number;
  feet: number;
}

export interface ItemData {
  clientId: number;
  count: number;
}

export class PacketReaderBase {
  public buffer: Uint8Array;
  public index: number;

  constructor(buffer: ArrayBuffer | Uint8Array) {
    this.buffer = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    this.index = 0;
  }

  public readable(): boolean {
    return this.index < this.buffer.length;
  }

  public skip(n: number): void {
    this.index = Math.min(this.buffer.length, this.index + n);
  }

  public readUInt8(): number {
    return this.buffer[this.index++];
  }

  public readInt8(): number {
    const value = this.buffer[this.index++];
    return (value << 24) >> 24;
  }

  public readUInt16(): number {
    const b1 = this.buffer[this.index++];
    const b2 = this.buffer[this.index++];
    return b1 + (b2 << 8);
  }

  /**
   * 🛠️ Garantia de leitura de UInt32 sem sinal negativo (unsigned 32-bit integer)
   */
  public readUInt32(): number {
    const b1 = this.buffer[this.index++];
    const b2 = this.buffer[this.index++];
    const b3 = this.buffer[this.index++];
    const b4 = this.buffer[this.index++];
    return (b1 + (b2 << 8) + (b3 << 16) + (b4 * 0x1000000)) >>> 0;
  }

  public readBoolean(): boolean {
    return this.readUInt8() === 1;
  }

  public readString(): string {
    const length = this.readUInt16();
    if (length === 0 || this.index + length > this.buffer.length) return "";

    const slice = this.buffer.subarray(this.index, this.index + length);
    const decoded = new TextDecoder("utf-8").decode(slice);
    this.index += length;
    return decoded;
  }

  public readRGB(): number {
    const r = this.buffer[this.index++];
    const g = this.buffer[this.index++];
    const b = this.buffer[this.index++];
    return r + (g << 8) + (b << 16);
  }

  /**
   * 📍 Lê a posição tridimensional do mundo (x: UInt16, y: UInt16, z: UInt16)
   */
  public readPosition(): Position {
    return {
      x: this.readUInt16(),
      y: this.readUInt16(),
      z: this.readUInt16(),
    } as Position;
  }

  /**
   * 👔 🆕 Lê um bloco visual de Outfit/Aparência
   */
  public readOutfit(): OutfitData {
    const id = this.readUInt16();
    const head = this.readUInt8();
    const body = this.readUInt8();
    const legs = this.readUInt8();
    const feet = this.readUInt8();
    this.skip(5); // Descarta addons e montaria se presentes
    return { id, head, body, legs, feet };
  }

  /**
   * 🎒 🆕 Lê um Item genérico (clientId + count)
   */
  public readItem(): ItemData {
    const clientId = this.readUInt16();
    const count = this.readUInt8();
    return { clientId, count };
  }

  public readSprite(): Uint8ClampedArray {
    const size = 4 * 32 * 32;
    const array = new Uint8ClampedArray(this.buffer.subarray(this.index, this.index + size));
    this.index += size;
    return array;
  }
}