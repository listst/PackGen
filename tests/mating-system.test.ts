import { MatingSystem } from '../src/engine/mating';
import { simulationEngine, DEFAULT_CONFIG } from '../src/engine/simulation';
import type { Wolf } from '../src/types/wolf';
import type { Pack } from '../src/types/pack';

// Test helper to create a basic wolf
function createTestWolf(
  id: string,
  name: string,
  sex: 'male' | 'female',
  age: number = 2
): Wolf {
  return {
    id,
    name,
    sex,
    age,
    role: 'omega',
    appearance: {
      furColor: 'grey',
      pattern: 'solid',
      eyeColor: 'brown',
      scars: [],
    },
    stats: {
      health: 80,
      strength: 5,
      speed: 5,
      intelligence: 5,
    },
    traits: {
      bravery: 5,
      sociability: 5,
      trainability: 5,
      fertility: 7,
    },
    bonds: {},
    breedingHistory: { totalLitters: 0 },
    familyTree: { parentIds: [], siblingIds: [], offspringIds: [] },
  };
}

// Test helper to create a basic pack
function createTestPack(): Pack {
  return {
    name: 'Test Pack',
    day: 1,
    season: 'spring',
    wolves: [],
    matingPairs: [],
    herbs: 5,
    logs: [],
    eventHistory: [],
    prophecies: [],
    storyEvents: [],
    prophecyPower: 0,
  };
}

describe('Gradual Relationship System', () => {
  let matingSystem: MatingSystem;
  let pack: Pack;

  beforeEach(() => {
    matingSystem = new MatingSystem(DEFAULT_CONFIG);
    pack = createTestPack();
  });

  test('should allow compatible wolves to form pairs', () => {
    const male = createTestWolf('male1', 'Alpha', 'male');
    const female = createTestWolf('female1', 'Beta', 'female');

    pack.wolves = [male, female];

    const canForm = matingSystem.canFormPair(male, female, pack);
    expect(canForm).toBe(true);

    matingSystem.formPair(male, female, pack);
    expect(pair).not.toBeNull();
    expect(pack.matingPairs).toHaveLength(1);
    expect(male.mateId).toBe(female.id);
    expect(female.mateId).toBe(male.id);
  });

  test('should prevent inbreeding', () => {
    const father = createTestWolf('father', 'Father', 'male');
    const daughter = createTestWolf('daughter', 'Daughter', 'female');

    // Set up family relationship
    father.familyTree!.offspringIds = [daughter.id];
    daughter.familyTree!.parentIds = [father.id];

    pack.wolves = [father, daughter];

    const compatibility = matingSystem.calculateCompatibility(
      father,
      daughter,
      pack
    );
    expect(compatibility.factors.familyRelation).toBe(-100);

    const canForm = matingSystem.canFormPair(father, daughter, pack);
    expect(canForm).toBe(false);
  });

  test('should only allow breeding in spring', () => {
    const female = createTestWolf('female1', 'Mother', 'female');
    const male = createTestWolf('male1', 'Father', 'male');

    pack.wolves = [male, female];
    matingSystem.formPair(male, female, pack);

    // Test spring season
    pack.season = 'spring';
    expect(matingSystem.canBreed(female, pack)).toBe(true);

    // Test other seasons
    pack.season = 'summer';
    expect(matingSystem.canBreed(female, pack)).toBe(false);

    pack.season = 'autumn';
    expect(matingSystem.canBreed(female, pack)).toBe(false);

    pack.season = 'winter';
    expect(matingSystem.canBreed(female, pack)).toBe(false);
  });

  test('should enforce one litter per year rule', () => {
    const female = createTestWolf('female1', 'Mother', 'female');
    const male = createTestWolf('male1', 'Father', 'male');

    pack.wolves = [male, female];
    pack.season = 'spring';

    matingSystem.formPair(male, female, pack);

    // Simulate breeding this year
    const currentYear = Math.floor(
      pack.day / (DEFAULT_CONFIG.daysPerSeason * 4)
    );
    female.breedingHistory!.lastLitterYear = currentYear;

    expect(matingSystem.canBreed(female, pack)).toBe(false);
  });

  test('should require minimum bond strength for breeding', () => {
    const female = createTestWolf('female1', 'Mother', 'female');
    const male = createTestWolf('male1', 'Father', 'male');

    pack.wolves = [male, female];
    pack.season = 'spring';

    matingSystem.formPair(male, female, pack);

    // Set bond strength below minimum (minimum is now 80 for mates stage)
    pack.matingPairs[0]!.bondStrength = 60; // Below minimum of 80

    expect(matingSystem.canBreed(female, pack)).toBe(false);

    // Set bond strength above minimum
    pack.matingPairs[0]!.bondStrength = 85;

    expect(matingSystem.canBreed(female, pack)).toBe(true);
  });

  test('should start relationships as strangers', () => {
    const wolf1 = createTestWolf('wolf1', 'Test1', 'male');
    const wolf2 = createTestWolf('wolf2', 'Test2', 'female');

    const relationship = matingSystem.getRelationship(wolf1, wolf2);

    expect(relationship.stage).toBe('strangers');
    expect(relationship.daysMet).toBe(0);
    expect(relationship.bond).toBe(0);
  });

  test('should gradually progress relationships through stages', () => {
    const wolf1 = createTestWolf('wolf1', 'Test1', 'male');
    const wolf2 = createTestWolf('wolf2', 'Test2', 'female');
    pack.wolves = [wolf1, wolf2];

    // Start relationship
    let relationship = matingSystem.getRelationship(wolf1, wolf2);
    expect(relationship.stage).toBe('strangers');

    // Simulate daily bonding to build up relationship
    relationship.bond = 15; // Enough to progress to acquainted
    relationship.daysSinceStageChange = 5; // Enough days
    matingSystem.setRelationship(wolf1, wolf2, relationship);

    // Try to progress
    const progressed = matingSystem.progressRelationship(wolf1, wolf2, pack);
    expect(progressed).toBe(true);

    relationship = matingSystem.getRelationship(wolf1, wolf2);
    expect(relationship.stage).toBe('acquainted');
  });

  test('should require time and bond strength for stage progression', () => {
    const wolf1 = createTestWolf('wolf1', 'Test1', 'male');
    const wolf2 = createTestWolf('wolf2', 'Test2', 'female');
    pack.wolves = [wolf1, wolf2];

    const relationship = matingSystem.getRelationship(wolf1, wolf2);

    // Try to progress without enough bond or time
    relationship.bond = 5; // Too low
    relationship.daysSinceStageChange = 1; // Too few days

    const progressed = matingSystem.progressRelationship(wolf1, wolf2, pack);
    expect(progressed).toBe(false);
    expect(relationship.stage).toBe('strangers');
  });

  test('should only allow courtship for attracted wolves', () => {
    const wolf1 = createTestWolf('wolf1', 'Test1', 'male', 2);
    const wolf2 = createTestWolf('wolf2', 'Test2', 'female', 2);
    pack.wolves = [wolf1, wolf2];
    pack.season = 'spring';
    pack.day = 7; // Make it a courtship day (weekly)

    // Set up relationship in friends stage (not yet attracted)
    const relationship = matingSystem.getRelationship(wolf1, wolf2);
    relationship.stage = 'friends';
    relationship.bond = 40;
    matingSystem.setRelationship(wolf1, wolf2, relationship);

    // Process courtship - should not advance to courting
    matingSystem.processCourtship(pack);

    const updatedRelationship = matingSystem.getRelationship(wolf1, wolf2);
    expect(updatedRelationship.stage).toBe('friends'); // Should still be friends
  });
});

describe('Simulation Engine Integration', () => {
  test('should properly initialize family trees for pups', () => {
    const pack = createTestPack();
    const mother = createTestWolf('mother', 'Mother', 'female');
    const father = createTestWolf('father', 'Father', 'male');

    pack.wolves = [mother, father];
    pack.season = 'spring';

    // Make mother pregnant
    mother.pregnant = true;
    mother.pregnancyDay = pack.day - DEFAULT_CONFIG.gestationDays;
    mother.mateId = father.id;

    // Simulate a day to trigger birth
    simulationEngine.simulateDay(pack);

    // Check that pups were born and have proper family trees
    const pups = pack.wolves.filter((w) => w.role === 'pup');
    expect(pups.length).toBeGreaterThan(0);

    pups.forEach((pup) => {
      expect(pup.familyTree).toBeDefined();
      expect(pup.familyTree!.parentIds).toContain(mother.id);
      expect(pup.familyTree!.parentIds).toContain(father.id);
      expect(pup.breedingHistory).toBeDefined();
    });

    // Check that mother's breeding history was updated
    expect(mother.breedingHistory!.totalLitters).toBe(1);
    expect(mother.breedingHistory!.lastLitterYear).toBeDefined();
  });

  test('should prevent births outside of spring', () => {
    const pack = createTestPack();
    const mother = createTestWolf('mother', 'Mother', 'female');

    pack.wolves = [mother];
    pack.day = 80; // Set to middle of summer (day 80 = summer)
    pack.season = 'summer'; // Not spring

    // Make mother pregnant
    mother.pregnant = true;
    mother.pregnancyDay = pack.day - DEFAULT_CONFIG.gestationDays;

    const initialWolfCount = pack.wolves.length;

    // Simulate a day
    simulationEngine.simulateDay(pack);

    // Should not have given birth (miscarriage)
    expect(pack.wolves.length).toBe(initialWolfCount);
    expect(mother.pregnant).toBe(false);
    expect(pack.logs.some((log) => log.includes('lost her litter'))).toBe(true);
  });
});
