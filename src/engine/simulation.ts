import type { Wolf } from '../types/wolf';
import type { Pack, GameConfig } from '../types/pack';
import type { EventResult } from '../types/event';
import {
  getCurrentSeason,
  isSpring,
  isAlive,
  isPup,
  isBreedingAge,
  random,
  getWolvesByRole,
  getAliveWolves,
} from '../types/utils';
import { eventEngine } from './eventEngine';

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
  seasonalModifiers: {
    spring: { birthWindow: true, huntSuccess: 1.0 },
    summer: { huntSuccess: 1.2 },
    autumn: { battleFrequency: 1.1 },
    winter: { huntSuccess: 0.8 },
  },
};

export class SimulationEngine {
  private config: GameConfig;

  constructor(config: GameConfig = DEFAULT_CONFIG) {
    this.config = config;
  }

  updateConfig(newConfig: Partial<GameConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Main simulation tick - advances one day
  simulateDay(pack: Pack): EventResult[] {
    // Update pack day and season
    pack.day += 1;
    pack.season = getCurrentSeason(pack.day, this.config.daysPerSeason);

    // Process aging and natural mortality
    this.processAging(pack);

    // Process pregnancies and births
    this.processPregnancies(pack);

    // Process training
    this.processTraining(pack);

    // Decay bonds
    this.decayBonds(pack);

    // Process natural healing
    this.processNaturalHealing(pack);

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

  private processPregnancies(pack: Pack): void {
    const pregnantWolves = pack.wolves.filter(
      (w) => isAlive(w) && w.pregnant && w.pregnancyDay !== undefined
    );

    pregnantWolves.forEach((wolf) => {
      const daysSincePregnancy = pack.day - (wolf.pregnancyDay ?? 0);

      if (daysSincePregnancy >= this.config.gestationDays) {
        // Time to give birth
        if (isSpring(pack.season)) {
          this.giveBirth(wolf, pack);
        }
        wolf.pregnant = false;
        delete wolf.pregnancyDay;
      }
    });

    // Spring mating season
    if (isSpring(pack.season)) {
      this.processMating(pack);
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

    for (let i = 0; i < litterSize; i++) {
      const pup = this.createPup(mother, father, pack);
      pack.wolves.push(pup);
    }

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

    return {
      id: `pup_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
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
    };
  }

  private processMating(pack: Pack): void {
    const femalesInHeat = pack.wolves.filter(
      (w) => isAlive(w) && w.sex === 'female' && isBreedingAge(w) && !w.pregnant
    );

    femalesInHeat.forEach((female) => {
      let pregnancyChance = 0.1; // base chance

      // Higher chance if mated
      if (female.mateId) {
        const mate = pack.wolves.find((w) => w.id === female.mateId);
        if (mate && isAlive(mate) && isBreedingAge(mate)) {
          pregnancyChance = 0.4; // 40% chance for mated pairs
        }
      } else {
        pregnancyChance = 0.15; // 15% chance for unmated
      }

      // Fertility modifier
      pregnancyChance *= female.traits.fertility / 10;

      if (random.next() < pregnancyChance) {
        female.pregnant = true;
        female.pregnancyDay = pack.day;
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
