import type { Wolf, MatingPair } from './wolf';
import type { EventResult, Prophecy, StoryEvent } from './event';
import type { Territory } from './territory';
import type { PatrolAssignment, PatrolResult } from './patrol';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export interface Pack {
  name: string;
  day: number;
  season: Season;
  wolves: Wolf[];
  matingPairs: MatingPair[]; // active mating pairs
  herbs: number;
  logs: string[];
  eventHistory: EventResult[];
  prophecies: Prophecy[];
  storyEvents: StoryEvent[];
  prophecyPower: number; // for healer prophecy generation
  territory?: Territory;
  // Patrol system
  assignedPatrols?: PatrolAssignment[];
  patrolHistory?: PatrolResult[];
  patrolReputation?: number; // affects patrol success rates
  food?: number; // food stores from hunting
}

export interface PackState extends Pack {
  // Additional derived state
  aliveWolves: Wolf[];
  alphas: Wolf[];
  healers: Wolf[];
  pups: Wolf[];
  trainingPups: Wolf[];
}

export interface GameConfig {
  daysPerSeason: number;
  eventsPerDay: { min: number; max: number };
  gestationDays: number;
  trainingStartAge: number; // in days
  trainingDuration: number; // in days
  maxLifespan: { min: number; max: number };
  xpToLevel: number;
  healerHerbsPerTend: number;
  healHpRange: { min: number; max: number };
  healerBaseSuccessRate: number;
  matingSystem: {
    courtshipDuration: number; // minimum days before mating
    bondDecayRate: number; // daily bond strength decay
    minBreedingBond: number; // minimum bond strength to breed
    maxLittersPerYear: number; // breeding limit per female
    breedingSeasonOnly: boolean; // spring-only breeding
    inbreedingPrevention: boolean; // prevent family member mating
    alphaApprovalRequired: boolean; // alpha must approve new pairs
    relationshipProgressionRate: number; // multiplier for relationship progression speed
  };
  seasonalModifiers: {
    spring: {
      birthWindow: boolean;
      huntSuccess: number;
      courtshipBonus: number;
    };
    summer: { huntSuccess: number; bondDecay: number };
    autumn: { battleFrequency: number; bondDecay: number };
    winter: { huntSuccess: number; bondDecay: number };
  };
  patrolSystem: {
    minHuntingPatrolsPerMonth: number;
    minBorderPatrolsPerMonth: number;
    maxPatrolsPerWolfPerMonth: number;
    patrolCooldownDays: number;
    baseSuccessRate: number;
    reputationImpact: number;
  };
}
