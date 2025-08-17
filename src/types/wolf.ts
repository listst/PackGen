export interface Appearance {
  furColor: string;
  pattern: string;
  eyeColor: string;
  scars: string[];
}

export interface Stats {
  health: number; // 0-100
  strength: number; // 0-10
  speed: number; // 0-10
  intelligence: number; // 0-10
}

export interface Traits {
  bravery: number; // 0-10
  sociability: number; // 0-10
  trainability: number; // 0-10
  fertility: number; // 0-10
}

export type Role =
  | 'alpha'
  | 'alpha_mate'
  | 'beta'
  | 'healer'
  | 'hunter'
  | 'omega'
  | 'pup'
  | 'elder';

export interface Wolf {
  id: string; // unique
  name: string;
  sex: 'male' | 'female';
  age: number; // years (float). 1.0 = 1 year
  role: Role;
  appearance: Appearance;
  stats: Stats;
  traits: Traits;
  xp?: number; // XP pool for leveling
  level?: number;
  pregnant?: boolean;
  pregnancyDay?: number; // day when pregnancy began
  mateId?: string | null;
  bonds?: Record<string, number>; // relationship scores to other wolves -100..+100
  _dead?: boolean;
  _dispersed?: boolean;
  maxLifespan?: number; // base lifespan drawn at birth
  isTraining?: boolean;
  trainingStartDay?: number;
  trainingMentorId?: string;
  isSick?: boolean;
}

export interface WolfMeta {
  id: string;
  backstory: string;
}
