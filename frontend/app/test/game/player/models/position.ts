/**
 * Interface que representa as coordenadas tridimensionais no mapa do jogo.
 * - x: Posição no eixo Horizontal (Leste / Oeste)
 * - y: Posição no eixo Vertical (Norte / Sul)
 * - z: Andar / Camada do mapa (Ex: 7 costuma ser o nível do solo)
 */
export interface Position {
  x: number;
  y: number;
  z: number;
}