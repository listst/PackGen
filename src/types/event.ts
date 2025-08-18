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
      targetSelector?: 'wolf' | 'lowest_health' | 'all_pups' | 'beta';
    }
  | { type: 'change_role'; target: 'wolf' | 'target'; role: Role }
  | { type: 'log'; text: string }
  | { type: 'adjust_bond'; withWolfIdField?: string; delta: number }
  | { type: 'trigger_story'; storyId: string }
  | { type: 'schedule_consequence'; consequenceId: string; daysDelay: number }
  | { type: 'adjust_approval'; delta: number }
  | {
      type: 'kill_wolf';
      targetSelector?: 'wolf' | 'target' | 'random' | 'weakest' | 'beta';
    }
  | {
      type: 'injure_wolf';
      targetSelector?: 'wolf' | 'target' | 'random';
      injury: string;
      healingDays: number;
    }
  | {
      type: 'change_alpha';
      newAlphaSelector?: 'beta' | 'strongest' | 'most_approved';
    }
  | { type: 'create_rival_pack'; packName: string; strength: number }
  | { type: 'lose_territory'; amount: number }
  | { type: 'promote_role'; targetSelector: string; newRole: Role };

export interface EventTemplate {
  id: string;
  title?: string | undefined;
  text: string; // placeholders: {wolf.name}, {pack.name}, {target.name}
  condition: ConditionGroup; // triggers when condition satisfied
  actions: Action[];
  weight?: number | undefined; // selection weight
  tags?: string[] | undefined; // e.g. ["hunting","birth","prophecy"]
  allowFallback?: boolean | undefined; // whether to allow fallback candidate selection
  seasonalBonus?: Partial<Record<import('./pack').Season, number>> | undefined; // seasonal weight modifiers
  biomeBonus?: Partial<Record<string, number>> | undefined; // biome weight modifiers
  requiredBiome?: string | undefined; // required biome for biome-specific events
  storyChainId?: string | undefined; // story chain identifier for connected events
}

export interface EventResult {
  eventId: string;
  wolfId: string;
  targetWolfId?: string | undefined;
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

// Decision Event System
export interface DecisionChoice {
  id: string;
  text: string; // choice text for player
  description?: string | undefined; // additional explanation
  condition?: ConditionGroup | undefined; // optional condition to show this choice
  actions: Action[]; // consequences of choosing this option
  weight?: number | undefined; // for random AI decisions if player doesn't choose
}

export interface DecisionEvent extends Omit<EventTemplate, 'actions'> {
  type: 'decision';
  choices: DecisionChoice[];
  timeoutDays?: number | undefined; // auto-decide after X days if no player choice
  defaultChoiceId?: string | undefined; // fallback choice if timeout occurs
  isPlayerChoice: boolean; // true for player decisions, false for AI events
}

export interface MoonEvent extends DecisionEvent {
  eventType: 'moon_event';
  category: 'leadership' | 'ceremony' | 'crisis' | 'opportunity' | 'pack_wide';
  seasonalBonus?: Partial<Record<import('./pack').Season, number>> | undefined; // seasonal weight modifiers
}

export interface ConsequenceTemplate {
  id: string;
  title: string;
  text: string;
  condition?: ConditionGroup | undefined; // conditions that must be met to trigger
  actions: Action[];
  tags?: string[] | undefined;
}

export interface MultiOutcomeConsequence {
  id: string;
  title: string;
  outcomes: ConsequenceOutcome[];
  defaultOutcomeId?: string | undefined;
}

export interface ConsequenceOutcome {
  id: string;
  title: string;
  text: string;
  condition?: ConditionGroup | undefined; // conditions for this specific outcome
  probability?: number | undefined; // base probability (0-1), modified by conditions
  actions: Action[];
  tags?: string[] | undefined;
}

export interface ScheduledConsequence {
  id: string;
  consequenceId: string;
  triggerDay: number;
  eventContext: {
    wolfId?: string | undefined;
    targetWolfId?: string | undefined;
    originalEventId: string;
    choiceId?: string | undefined;
  };
  resolved: boolean;
}

export interface DecisionResult extends EventResult {
  choiceId: string;
  choiceText: string;
  isPlayerChoice: boolean;
  consequences?: ScheduledConsequence[] | undefined;
}
