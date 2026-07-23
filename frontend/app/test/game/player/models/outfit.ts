/**
 * Interface que representa o visual (Outfit/Addons) do personagem ou criatura.
 * - id: Identificador do sprite/preset de roupa (Ex: 128 = Male Citizen, 136 = Female Citizen)
 * - head: Código da cor do Cabelo/Cabeça
 * - body: Código da cor do Torso/Peito
 * - legs: Código da cor das Pernas
 * - feet: Código da cor dos Pés
 * - addons: Mascaramento de bits para os acessórios ativados (0x00 = Nenhum, 0x01 = Addon 1, 0x02 = Addon 2, 0x03 = Ambos)
 */
export interface Outfit {
  id: number;
  head: number;
  body: number;
  legs: number;
  feet: number;
  addons?: number;
}