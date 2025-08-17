// Main engine exports
export { eventEngine, EventEngine } from './eventEngine';
export {
  simulationEngine,
  SimulationEngine,
  DEFAULT_CONFIG,
} from './simulation';
export { combatEngine, CombatEngine } from './combat';
export {
  trainingEngine,
  TrainingEngine,
  DEFAULT_TRAINING_CONFIG,
} from './training';
export { healerEngine, HealerEngine, DEFAULT_HEALER_CONFIG } from './healer';

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
