// Tipos y Modelos para el Sistema de Magia estilo Magicka

export type MagickaElement = 'fire' | 'water' | 'lightning' | 'ice' | 'earth' | 'shield';

export type CastMode = 'shoot' | 'area' | 'self';

export interface SpellOutcome {
  name: string;
  description: string;
  castMode: CastMode;
  damage: number;
  heal: number;
  shieldAmount: number;
  speedBoost: number;
  radius: number;
  color: string;
  secondaryColor?: string;
  projectileSpeed: number;
  pierce: number;
  duration: number; // en frames
  inflictsWet?: boolean;
  inflictsBurn?: boolean;
  inflictsFreeze?: boolean;
  inflictsShock?: boolean;
  knockback: number;
}
