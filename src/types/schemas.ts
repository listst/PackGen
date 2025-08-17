import { z } from 'zod';

// Wolf schemas
export const AppearanceSchema = z.object({
  furColor: z.string(),
  pattern: z.string(),
  eyeColor: z.string(),
  scars: z.array(z.string()),
});

export const StatsSchema = z.object({
  health: z.number().min(0).max(100),
  strength: z.number().min(0).max(10),
  speed: z.number().min(0).max(10),
  intelligence: z.number().min(0).max(10),
});

export const TraitsSchema = z.object({
  bravery: z.number().min(0).max(10),
  sociability: z.number().min(0).max(10),
  trainability: z.number().min(0).max(10),
  fertility: z.number().min(0).max(10),
});

export const RoleSchema = z.enum([
  'alpha',
  'alpha_mate',
  'beta',
  'healer',
  'hunter',
  'omega',
  'pup',
  'elder',
]);

export const WolfSchema = z.object({
  id: z.string(),
  name: z.string(),
  sex: z.enum(['male', 'female']),
  age: z.number().min(0),
  role: RoleSchema,
  appearance: AppearanceSchema,
  stats: StatsSchema,
  traits: TraitsSchema,
  xp: z.number().optional(),
  level: z.number().optional(),
  pregnant: z.boolean().optional(),
  pregnancyDay: z.number().optional(),
  mateId: z.string().nullable().optional(),
  bonds: z.record(z.string(), z.number().min(-100).max(100)).optional(),
  _dead: z.boolean().optional(),
  _dispersed: z.boolean().optional(),
  maxLifespan: z.number().optional(),
  isTraining: z.boolean().optional(),
  trainingStartDay: z.number().optional(),
  trainingMentorId: z.string().optional(),
  isSick: z.boolean().optional(),
});

// Event schemas
export const OperatorSchema = z.enum([
  '==',
  '!=',
  '>',
  '>=',
  '<',
  '<=',
  'in',
  'not_in',
]);

export const ConditionSchema = z.lazy(() =>
  z.object({
    field: z.string(),
    op: OperatorSchema,
    value: z.unknown(),
  })
);

export const ConditionGroupSchema = z.lazy(() =>
  z.object({
    any: z.array(z.union([ConditionSchema, ConditionGroupSchema])).optional(),
    all: z.array(z.union([ConditionSchema, ConditionGroupSchema])).optional(),
    not: z.union([ConditionSchema, ConditionGroupSchema]).optional(),
  })
);

export const ActionSchema = z.union([
  z.object({
    type: z.literal('modify_stat'),
    target: z.enum(['wolf', 'target', 'pack']),
    stat: z.string(),
    delta: z.number(),
  }),
  z.object({
    type: z.literal('set_stat'),
    target: z.enum(['wolf', 'target', 'pack']),
    stat: z.string(),
    value: z.number(),
  }),
  z.object({
    type: z.literal('spawn_wolf'),
    wolfTemplate: WolfSchema.partial(),
    count: z.number().optional(),
  }),
  z.object({
    type: z.literal('remove_wolf'),
    targetSelector: z.enum(['wolf', 'lowest_health', 'all_pups']).optional(),
  }),
  z.object({
    type: z.literal('change_role'),
    target: z.enum(['wolf', 'target']),
    role: RoleSchema,
  }),
  z.object({
    type: z.literal('log'),
    text: z.string(),
  }),
  z.object({
    type: z.literal('adjust_bond'),
    withWolfIdField: z.string().optional(),
    delta: z.number(),
  }),
  z.object({
    type: z.literal('trigger_story'),
    storyId: z.string(),
  }),
]);

export const EventTemplateSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  text: z.string(),
  condition: ConditionGroupSchema,
  actions: z.array(ActionSchema),
  weight: z.number().optional(),
  tags: z.array(z.string()).optional(),
  allowFallback: z.boolean().optional(),
});

// Pack schemas
export const SeasonSchema = z.enum(['spring', 'summer', 'autumn', 'winter']);

export const PackSchema = z.object({
  name: z.string(),
  day: z.number().min(0),
  season: SeasonSchema,
  wolves: z.array(WolfSchema),
  herbs: z.number().min(0),
  logs: z.array(z.string()),
  eventHistory: z.array(z.any()), // EventResult schema would be complex
  prophecies: z.array(z.any()),
  storyEvents: z.array(z.any()),
  prophecyPower: z.number().min(0),
});

// Territory schemas
export const RivalPackSchema = z.object({
  id: z.string(),
  name: z.string(),
  strength: z.number().min(0),
  lastRaidDay: z.number().optional(),
  aggression: z.number().min(0).max(10),
});

export const TerritorySchema = z.object({
  biome: z.string(),
  rivalPacks: z.array(RivalPackSchema),
  foodRichness: z.number(),
  herbAbundance: z.number(),
  dangerLevel: z.number(),
});

// Validation functions
export function validateWolf(data: unknown) {
  return WolfSchema.parse(data);
}

export function validateEventTemplate(data: unknown) {
  return EventTemplateSchema.parse(data);
}

export function validatePack(data: unknown) {
  return PackSchema.parse(data);
}

export function validateTerritory(data: unknown) {
  return TerritorySchema.parse(data);
}
