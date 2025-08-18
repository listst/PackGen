export interface Appearance {
  // Primary coat traits
  furColor: string;
  pattern: string;
  eyeColor: string;
  scars: string[];
  
  // Extended visual traits for enhanced appearance system
  baseColor?: string; // Primary base coat color
  markingColor?: string; // Secondary marking color
  markingType?: string; // Type of markings (stripes, spots, etc.)
  noseColor?: string; // Nose pigmentation
  pawPadColor?: string; // Paw pad color
  furLength?: 'short' | 'medium' | 'long'; // Coat length
  furTexture?: 'smooth' | 'coarse' | 'fluffy'; // Coat texture
  bodySize?: 'small' | 'medium' | 'large'; // Physical build
  earShape?: 'pointed' | 'rounded' | 'large'; // Ear characteristics
  tailType?: 'thick' | 'bushy' | 'thin' | 'plume'; // Tail characteristics
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
  | 'beta'
  | 'healer'
  | 'hunter'
  | 'omega'
  | 'pup'
  | 'elder';

export interface MatingPair {
  id: string;
  maleId: string;
  femaleId: string;
  bondedDay: number; // when they became a pair
  bondStrength: number; // 0-100, affects breeding success
  lastBreedingSeason?: number; // season year when they last bred
  courtshipEvents: string[]; // track courtship history
}

export interface BreedingHistory {
  lastLitterYear?: number; // year when last litter was born
  totalLitters: number;
  litterId?: string[]; // IDs of offspring for family tracking
}

export type RelationshipStage =
  | 'strangers'
  | 'acquainted'
  | 'friends'
  | 'attracted'
  | 'courting'
  | 'mates';

export interface Relationship {
  stage: RelationshipStage;
  daysMet: number; // days since first meeting
  daysSinceStageChange: number; // days since last stage progression
  bond: number; // -100 to 100, relationship strength
}

export interface FamilyTree {
  parentIds: string[]; // mother and father IDs
  siblingIds: string[]; // siblings from same litter
  offspringIds: string[]; // children
}

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
  mateId?: string | null; // current mate ID (for backward compatibility)
  bonds?: Record<string, number>; // relationship scores to other wolves -100..+100 (legacy)
  relationships?: Record<string, Relationship>; // new relationship system
  breedingHistory?: BreedingHistory;
  familyTree?: FamilyTree;
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
