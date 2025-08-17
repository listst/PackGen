export type PatrolType = 'hunting' | 'border' | 'training' | 'herb_gathering';

export type PatrolOutcome =
  | 'success'
  | 'failure'
  | 'major_success'
  | 'disaster'
  | 'event';

export interface PatrolResult {
  id: string;
  type: PatrolType;
  participants: string[]; // wolf IDs
  outcome: PatrolOutcome;
  description: string;
  rewards?: PatrolReward[];
  consequences?: PatrolConsequence[];
  day: number;
}

export interface PatrolReward {
  type: 'food' | 'herbs' | 'experience' | 'territory' | 'reputation';
  amount: number;
  description: string;
}

export interface PatrolConsequence {
  type: 'injury' | 'illness' | 'missing' | 'territory_loss' | 'reputation_loss';
  targetWolfId?: string; // specific wolf affected
  severity: 'minor' | 'moderate' | 'severe';
  description: string;
}

export interface PatrolTemplate {
  id: string;
  type: PatrolType;
  title: string;
  description: string;
  outcomes: PatrolOutcomeTemplate[];
  requirements?: PatrolRequirement[];
  baseWeight: number; // how often this patrol type appears
}

export interface PatrolOutcomeTemplate {
  outcome: PatrolOutcome;
  weight: number;
  title: string;
  description: string;
  requirements?: PatrolRequirement[];
  rewards?: PatrolReward[];
  consequences?: PatrolConsequence[];
}

export interface PatrolRequirement {
  type: 'wolf_count' | 'role_required' | 'season' | 'pack_size' | 'territory';
  value: string | number | string[];
  operator?: '==' | '!=' | '>' | '>=' | '<' | '<=' | 'in' | 'not_in';
}

export interface PatrolAssignment {
  id: string;
  type: PatrolType;
  participants: string[]; // wolf IDs
  scheduledDay: number;
  completed: boolean;
  result?: PatrolResult;
}

// Pack state extensions for patrol system
export interface PatrolPackState {
  assignedPatrols: PatrolAssignment[];
  patrolHistory: PatrolResult[];
  patrolRequirements: {
    minHuntingPatrols: number; // per month
    minBorderPatrols: number; // per month
    maxPatrolsPerWolf: number; // per month
  };
  patrolReputation: number; // affects patrol success rates
  food: number; // food stores from hunting
}
