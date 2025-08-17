import type { Wolf } from '../types/wolf';
import type { Pack, GameConfig } from '../types/pack';
import type { EventResult } from '../types/event';
import {
  getCurrentSeason,
  isSpring,
  isAlive,
  isPup,
  random,
  getWolvesByRole,
  getAliveWolves,
} from '../types/utils';
import { eventEngine } from './eventEngine';
import { MatingSystem } from './mating';
import { PatrolEngine } from './patrol';

// Default game configuration
export const DEFAULT_CONFIG: GameConfig = {
  daysPerSeason: 40,
  eventsPerDay: { min: 2, max: 4 },
  gestationDays: 14,
  trainingStartAge: 40, // days
  trainingDuration: 40, // days
  maxLifespan: { min: 12, max: 14 },
  xpToLevel: 100,
  healerHerbsPerTend: 1,
  healHpRange: { min: 15, max: 25 },
  healerBaseSuccessRate: 0.9,
  matingSystem: {
    courtshipDuration: 14, // minimum days before mating
    bondDecayRate: 0.2, // slower daily bond strength decay
    minBreedingBond: 80, // higher minimum bond strength to breed (mates stage)
    maxLittersPerYear: 1, // breeding limit per female
    breedingSeasonOnly: true, // spring-only breeding
    inbreedingPrevention: true, // prevent family member mating
    alphaApprovalRequired: false, // alpha must approve new pairs
    relationshipProgressionRate: 0.5, // slower relationship progression
  },
  seasonalModifiers: {
    spring: { birthWindow: true, huntSuccess: 1.0, courtshipBonus: 1.5 },
    summer: { huntSuccess: 1.2, bondDecay: 1.0 },
    autumn: { battleFrequency: 1.1, bondDecay: 1.2 },
    winter: { huntSuccess: 0.8, bondDecay: 1.5 },
  },
  patrolSystem: {
    minHuntingPatrolsPerMonth: 2,
    minBorderPatrolsPerMonth: 1,
    maxPatrolsPerWolfPerMonth: 3,
    patrolCooldownDays: 3,
    baseSuccessRate: 0.7,
    reputationImpact: 0.3,
  },
};

export class SimulationEngine {
  private config: GameConfig;
  private matingSystem: MatingSystem;
  private patrolEngine: PatrolEngine;

  constructor(config: GameConfig = DEFAULT_CONFIG) {
    this.config = config;
    this.matingSystem = new MatingSystem(config);
    this.patrolEngine = new PatrolEngine(config);
  }

  updateConfig(newConfig: Partial<GameConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.matingSystem = new MatingSystem(this.config);
    this.patrolEngine.updateConfig(this.config);
  }

  // Main simulation tick - advances one day
  simulateDay(pack: Pack): EventResult[] {
    // Update pack day and season
    pack.day += 1;
    pack.season = getCurrentSeason(pack.day, this.config.daysPerSeason);

    // Process aging and natural mortality
    this.processAging(pack);

    // Process mating system (courtship and pair bonds)
    this.processMatingSystem(pack);

    // Process pregnancies and births
    this.processPregnancies(pack);

    // Process training
    this.processTraining(pack);

    // Decay bonds
    this.decayBonds(pack);

    // Process natural healing
    this.processNaturalHealing(pack);

    // Process scheduled patrols
    this.processPatrols(pack);

    // Run daily events
    const eventCount = random.nextInt(
      this.config.eventsPerDay.min,
      this.config.eventsPerDay.max
    );
    const eventResults = eventEngine.runDailyEvents(pack, eventCount);

    // Clean up dead wolves (remove from pack after events)
    this.cleanupDeadWolves(pack);

    return eventResults;
  }

  private processAging(pack: Pack): void {
    const aliveWolves = getAliveWolves(pack);

    aliveWolves.forEach((wolf) => {
      wolf.age += 1 / 365; // age in days

      // Set max lifespan if not set
      if (!wolf.maxLifespan) {
        wolf.maxLifespan = random.nextFloat(
          this.config.maxLifespan.min,
          this.config.maxLifespan.max
        );
      }

      // Natural mortality
      if (wolf.age > 10) {
        const mortalityChance = Math.min(0.1, (wolf.age - 10) * 0.02);
        if (random.next() < mortalityChance) {
          wolf._dead = true;
          pack.logs.push(`Day ${pack.day}: ${wolf.name} died of old age.`);
        }
      }

      // Age-based role transitions
      if (wolf.age >= 1.5 && wolf.role === 'pup') {
        // Pup becomes adult
        wolf.role = 'omega'; // default adult role
        pack.logs.push(`Day ${pack.day}: ${wolf.name} has reached adulthood.`);
      }

      if (wolf.age >= 10 && wolf.role !== 'elder' && wolf.role !== 'alpha') {
        // Adult becomes elder
        wolf.role = 'elder';
        pack.logs.push(`Day ${pack.day}: ${wolf.name} has become an elder.`);
      }
    });
  }

  private processMatingSystem(pack: Pack): void {
    // Process relationship progression and daily bonding
    this.matingSystem.processRelationships(pack);
    this.matingSystem.buildDailyBonds(pack);

    // Process pair bond maintenance and dissolution
    this.matingSystem.processPairBonds(pack);

    // Process courtship attempts (weekly during spring)
    this.matingSystem.processCourtship(pack);
  }

  private processPregnancies(pack: Pack): void {
    const pregnantWolves = pack.wolves.filter(
      (w) => isAlive(w) && w.pregnant && w.pregnancyDay !== undefined
    );

    pregnantWolves.forEach((wolf) => {
      const daysSincePregnancy = pack.day - (wolf.pregnancyDay ?? 0);

      if (daysSincePregnancy >= this.config.gestationDays) {
        // Only give birth in spring (enforced restriction)
        if (isSpring(pack.season)) {
          this.giveBirth(wolf, pack);
        } else {
          // Miscarriage if not in spring season (enforces spring-only births)
          pack.logs.push(
            `Day ${pack.day}: ${wolf.name} lost her litter due to harsh conditions.`
          );
        }
        wolf.pregnant = false;
        delete wolf.pregnancyDay;
      }
    });

    // New mating system - only process breeding in spring
    if (isSpring(pack.season)) {
      this.processBreeding(pack);
    }
  }

  private giveBirth(mother: Wolf, pack: Pack): void {
    // Determine litter size: 1:20%, 2:50%, 3:20%, 4:10%
    const litterSizes = [1, 2, 3, 4];
    const litterWeights = [20, 50, 20, 10];
    const litterSize = random.weightedChoice(litterSizes, litterWeights);

    // Get father for genetics
    const father = mother.mateId
      ? (pack.wolves.find((w) => w.id === mother.mateId) ?? null)
      : null;

    const litterIds: string[] = [];

    for (let i = 0; i < litterSize; i++) {
      const pup = this.createPup(mother, father, pack);
      pack.wolves.push(pup);
      litterIds.push(pup.id);
    }

    // Update breeding history
    const currentYear = Math.floor(pack.day / (this.config.daysPerSeason * 4));
    if (!mother.breedingHistory) {
      mother.breedingHistory = { totalLitters: 0 };
    }
    mother.breedingHistory.lastLitterYear = currentYear;
    mother.breedingHistory.totalLitters += 1;
    mother.breedingHistory.litterId = (
      mother.breedingHistory.litterId || []
    ).concat(litterIds);

    // Update family trees for all pups in the litter
    litterIds.forEach((pupId) => {
      const pup = pack.wolves.find((w) => w.id === pupId);
      if (pup && pup.familyTree) {
        pup.familyTree.siblingIds = litterIds.filter((id) => id !== pupId);
      }
    });

    pack.logs.push(
      `Day ${pack.day}: ${mother.name} gave birth to ${litterSize} pups!`
    );
  }

  private createPup(
    mother: Wolf,
    father: Wolf | null,
    _pack: Pack // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Wolf {
    // Simple genetics: average parents' traits with ±1 mutation
    const avgStat = (motherVal: number, fatherVal: number) => {
      const avg = father ? (motherVal + fatherVal) / 2 : motherVal;
      const mutation = random.nextFloat(-1, 1);
      return Math.max(0, Math.min(10, avg + mutation));
    };

    const fatherStats = father?.stats ?? mother.stats;
    const fatherTraits = father?.traits ?? mother.traits;

    const pupId = `pup_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Initialize family tree
    const parentIds = [mother.id];
    if (father) parentIds.push(father.id);

    // Update parent family trees
    if (!mother.familyTree) {
      mother.familyTree = { parentIds: [], siblingIds: [], offspringIds: [] };
    }
    mother.familyTree.offspringIds.push(pupId);

    if (father) {
      if (!father.familyTree) {
        father.familyTree = { parentIds: [], siblingIds: [], offspringIds: [] };
      }
      father.familyTree.offspringIds.push(pupId);
    }

    return {
      id: pupId,
      name: this.generatePupName(),
      sex: random.choice(['male', 'female']),
      age: 0,
      role: 'pup',
      appearance: {
        furColor: random.choice([
          mother.appearance.furColor,
          father?.appearance.furColor ?? 'brown',
        ]),
        pattern: random.choice([
          mother.appearance.pattern,
          father?.appearance.pattern ?? 'solid',
        ]),
        eyeColor: random.choice([
          mother.appearance.eyeColor,
          father?.appearance.eyeColor ?? 'brown',
        ]),
        scars: [],
      },
      stats: {
        health: Math.max(
          50,
          Math.min(80, (mother.stats.health + fatherStats.health) / 2)
        ),
        strength: avgStat(mother.stats.strength, fatherStats.strength),
        speed: avgStat(mother.stats.speed, fatherStats.speed),
        intelligence: avgStat(
          mother.stats.intelligence,
          fatherStats.intelligence
        ),
      },
      traits: {
        bravery: avgStat(mother.traits.bravery, fatherTraits.bravery),
        sociability: avgStat(
          mother.traits.sociability,
          fatherTraits.sociability
        ),
        trainability: avgStat(
          mother.traits.trainability,
          fatherTraits.trainability
        ),
        fertility: 0, // pups don't have fertility yet
      },
      xp: 0,
      level: 0,
      bonds: {},
      breedingHistory: { totalLitters: 0 },
      familyTree: {
        parentIds,
        siblingIds: [], // Will be filled in by giveBirth method
        offspringIds: [],
      },
    };
  }

  private processBreeding(pack: Pack): void {
    // Only process breeding for established mating pairs
    pack.matingPairs.forEach((pair) => {
      const female = pack.wolves.find((w) => w.id === pair.femaleId);
      const male = pack.wolves.find((w) => w.id === pair.maleId);

      if (!female || !male || !isAlive(female) || !isAlive(male)) {
        return;
      }

      // Use new breeding restrictions from mating system
      if (!this.matingSystem.canBreed(female, pack)) {
        return;
      }

      // Breeding chance based on bond strength and fertility
      const bondModifier = pair.bondStrength / 100; // 0-1 multiplier
      const fertilityModifier =
        (female.traits.fertility + male.traits.fertility) / 20; // 0-1 multiplier
      const baseChance = 0.3; // 30% base chance per season

      const pregnancyChance = baseChance * bondModifier * fertilityModifier;

      if (random.next() < pregnancyChance) {
        female.pregnant = true;
        female.pregnancyDay = pack.day;

        // Update pair's breeding season
        const currentYear = Math.floor(
          pack.day / (this.config.daysPerSeason * 4)
        );
        pair.lastBreedingSeason = currentYear;

        pack.logs.push(`Day ${pack.day}: ${female.name} has become pregnant.`);
      }
    });
  }

  private processTraining(pack: Pack): void {
    const pups = pack.wolves.filter(
      (w) =>
        isAlive(w) && isPup(w) && w.age >= this.config.trainingStartAge / 365
    );

    pups.forEach((pup) => {
      if (!pup.isTraining && !pup.trainingStartDay) {
        // Start training
        pup.isTraining = true;
        pup.trainingStartDay = pack.day;

        // Assign mentor (beta or hunter)
        const potentialMentors = pack.wolves.filter(
          (w) =>
            isAlive(w) &&
            (w.role === 'beta' || w.role === 'hunter') &&
            w.id !== pup.id
        );

        if (potentialMentors.length > 0) {
          pup.trainingMentorId = random.choice(potentialMentors).id;
        }

        pack.logs.push(`Day ${pack.day}: ${pup.name} has started training.`);
      }

      if (pup.isTraining && pup.trainingStartDay) {
        const trainingDays = pack.day - pup.trainingStartDay;

        if (trainingDays >= this.config.trainingDuration) {
          // Complete training
          this.completeTraining(pup, pack);
        } else {
          // Daily training XP
          this.grantTrainingXP(pup, pack);
        }
      }
    });
  }

  private completeTraining(pup: Wolf, pack: Pack): void {
    pup.isTraining = false;

    // Grant completion bonus XP
    const mentor = pup.trainingMentorId
      ? pack.wolves.find((w) => w.id === pup.trainingMentorId)
      : null;

    const mentorBonus = mentor
      ? Math.floor((mentor.traits.trainability + mentor.stats.intelligence) / 6)
      : 0;

    const completionXP = random.nextInt(20, 40) + mentorBonus;
    pup.xp = (pup.xp ?? 0) + completionXP;

    pack.logs.push(
      `Day ${pack.day}: ${pup.name} completed training and gained ${completionXP} XP!`
    );

    // Check for level up
    this.checkLevelUp(pup);
  }

  private grantTrainingXP(pup: Wolf, pack: Pack): void {
    // Weekly XP grants (every 7 days)
    const trainingDays = pack.day - (pup.trainingStartDay ?? 0);
    if (trainingDays % 7 === 0) {
      const mentor = pup.trainingMentorId
        ? (pack.wolves.find((w) => w.id === pup.trainingMentorId) ?? null)
        : null;

      const mentorBonus = mentor
        ? Math.floor(
            (mentor.traits.trainability + mentor.stats.intelligence) / 6
          )
        : 0;

      const weeklyXP = random.nextInt(5, 15) + mentorBonus;
      pup.xp = (pup.xp ?? 0) + weeklyXP;

      this.checkLevelUp(pup);
    }
  }

  private checkLevelUp(wolf: Wolf): void {
    if ((wolf.xp ?? 0) >= this.config.xpToLevel) {
      wolf.xp = (wolf.xp ?? 0) - this.config.xpToLevel;
      wolf.level = (wolf.level ?? 0) + 1;

      // Auto-assign stat point for now (could be player choice)
      const stats = ['strength', 'speed', 'intelligence'];
      const randomStat = random.choice(stats) as keyof Wolf['stats'];
      wolf.stats[randomStat] = Math.min(10, wolf.stats[randomStat] + 1);

      // Log level up but don't auto-generate log to avoid spam
    }
  }

  private decayBonds(pack: Pack): void {
    // Every 10 days, bonds decay by 1
    if (pack.day % 10 === 0) {
      pack.wolves.forEach((wolf) => {
        if (wolf.bonds) {
          Object.keys(wolf.bonds).forEach((otherId) => {
            const bondValue = wolf.bonds![otherId];
            if (typeof bondValue === 'number') {
              wolf.bonds![otherId] = Math.max(-100, bondValue - 1);
            }
          });
        }
      });
    }
  }

  private processNaturalHealing(pack: Pack): void {
    // Very slow natural healing
    const aliveWolves = getAliveWolves(pack);
    aliveWolves.forEach((wolf) => {
      if (wolf.stats.health < 100 && !wolf.isSick) {
        // 1 HP every 5 days if not sick
        if (pack.day % 5 === 0) {
          wolf.stats.health = Math.min(100, wolf.stats.health + 1);
        }
      }
    });
  }

  private cleanupDeadWolves(pack: Pack): void {
    // Remove dead wolves from pack
    pack.wolves = pack.wolves.filter((wolf) => !wolf._dead);
  }

  private generatePupName(): string {
    const pupNames = [
      'Spark',
      'Dash',
      'Pip',
      'Fern',
      'Cliff',
      'Vale',
      'Brook',
      'Wren',
      'Fox',
      'Bear',
      'Jay',
      'Sage',
      'Reed',
      'Dusk',
      'Dawn',
      'Cloud',
    ];
    return random.choice(pupNames);
  }

  // Utility methods for external use
  getPackStats(pack: Pack) {
    const alive = getAliveWolves(pack);
    const alphas = getWolvesByRole(pack, 'alpha');
    const healers = getWolvesByRole(pack, 'healer');
    const pups = getWolvesByRole(pack, 'pup');

    return {
      totalWolves: alive.length,
      alphas: alphas.length,
      healers: healers.length,
      pups: pups.length,
      averageHealth:
        alive.reduce((sum, w) => sum + w.stats.health, 0) / alive.length,
      season: pack.season,
      day: pack.day,
    };
  }

  private processPatrols(pack: Pack): void {
    // Initialize patrol state if needed
    if (!pack.assignedPatrols) pack.assignedPatrols = [];
    if (!pack.patrolHistory) pack.patrolHistory = [];
    if (pack.patrolReputation === undefined) pack.patrolReputation = 50;
    if (pack.food === undefined) pack.food = 5;

    // Process scheduled patrols
    const patrolResults = this.patrolEngine.processScheduledPatrols(pack);

    // Log patrol results
    patrolResults.forEach((result) => {
      pack.logs.push(
        `Day ${pack.day}: Patrol returned - ${result.description}`
      );
    });
  }

  // Public methods for patrol management
  getPatrolEngine(): PatrolEngine {
    return this.patrolEngine;
  }

  simulateMultipleDays(pack: Pack, days: number): EventResult[] {
    const allResults: EventResult[] = [];

    for (let i = 0; i < days; i++) {
      const dayResults = this.simulateDay(pack);
      allResults.push(...dayResults);
    }

    return allResults;
  }
}

// Export singleton instance
export const simulationEngine = new SimulationEngine();
