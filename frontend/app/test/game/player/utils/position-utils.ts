// Coordenadas padrão do templo caso venha algo nulo ou corrompido do backend
export const TEMPLE_POSITION = { x: 82, y: 81, z: 8 };

/**
 * Valida se as coordenadas recebidas do servidor são numéricas e válidas.
 */
export function getValidPosition(
  pos: { x: number; y: number; z: number },
  onInvalid?: (msg: string) => void
) {
  if (!pos || !pos.x || !pos.y || isNaN(pos.x) || isNaN(pos.y)) {
    if (onInvalid) {
      onInvalid(`⚠️ Posição inválida recebida (X:${pos?.x} Y:${pos?.y}). Redirecionando ao Templo.`);
    }
    return TEMPLE_POSITION;
  }
  return pos;
}

/**
 * Helper para verificar se uma entidade recebida é o próprio jogador
 */
export function sessionCharIsMe(incomingName: string, selectedChar: string): boolean {
  if (!incomingName || !selectedChar) return false;
  return incomingName.toLowerCase().trim() === selectedChar.toLowerCase().trim();
}