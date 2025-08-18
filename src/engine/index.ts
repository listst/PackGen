// Main engine exports
export { eventEngine, EventEngine } from './eventEngine';
export {
  simulationEngine,
  SimulationEngine,
  DEFAULT_CONFIG,
} from './simulation';
export { CombatEngine } from './combat';
export {
  trainingEngine,
  TrainingEngine,
  DEFAULT_TRAINING_CONFIG,
} from './training';
export { HealerEngine, healerEngine } from './healer';
export { wolfGenerator, WolfGenerator, DEFAULT_GENERATOR_CONFIG } from './wolfGenerator';

// Re-export types for convenience
export type { Wolf } from '../types/wolf';
export type { Pack, GameConfig } from '../types/pack';
export type { EventTemplate, EventResult, Action } from '../types/event';
export type { Territory, BattleResult } from '../types/territory';

// Re-export utilities
export {
  isAlive,
  isPup,
  isAdult,
  isBreedingAge,
  canBreed,
  getCombatScore,
  getAliveWolves,
  getWolvesByRole,
  getWolfById,
  removeWolf,
  getCurrentSeason,
  isSpring,
  getSeasonModifier,
  replaceTemplate,
  generateId,
  random,
  seedRandom,
} from '../types/utils';
