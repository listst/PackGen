import type { Wolf } from '../types/wolf';
import type { Pack, GameConfig } from '../types/pack';
import type { Prophecy } from '../types/event';
import { isAlive, getWolvesByRole, random, generateId } from '../types/utils';

export interface HealingResult {
  healerId: string;
  patientId: string;
  success: boolean;
  hpHealed: number;
  herbsUsed: number;
  healerDamage?: number;
  patientDamage?: number;
}

export interface ProphecyResult {
  prophecyId: string;
  text: string;
  targetWolfId?: string;
  objectives: string[];
}

export class HealerEngine {
  private config: GameConfig;
  private dailyTends: Map<string, number> = new Map();

  constructor(config: GameConfig) {
    this.config = config;
  }

  updateConfig(newConfig: GameConfig): void {
    this.config = newConfig;
  }

  // Check if a healer can tend to patients
  canHealerTend(healer: Wolf, pack: Pack): boolean {
    if (!isAlive(healer) || healer.role !== 'healer') {
      return false;
    }

    // Check if healer has enough health
    if (healer.stats.health <= this.config.healerSystem.lowHealthRefusalThreshold) {
      return false;
    }

    // Check daily tend limit
    const dailyTends = this.dailyTends.get(healer.id) ?? 0;
    if (dailyTends >= this.config.healerSystem.maxTendsPerDay) {
      return false;
    }

    // Check if pack has herbs
    return pack.herbs >= this.config.healerSystem.herbsPerTend;
  }

  // Get wolves that need healing
  getWolvesNeedingHealing(pack: Pack): Wolf[] {
    return pack.wolves
      .filter(
        (wolf) => isAlive(wolf) && (wolf.stats.health < 80 || wolf.isSick)
      )
      .sort((a, b) => a.stats.health - b.stats.health); // Lowest health first
  }

  // Heal a specific wolf
  healWolf(healer: Wolf, patient: Wolf, pack: Pack): HealingResult {
    if (!this.canHealerTend(healer, pack)) {
      throw new Error('Healer cannot tend right now');
    }

    // Calculate success rate
    const successRate = Math.min(
      0.99,
      this.config.healerSystem.baseSuccessRate +
        healer.stats.intelligence * this.config.healerSystem.intelligenceBonus
    );

    const success = random.next() < successRate;

    // Use herbs
    pack.herbs -= this.config.healerSystem.herbsPerTend;

    // Track daily tends
    const currentTends = this.dailyTends.get(healer.id) ?? 0;
    this.dailyTends.set(healer.id, currentTends + 1);

    let hpHealed = 0;
    let healerDamage = 0;
    let patientDamage = 0;

    if (success) {
      // Successful healing
      hpHealed = random.nextInt(
        this.config.healerSystem.healHpRange.min,
        this.config.healerSystem.healHpRange.max
      );

      patient.stats.health = Math.min(100, patient.stats.health + hpHealed);

      // Remove sickness
      if (patient.isSick) {
        patient.isSick = false;
      }

      pack.logs.push(
        `Day ${pack.day}: ${healer.name} successfully healed ${patient.name} (+${hpHealed} HP).`
      );
    } else {
      // Failed healing
      healerDamage = this.config.healerSystem.failureHealerDamage;
      patientDamage = this.config.healerSystem.failurePatientDamage;

      healer.stats.health = Math.max(0, healer.stats.health - healerDamage);
      patient.stats.health = Math.max(0, patient.stats.health - patientDamage);

      pack.logs.push(
        `Day ${pack.day}: ${healer.name}'s healing of ${patient.name} failed. Both wolves were injured.`
      );
    }

    const result: HealingResult = {
      healerId: healer.id,
      patientId: patient.id,
      success,
      hpHealed,
      herbsUsed: this.config.healerSystem.herbsPerTend,
    };

    if (healerDamage > 0) {
      result.healerDamage = healerDamage;
    }
    if (patientDamage > 0) {
      result.patientDamage = patientDamage;
    }

    return result;
  }

  // Auto-heal the most injured wolves
  autoHeal(healer: Wolf, pack: Pack, maxHeals?: number): HealingResult[] {
    const results: HealingResult[] = [];
    const wolvesNeedingHealing = this.getWolvesNeedingHealing(pack);
    const healLimit =
      maxHeals ??
      Math.min(
        this.config.healerSystem.maxTendsPerDay,
        Math.floor(pack.herbs / this.config.healerSystem.herbsPerTend),
        wolvesNeedingHealing.length
      );

    for (let i = 0; i < healLimit && this.canHealerTend(healer, pack); i++) {
      const patient = wolvesNeedingHealing[i];
      if (patient && patient.id !== healer.id) {
        try {
          const result = this.healWolf(healer, patient, pack);
          results.push(result);
        } catch {
          break; // Stop if healing fails
        }
      }
    }

    return results;
  }

  // Process all healers in the pack
  processPackHealing(pack: Pack): HealingResult[] {
    const healers = getWolvesByRole(pack, 'healer');
    const allResults: HealingResult[] = [];

    healers.forEach((healer) => {
      if (this.canHealerTend(healer, pack)) {
        const results = this.autoHeal(healer, pack, 2); // Limit 2 heals per healer per day
        allResults.push(...results);
      }
    });

    return allResults;
  }

  // Visit Crystal Pool to generate prophecies
  visitCrystalPool(healer: Wolf, pack: Pack): ProphecyResult | null {
    if (!isAlive(healer) || healer.role !== 'healer') {
      return null;
    }

    // Increase prophecy power
    pack.prophecyPower += this.config.healerSystem.crystalPoolVisitPower;

    // Check if powerful enough to generate prophecy
    if (pack.prophecyPower >= this.config.healerSystem.prophecyPowerThreshold) {
      return this.generateProphecy(healer, pack);
    }

    pack.logs.push(
      `Day ${pack.day}: ${healer.name} visited the Crystal Pool and felt its power grow.`
    );

    return null;
  }

  // Generate a new prophecy
  private generateProphecy(healer: Wolf, pack: Pack): ProphecyResult {
    const prophecyTemplates = [
      {
        text: 'A wolf of great speed will rise to lead the hunt...',
        objectives: ['speed >= 8'],
        type: 'speed_prophecy',
      },
      {
        text: 'The wise one shall guide the pack through dark times...',
        objectives: ['intelligence >= 8'],
        type: 'wisdom_prophecy',
      },
      {
        text: "A warrior's strength will protect the young...",
        objectives: ['strength >= 8'],
        type: 'strength_prophecy',
      },
      {
        text: 'The bond between two souls will save the pack...',
        objectives: ['bonds[targetId] >= 80'],
        type: 'bond_prophecy',
      },
      {
        text: 'A new generation will bring hope to the territory...',
        objectives: ['pack.wolves.length >= 12'],
        type: 'growth_prophecy',
      },
    ];

    const template = random.choice(prophecyTemplates);
    const prophecyId = generateId('prophecy_');

    // Select a target wolf for personal prophecies
    const eligibleWolves = pack.wolves.filter(
      (w) => isAlive(w) && w.age >= 1.0 && w.role !== 'elder'
    );
    const targetWolf =
      eligibleWolves.length > 0 ? random.choice(eligibleWolves) : undefined;

    const prophecy: Prophecy = {
      id: prophecyId,
      text: template.text,
      objectives: [], // Will be properly structured condition groups
      progress: 0,
      unlocked: true,
      completed: false,
      storyEvents: [],
    };

    if (targetWolf) {
      prophecy.targetWolfId = targetWolf.id;
    }

    pack.prophecies.push(prophecy);

    // Consume prophecy power
    pack.prophecyPower = Math.max(
      0,
      pack.prophecyPower - this.config.healerSystem.prophecyPowerThreshold
    );

    pack.logs.push(
      `Day ${pack.day}: ${healer.name} received a prophecy at the Crystal Pool: "${template.text}"`
    );

    const result: ProphecyResult = {
      prophecyId,
      text: template.text,
      objectives: template.objectives,
    };

    if (targetWolf) {
      result.targetWolfId = targetWolf.id;
    }

    return result;
  }

  // Check prophecy progress
  checkProphecyProgress(pack: Pack): void {
    pack.prophecies.forEach((prophecy) => {
      if (prophecy.completed || !prophecy.unlocked) return;

      // Simple prophecy checking (would be more complex with full condition system)
      let completed = false;
      const targetWolf = prophecy.targetWolfId
        ? pack.wolves.find((w) => w.id === prophecy.targetWolfId)
        : null;

      // Check basic stat prophecies
      if (targetWolf && isAlive(targetWolf)) {
        if (prophecy.text.includes('speed') && targetWolf.stats.speed >= 8) {
          completed = true;
        } else if (
          prophecy.text.includes('wise') &&
          targetWolf.stats.intelligence >= 8
        ) {
          completed = true;
        } else if (
          prophecy.text.includes('strength') &&
          targetWolf.stats.strength >= 8
        ) {
          completed = true;
        }
      }

      // Check pack size prophecies
      if (prophecy.text.includes('new generation')) {
        const aliveWolves = pack.wolves.filter(isAlive);
        if (aliveWolves.length >= 12) {
          completed = true;
        }
      }

      if (completed && !prophecy.completed) {
        prophecy.completed = true;
        prophecy.progress = 1.0;

        pack.logs.push(
          `Day ${pack.day}: A prophecy has been fulfilled! The Crystal Pool shimmers with approval.`
        );

        // Grant rewards for completed prophecy
        this.grantProphecyReward(prophecy, pack);
      }
    });
  }

  // Grant rewards for completed prophecies
  private grantProphecyReward(prophecy: Prophecy, pack: Pack): void {
    // Increase pack-wide benefits
    pack.herbs += 3; // Bonus herbs

    // Boost target wolf if applicable
    if (prophecy.targetWolfId) {
      const targetWolf = pack.wolves.find(
        (w) => w.id === prophecy.targetWolfId
      );
      if (targetWolf && isAlive(targetWolf)) {
        targetWolf.stats.health = Math.min(100, targetWolf.stats.health + 20);
        targetWolf.xp = (targetWolf.xp ?? 0) + 50;
      }
    }
  }

  // Reset daily tends (call this each new day)
  resetDailyTends(): void {
    this.dailyTends.clear();
  }

  // Get healer status
  getHealerStatus(
    healer: Wolf,
    pack: Pack
  ): {
    canHeal: boolean;
    remainingTends: number;
    totalPatients: number;
    prophecyPower: number;
    canProphecy: boolean;
  } {
    const dailyTends = this.dailyTends.get(healer.id) ?? 0;
    const remainingTends = Math.max(0, this.config.healerSystem.maxTendsPerDay - dailyTends);
    const patientsNeedingHealing = this.getWolvesNeedingHealing(pack);

    return {
      canHeal: this.canHealerTend(healer, pack),
      remainingTends,
      totalPatients: patientsNeedingHealing.length,
      prophecyPower: pack.prophecyPower,
      canProphecy: pack.prophecyPower >= this.config.healerSystem.prophecyPowerThreshold,
    };
  }

  // Gather herbs (special healer activity)
  gatherHerbs(healer: Wolf, pack: Pack): number {
    if (!isAlive(healer) || healer.role !== 'healer') {
      return 0;
    }

    // Base herbs plus intelligence bonus
    const herbsGathered =
      random.nextInt(1, 3) + Math.floor(healer.stats.intelligence / 3);

    pack.herbs += herbsGathered;

    pack.logs.push(
      `Day ${pack.day}: ${healer.name} gathered ${herbsGathered} herbs.`
    );

    return herbsGathered;
  }

  // Process healer sickness recovery
  processSicknessRecovery(pack: Pack): void {
    const sickWolves = pack.wolves.filter((w) => isAlive(w) && w.isSick);

    sickWolves.forEach((wolf) => {
      // 67% chance to recover naturally
      if (random.next() < 0.67) {
        wolf.isSick = false;
        pack.logs.push(`Day ${pack.day}: ${wolf.name} recovered from illness.`);
      } else {
        // Gradual health loss if not healed
        wolf.stats.health = Math.max(1, wolf.stats.health - 5);
        if (wolf.stats.health <= 10) {
          pack.logs.push(
            `Day ${pack.day}: ${wolf.name} is seriously ill and needs immediate attention.`
          );
        }
      }
    });
  }
}

// Note: Singleton instance created in simulation.ts with proper config
// The healer engine is now managed by the simulation engine
// Use simulationEngine.getHealerEngine() to access the healer functionality
