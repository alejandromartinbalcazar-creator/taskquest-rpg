import { BaseElement } from '../../types';

/** Datos declarativos: nuevos biomas se añaden sin tocar el motor de combate. */
export type RoomKind = 'entrance' | 'combat' | 'ambush' | 'treasure' | 'rest' | 'event' | 'elite' | 'boss';
export type ModifierKind = 'hazard' | 'blessing' | 'enemy_rule' | 'reward_rule';

export interface RewardTable {
  gold: [number, number];
  essence: [number, number];
  heartChance: number;
  chestChance: number;
}

export interface RoomTemplate {
  id: string;
  kind: RoomKind;
  title: string;
  weight: number;
  enemyPool?: string[];
  reward: RewardTable;
  visualCue: string;
}

export interface RunModifier {
  id: string;
  name: string;
  kind: ModifierKind;
  description: string;
  color: string;
  allowedRooms: RoomKind[];
}

export interface BiomeDefinition {
  id: string;
  name: string;
  chapter: number;
  palette: { sky: string; ground: string; accent: string };
  musicMood: 'exploration' | 'boss';
  roomTemplates: RoomTemplate[];
  modifiers: RunModifier[];
  bossId: string;
  recommendedElements: BaseElement[];
}

export interface ExpeditionRun {
  seed: number;
  biomeId: string;
  modifier: RunModifier;
  rooms: RoomTemplate[];
}
