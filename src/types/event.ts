import type { Role } from './wolf';

export type Operator = '==' | '!=' | '>' | '>=' | '<' | '<=' | 'in' | 'not_in';

export interface Condition {
  field: string; // dot path, e.g. "age" or "stats.health" or "traits.bravery"
  op: Operator;
  value: unknown;
}

export interface ConditionGroup {
  any?: Array<Condition | ConditionGroup>; // logical OR
  all?: Array<Condition | ConditionGroup>; // logical AND
  not?: Condition | ConditionGroup;
}

export type Action =
  | {
      type: 'modify_stat';
      target: 'wolf' | 'target' | 'pack';
      stat: string;
      delta: number;
    }
  | {
      type: 'set_stat';
      target: 'wolf' | 'target' | 'pack';
      stat: string;
      value: number;
    }
  | {
      type: 'spawn_wolf';
      wolfTemplate: Partial<import('./wolf').Wolf>;
      count?: number;
    }
  | {
      type: 'remove_wolf';
      targetSelector?: 'wolf' | 'lowest_health' | 'all_pups';
    }
  | { type: 'change_role'; target: 'wolf' | 'target'; role: Role }
  | { type: 'log'; text: string }
  | { type: 'adjust_bond'; withWolfIdField?: string; delta: number }
  | { type: 'trigger_story'; storyId: string };

export interface EventTemplate {
  id: string;
  title?: string;
  text: string; // placeholders: {wolf.name}, {pack.name}, {target.name}
  condition: ConditionGroup; // triggers when condition satisfied
  actions: Action[];
  weight?: number; // selection weight
  tags?: string[]; // e.g. ["hunting","birth","prophecy"]
  allowFallback?: boolean; // whether to allow fallback candidate selection
}

export interface EventResult {
  eventId: string;
  wolfId: string;
  targetWolfId?: string;
  text: string;
  day: number;
  actions: Action[];
}

export interface StoryEvent {
  id: string;
  title: string;
  text: string;
  objectives: ConditionGroup[];
  progress: number; // 0-1
  reward?: {
    type: 'stat_boost' | 'xp' | 'item';
    target: 'wolf' | 'pack';
    stat?: string;
    value?: number;
  };
  unlocked?: boolean;
  completed?: boolean;
}

export interface Prophecy {
  id: string;
  text: string;
  objectives: ConditionGroup[];
  progress: number;
  targetWolfId?: string;
  unlocked: boolean;
  completed: boolean;
  storyEvents: string[]; // list of story event IDs this prophecy unlocks
}
