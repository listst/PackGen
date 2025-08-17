import type { Wolf } from './wolf';
import type { EventResult, Prophecy, StoryEvent } from './event';
import type { Territory } from './territory';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export interface Pack {
  name: string;
  day: number;
  season: Season;
  wolves: Wolf[];
  herbs: number;
  logs: string[];
  eventHistory: EventResult[];
  prophecies: Prophecy[];
  storyEvents: StoryEvent[];
  prophecyPower: number; // for healer prophecy generation
  territory?: Territory;
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
  seasonalModifiers: {
    spring: { birthWindow: boolean; huntSuccess: number };
    summer: { huntSuccess: number };
    autumn: { battleFrequency: number };
    winter: { huntSuccess: number };
  };
}
