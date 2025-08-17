import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Event generation patterns
const eventPatterns = [
  // Hunting events
  {
    category: 'hunting',
    templates: [
      'hunt_success',
      'hunt_failure',
      'hunt_injury',
      'hunt_discovery',
      'hunt_competition',
      'hunt_weather',
      'hunt_stamina',
      'hunt_teamwork',
      'hunt_prey_escape',
      'hunt_territory_dispute',
    ],
  },
  // Social events
  {
    category: 'social',
    templates: [
      'bonding',
      'rivalry',
      'mentorship',
      'leadership',
      'cooperation',
      'conflict_resolution',
      'pack_meeting',
      'story_telling',
      'play_time',
      'grooming',
    ],
  },
  // Health events
  {
    category: 'health',
    templates: [
      'illness',
      'injury',
      'recovery',
      'exhaustion',
      'vigor',
      'aging',
      'strength_gain',
      'speed_training',
      'endurance',
      'weakness',
    ],
  },
  // Environment events
  {
    category: 'environment',
    templates: [
      'weather_storm',
      'weather_drought',
      'weather_cold',
      'weather_heat',
      'flood',
      'earthquake',
      'fire',
      'abundance',
      'scarcity',
      'migration',
    ],
  },
  // Territory events
  {
    category: 'territory',
    templates: [
      'rival_encounter',
      'border_patrol',
      'scent_marking',
      'territory_expansion',
      'resource_discovery',
      'den_maintenance',
      'trail_discovery',
      'landmark',
      'predator',
      'prey_abundance',
    ],
  },
  // Training events
  {
    category: 'training',
    templates: [
      'skill_development',
      'mentor_lesson',
      'practice_session',
      'achievement',
      'challenge',
      'breakthrough',
      'struggle',
      'graduation',
      'specialization',
      'technique',
    ],
  },
  // Prophecy/Story events
  {
    category: 'prophecy',
    templates: [
      'crystal_vision',
      'dream_prophecy',
      'omen_sighting',
      'ancient_knowledge',
      'spirit_guidance',
      'mystical_event',
      'ritual',
      'blessing',
      'warning',
      'revelation',
    ],
  },
  // Life cycle events
  {
    category: 'lifecycle',
    templates: [
      'birth',
      'naming',
      'first_steps',
      'coming_of_age',
      'mating',
      'pregnancy',
      'elder_wisdom',
      'death',
      'memorial',
      'legacy',
    ],
  },
  // Healer events
  {
    category: 'healer',
    templates: [
      'herb_gathering',
      'healing_success',
      'healing_failure',
      'medicine_discovery',
      'patient_care',
      'epidemic',
      'quarantine',
      'recovery_celebration',
      'herb_shortage',
      'treatment',
    ],
  },
  // Combat events
  {
    category: 'combat',
    templates: [
      'skirmish',
      'ambush',
      'defense',
      'victory',
      'defeat',
      'wound',
      'heroism',
      'cowardice',
      'strategy',
      'retreat',
    ],
  },
];

function generateEventId(category, template, index) {
  return `${category}_${template}_${index.toString().padStart(3, '0')}`;
}

function generateCondition(category) {
  const conditions = {
    hunting: {
      all: [
        { field: 'role', op: '==', value: 'hunter' },
        { field: 'stats.health', op: '>', value: 20 },
      ],
    },
    social: { all: [{ field: 'traits.sociability', op: '>', value: 4 }] },
    health: { all: [{ field: 'stats.health', op: '<', value: 80 }] },
    environment: { all: [{ field: 'age', op: '>', value: 0.5 }] },
    territory: {
      any: [{ field: 'role', op: 'in', value: ['alpha', 'beta', 'hunter'] }],
    },
    training: {
      all: [
        { field: 'role', op: '==', value: 'pup' },
        { field: 'age', op: '>', value: 0.3 },
      ],
    },
    prophecy: { all: [{ field: 'role', op: '==', value: 'healer' }] },
    lifecycle: { all: [{ field: 'age', op: '>', value: 0 }] },
    healer: { all: [{ field: 'role', op: '==', value: 'healer' }] },
    combat: {
      all: [
        { field: 'stats.health', op: '>', value: 30 },
        { field: 'traits.bravery', op: '>', value: 4 },
      ],
    },
  };

  return conditions[category] || { all: [{ field: 'age', op: '>', value: 0 }] };
}

function generateActions(category) {
  const actionSets = {
    hunting: [
      { type: 'modify_stat', target: 'wolf', stat: 'stats.health', delta: 5 },
      { type: 'log', text: '{wolf.name} completed a hunt.' },
    ],
    social: [
      { type: 'adjust_bond', withWolfIdField: 'target.id', delta: 3 },
      { type: 'log', text: '{wolf.name} had a social interaction.' },
    ],
    health: [
      { type: 'modify_stat', target: 'wolf', stat: 'stats.health', delta: -5 },
      { type: 'log', text: '{wolf.name} experienced a health event.' },
    ],
    environment: [
      { type: 'modify_stat', target: 'wolf', stat: 'stats.health', delta: -3 },
      {
        type: 'log',
        text: '{wolf.name} weathered an environmental challenge.',
      },
    ],
    territory: [{ type: 'log', text: '{wolf.name} patrolled the territory.' }],
    training: [
      { type: 'modify_stat', target: 'wolf', stat: 'xp', delta: 10 },
      { type: 'log', text: '{wolf.name} learned something new.' },
    ],
    prophecy: [
      { type: 'trigger_story', storyId: 'random_prophecy' },
      { type: 'log', text: '{wolf.name} received a vision.' },
    ],
    lifecycle: [
      { type: 'log', text: '{wolf.name} experienced a life milestone.' },
    ],
    healer: [
      { type: 'modify_stat', target: 'pack', stat: 'herbs', delta: 2 },
      { type: 'log', text: '{wolf.name} practiced healing arts.' },
    ],
    combat: [
      { type: 'modify_stat', target: 'wolf', stat: 'stats.health', delta: -10 },
      { type: 'log', text: '{wolf.name} fought bravely.' },
    ],
  };

  return (
    actionSets[category] || [
      { type: 'log', text: '{wolf.name} had an experience.' },
    ]
  );
}

function generateEvent(category, template, index) {
  const id = generateEventId(category, template, index);
  const title = template
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
  const text = `{wolf.name} ${template.replace(/_/g, ' ')}.`;

  return {
    id,
    title,
    text,
    condition: generateCondition(category),
    actions: generateActions(category),
    weight: Math.floor(Math.random() * 8) + 1,
    tags: [category],
    allowFallback: Math.random() > 0.7,
  };
}

function generateAllEvents() {
  const events = [];
  let eventIndex = 0;

  // Generate approximately 23 events per category (10 categories = 230 events)
  for (const pattern of eventPatterns) {
    const eventsPerTemplate = Math.ceil(23 / pattern.templates.length);

    for (const template of pattern.templates) {
      for (let i = 0; i < eventsPerTemplate && eventIndex < 230; i++) {
        events.push(generateEvent(pattern.category, template, eventIndex));
        eventIndex++;
      }
    }
  }

  return events.slice(0, 230); // Ensure exactly 230 events
}

// Generate and save events
function main() {
  console.log('Generating 230 event templates...');

  const events = generateAllEvents();
  const outputPath = join(__dirname, '../src/data/events_full.json');

  writeFileSync(outputPath, JSON.stringify(events, null, 2));

  console.log(`Generated ${events.length} events and saved to ${outputPath}`);
  console.log('Event categories:', [
    ...new Set(events.map((e) => e.tags?.[0])),
  ]);
}

main();
