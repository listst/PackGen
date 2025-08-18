import type { Wolf } from '../types/wolf';
import type { Pack, GameConfig } from '../types/pack';
import type { EventResult, EventTemplate } from '../types/event';
import { appearanceGenerator } from './appearance';
import {
  getCurrentSeason,
  isAlive,
  isPup,
  random,
  getWolvesByRole,
  getAliveWolves,
} from '../types/utils';
import { eventEngine } from './eventEngine';
import { MatingSystem } from './mating';
import { PatrolEngine } from './patrol';
import { CombatEngine } from './combat';
import { HealerEngine } from './healer';

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
  // Subsystem configurations
  combatSystem: {
    damageMultiplier: 5,
    highRiskThreshold: 20,
    highRiskDamageBonus: 10,
    rngVarianceRange: { min: -5, max: 5 },
    mortalityThreshold: 0,
    winnerDamageMultiplier: 0.5,
    maxDefenderMultiplier: 2,
    resourceTheftRange: { min: 1, max: 3 },
    lowHealthPenaltyThreshold: 30,
    lowHealthPenaltyMultiplier: 0.7,
  },
  healerSystem: {
    herbsPerTend: 1,
    healHpRange: { min: 15, max: 25 },
    baseSuccessRate: 0.9,
    intelligenceBonus: 0.01,
    failureHealerDamage: 2,
    failurePatientDamage: 5,
    maxTendsPerDay: 5,
    prophecyPowerThreshold: 5,
    crystalPoolVisitPower: 1,
    lowHealthRefusalThreshold: 20,
  },
  relationshipSystem: {
    stageRequirements: {
      acquainted: { minDays: 3, minBond: 10 },
      friends: { minDays: 7, minBond: 30 },
      attracted: { minDays: 14, minBond: 50 },
      courting: { minDays: 7, minBond: 70 },
      mates: { minDays: 14, minBond: 80 },
    },
    bondDecayInterval: 10,
    bondDecayAmount: 1,
    bondDecayMinimum: -100,
  },
  patrolTemplates: {
    huntingPatrol: {
      successWeight: 50,
      majorSuccessWeight: 15,
      failureWeight: 25,
      disasterWeight: 10,
      rewards: {
        success: { food: 3, xp: 10 },
        majorSuccess: { food: 6, xp: 20, reputation: 5 },
        failure: { food: 1 },
      },
    },
    borderPatrol: {
      successWeight: 60,
      majorSuccessWeight: 20,
      failureWeight: 15,
      disasterWeight: 5,
      rewards: {
        success: { reputation: 3, xp: 8 },
        majorSuccess: { reputation: 6, xp: 15 },
      },
    },
    trainingPatrol: {
      successWeight: 70,
      majorSuccessWeight: 20,
      failureWeight: 8,
      disasterWeight: 2,
      rewards: {
        success: { xp: 15 },
        majorSuccess: { xp: 25 },
      },
    },
    herbGathering: {
      successWeight: 55,
      majorSuccessWeight: 25,
      failureWeight: 15,
      disasterWeight: 5,
      rewards: {
        success: { herbs: 2, xp: 5 },
        majorSuccess: { herbs: 4, xp: 10 },
      },
    },
  },
  matingSystem: {
    courtshipDuration: 14, // minimum days before mating
    bondDecayRate: 0.2, // slower daily bond strength decay
    minBreedingBond: 80, // higher minimum bond strength to breed (mates stage)
    maxLittersPerYear: 1, // breeding limit per female
    breedingSeasonOnly: false, // allow year-round breeding with seasonal probabilities
    inbreedingPrevention: true, // prevent family member mating
    alphaApprovalRequired: false, // alpha must approve new pairs
    relationshipProgressionRate: 0.5, // slower relationship progression
    seasonalBreedingProbabilities: {
      spring: 0.6, // 60% chance in spring
      summer: 0.5, // 50% chance in summer
      autumn: 0.4, // 40% chance in fall
      winter: 0.3, // 30% chance in winter
    },
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
  decisionSystem: {
    moonEventFrequencyDays: 30, // moon event every 30 days
    decisionTimeoutDays: 7, // player has 7 days to decide
    approvalDecayRate: 0.1, // daily approval decay if below 50
    maxPendingDecisions: 3, // max 3 pending decisions at once
    consequenceDelayRange: { min: 7, max: 30 }, // consequences delayed 7-30 days
  },
};

export class SimulationEngine {
  private config: GameConfig;
  private matingSystem: MatingSystem;
  private patrolEngine: PatrolEngine;
  private combatEngine: CombatEngine;
  private healerEngine: HealerEngine;

  constructor(config: GameConfig = DEFAULT_CONFIG) {
    this.config = config;
    this.matingSystem = new MatingSystem(config);
    this.patrolEngine = new PatrolEngine(config);
    this.combatEngine = new CombatEngine(config);
    this.healerEngine = new HealerEngine(config);
    // Initialize appearance generator with config
    appearanceGenerator.setConfig();
  }

  updateConfig(newConfig: Partial<GameConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.matingSystem = new MatingSystem(this.config);
    this.patrolEngine.updateConfig(this.config);
    this.combatEngine.updateConfig(this.config);
    appearanceGenerator.setConfig();
    this.healerEngine.updateConfig(this.config);
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

    // Process decision system
    this.processDecisionSystem(pack);

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
        // Allow births in any season
        this.giveBirth(wolf, pack);
        wolf.pregnant = false;
        delete wolf.pregnancyDay;
      }
    });

    // Process breeding year-round with seasonal probabilities
    this.processBreeding(pack);
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
      appearance: appearanceGenerator.inheritAppearance(
        mother,
        father || undefined
      ),
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

      // Breeding chance based on bond strength, fertility, and season
      const bondModifier = pair.bondStrength / 100; // 0-1 multiplier
      const fertilityModifier =
        (female.traits.fertility + male.traits.fertility) / 20; // 0-1 multiplier

      // Get seasonal breeding probability
      const seasonalProbability =
        this.config.matingSystem.seasonalBreedingProbabilities[pack.season];

      const pregnancyChance =
        seasonalProbability * bondModifier * fertilityModifier;

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
    // Bond decay based on configuration
    if (pack.day % this.config.relationshipSystem.bondDecayInterval === 0) {
      pack.wolves.forEach((wolf) => {
        if (wolf.bonds) {
          Object.keys(wolf.bonds).forEach((otherId) => {
            const bondValue = wolf.bonds![otherId];
            if (typeof bondValue === 'number') {
              wolf.bonds![otherId] = Math.max(
                this.config.relationshipSystem.bondDecayMinimum,
                bondValue - this.config.relationshipSystem.bondDecayAmount
              );
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
    // Check for alpha and beta deaths before cleanup
    const deadWolves = pack.wolves.filter((wolf) => wolf._dead);

    deadWolves.forEach((deadWolf) => {
      if (deadWolf.role === 'alpha') {
        this.handleAlphaDeath(pack, deadWolf);
      } else if (deadWolf.role === 'beta') {
        this.handleBetaDeath(pack, deadWolf);
      }
    });

    // Remove dead wolves from pack
    pack.wolves = pack.wolves.filter((wolf) => !wolf._dead);
  }

  private handleAlphaDeath(pack: Pack, deadAlpha: Wolf): void {
    pack.logs.push(
      `Day ${pack.day}: Alpha ${deadAlpha.name} has died. The pack mourns their leader.`
    );

    // Find beta to promote to alpha
    const beta = getAliveWolves(pack).find((w) => w.role === 'beta');

    if (beta) {
      beta.role = 'alpha';
      pack.logs.push(
        `Day ${pack.day}: Beta ${beta.name} has become the new alpha.`
      );

      // Trigger beta succession event
      this.triggerBetaSuccessionEvent(pack);
    } else {
      // No beta available - pack crisis
      pack.logs.push(
        `Day ${pack.day}: With no beta to succeed, the pack faces a leadership crisis!`
      );
      // Could add pack dissolution or emergency alpha election here
    }
  }

  private handleBetaDeath(pack: Pack, deadBeta: Wolf): void {
    pack.logs.push(`Day ${pack.day}: Beta ${deadBeta.name} has died.`);

    // Trigger beta succession event if there's still an alpha
    const alpha = getAliveWolves(pack).find((w) => w.role === 'alpha');
    if (alpha) {
      this.triggerBetaSuccessionEvent(pack);
    }
  }

  private triggerBetaSuccessionEvent(pack: Pack): void {
    // Check if we already have a beta succession event pending
    const hasPendingSuccession = pack.pendingDecisions?.some(
      (decision) => decision.id === 'beta_succession'
    );

    if (
      !hasPendingSuccession &&
      pack.pendingDecisions &&
      pack.pendingDecisions.length < 3
    ) {
      // Create beta succession event
      const successionEvent = eventEngine.createSuccessionEvent(pack);
      if (successionEvent) {
        pack.pendingDecisions.push(successionEvent);
        pack.logs.push(
          `Day ${pack.day}: The alpha must choose a new beta for the pack.`
        );
      }
    }
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

  private processDecisionSystem(pack: Pack): void {
    // Initialize decision system fields if needed
    if (!pack.pendingDecisions) pack.pendingDecisions = [];
    if (!pack.decisionHistory) pack.decisionHistory = [];
    if (!pack.scheduledConsequences) pack.scheduledConsequences = [];
    if (pack.packApproval === undefined) pack.packApproval = 50;
    if (!pack.lastMoonEventDay) pack.lastMoonEventDay = 0;

    // Process scheduled consequences
    const consequenceResults = eventEngine.processScheduledConsequences(pack);
    consequenceResults.forEach((result) => {
      pack.logs.push(`Day ${pack.day}: ${result.text}`);
    });

    // Auto-resolve timed out decisions
    const timedOutResults = eventEngine.autoResolveTimedOutDecisions(pack);
    timedOutResults.forEach((result) => {
      pack.logs.push(`Day ${pack.day}: Auto-resolved - ${result.text}`);
    });

    // Check for moon events
    const moonEvent = eventEngine.checkForMoonEvent(pack);
    if (
      moonEvent &&
      pack.pendingDecisions.length <
        this.config.decisionSystem.maxPendingDecisions
    ) {
      // Find candidate wolves for this moon event
      const tempTemplate: EventTemplate = {
        id: moonEvent.id,
        text: moonEvent.text,
        condition: moonEvent.condition,
        actions: [], // MoonEvents don't have actions, only choices do
        title: moonEvent.title,
        weight: moonEvent.weight,
        tags: moonEvent.tags,
        allowFallback: moonEvent.allowFallback,
      };
      const candidates = eventEngine.findCandidateWolves(tempTemplate, pack);
      if (candidates.length > 0) {
        const selectedWolf = random.choice(candidates);
        let targetWolf: Wolf | undefined;

        // Select target wolf if needed
        const needsTarget = moonEvent.choices.some((choice) =>
          choice.actions.some(
            (action) =>
              action.type === 'adjust_bond' ||
              (action.type === 'modify_stat' && action.target === 'target')
          )
        );

        if (needsTarget) {
          const potentialTargets = pack.wolves.filter(
            (w) => isAlive(w) && w.id !== selectedWolf.id
          );
          if (potentialTargets.length > 0) {
            targetWolf = random.choice(potentialTargets);
          }
        }

        // Create the decision event
        eventEngine.createDecisionEvent(
          moonEvent,
          selectedWolf,
          pack,
          targetWolf
        );
        pack.lastMoonEventDay = pack.day;

        pack.logs.push(
          `Day ${pack.day}: A moon event has occurred - ${moonEvent.title || 'A decision awaits'}!`
        );
      }
    }

    // Process pack approval decay
    if (pack.packApproval < 50) {
      pack.packApproval = Math.max(
        0,
        pack.packApproval - this.config.decisionSystem.approvalDecayRate
      );
    }
  }

  // Public methods for engine access
  getPatrolEngine(): PatrolEngine {
    return this.patrolEngine;
  }

  getCombatEngine(): CombatEngine {
    return this.combatEngine;
  }

  getHealerEngine(): HealerEngine {
    return this.healerEngine;
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
