import type { Wolf, MatingPair } from './wolf';
import type {
  EventResult,
  Prophecy,
  StoryEvent,
  DecisionResult,
  ScheduledConsequence,
  DecisionEvent,
} from './event';
import type { Territory } from './territory';
import type { PatrolAssignment, PatrolResult } from './patrol';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

// Subsystem configuration interfaces
export interface CombatConfig {
  damageMultiplier: number;
  highRiskThreshold: number;
  highRiskDamageBonus: number;
  rngVarianceRange: { min: number; max: number };
  mortalityThreshold: number;
  winnerDamageMultiplier: number;
  maxDefenderMultiplier: number;
  resourceTheftRange: { min: number; max: number };
  lowHealthPenaltyThreshold: number;
  lowHealthPenaltyMultiplier: number;
}

export interface HealerConfig {
  herbsPerTend: number;
  healHpRange: { min: number; max: number };
  baseSuccessRate: number;
  intelligenceBonus: number;
  failureHealerDamage: number;
  failurePatientDamage: number;
  maxTendsPerDay: number;
  prophecyPowerThreshold: number;
  crystalPoolVisitPower: number;
  lowHealthRefusalThreshold: number;
}

export interface RelationshipConfig {
  stageRequirements: {
    acquainted: { minDays: number; minBond: number };
    friends: { minDays: number; minBond: number };
    attracted: { minDays: number; minBond: number };
    courting: { minDays: number; minBond: number };
    mates: { minDays: number; minBond: number };
  };
  bondDecayInterval: number; // days between bond decay
  bondDecayAmount: number;
  bondDecayMinimum: number;
}

export interface PatrolTemplateConfig {
  huntingPatrol: {
    successWeight: number;
    majorSuccessWeight: number;
    failureWeight: number;
    disasterWeight: number;
    rewards: {
      success: { food: number; xp: number };
      majorSuccess: { food: number; xp: number; reputation: number };
      failure: { food: number };
    };
  };
  borderPatrol: {
    successWeight: number;
    majorSuccessWeight: number;
    failureWeight: number;
    disasterWeight: number;
    rewards: {
      success: { reputation: number; xp: number };
      majorSuccess: { reputation: number; xp: number };
    };
  };
  trainingPatrol: {
    successWeight: number;
    majorSuccessWeight: number;
    failureWeight: number;
    disasterWeight: number;
    rewards: {
      success: { xp: number };
      majorSuccess: { xp: number };
    };
  };
  herbGathering: {
    successWeight: number;
    majorSuccessWeight: number;
    failureWeight: number;
    disasterWeight: number;
    rewards: {
      success: { herbs: number; xp: number };
      majorSuccess: { herbs: number; xp: number };
    };
  };
}

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
  // Decision and consequence system
  pendingDecisions?: DecisionEvent[]; // decisions awaiting player choice
  decisionHistory?: DecisionResult[]; // completed decisions
  scheduledConsequences?: ScheduledConsequence[]; // delayed consequences
  packApproval?: number; // pack approval rating (0-100), affects stability
  lastMoonEventDay?: number; // tracking monthly moon events
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
  // Subsystem configurations
  combatSystem: CombatConfig;
  healerSystem: HealerConfig;
  relationshipSystem: RelationshipConfig;
  patrolTemplates: PatrolTemplateConfig;
  matingSystem: {
    courtshipDuration: number; // minimum days before mating
    bondDecayRate: number; // daily bond strength decay
    minBreedingBond: number; // minimum bond strength to breed
    maxLittersPerYear: number; // breeding limit per female
    breedingSeasonOnly: boolean; // spring-only breeding
    inbreedingPrevention: boolean; // prevent family member mating
    alphaApprovalRequired: boolean; // alpha must approve new pairs
    relationshipProgressionRate: number; // multiplier for relationship progression speed
    seasonalBreedingProbabilities: {
      spring: number;
      summer: number;
      autumn: number;
      winter: number;
    };
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
  decisionSystem: {
    moonEventFrequencyDays: number; // how often moon events occur
    decisionTimeoutDays: number; // default timeout for player decisions
    approvalDecayRate: number; // daily approval decay if approval < 50
    maxPendingDecisions: number; // max simultaneous pending decisions
    consequenceDelayRange: { min: number; max: number }; // days for consequences
  };
}
