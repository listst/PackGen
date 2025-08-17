import type { Wolf } from '../types/wolf';
import type { Pack } from '../types/pack';
import { isAlive, isPup, random, getWolfById } from '../types/utils';

export interface TrainingResult {
  wolfId: string;
  xpGained: number;
  mentorId?: string;
  mentorBonus: number;
  completed?: boolean;
  leveledUp?: boolean;
  statIncreased?: string;
}

export interface TrainingConfig {
  startAgeDays: number;
  durationDays: number;
  weeklyXpRange: { min: number; max: number };
  completionXpRange: { min: number; max: number };
  xpToLevel: number;
  maxStatValue: number;
}

export const DEFAULT_TRAINING_CONFIG: TrainingConfig = {
  startAgeDays: 40,
  durationDays: 40,
  weeklyXpRange: { min: 5, max: 15 },
  completionXpRange: { min: 20, max: 40 },
  xpToLevel: 100,
  maxStatValue: 10,
};

export class TrainingEngine {
  private config: TrainingConfig;

  constructor(config: TrainingConfig = DEFAULT_TRAINING_CONFIG) {
    this.config = config;
  }

  // Check if a wolf is eligible to start training
  canStartTraining(wolf: Wolf): boolean {
    const ageDays = wolf.age * 365;
    return (
      isPup(wolf) &&
      isAlive(wolf) &&
      ageDays >= this.config.startAgeDays &&
      !wolf.isTraining &&
      !wolf.trainingStartDay
    );
  }

  // Start training for a pup
  startTraining(wolf: Wolf, pack: Pack, mentorId?: string): boolean {
    if (!this.canStartTraining(wolf)) {
      return false;
    }

    // Find a mentor if not specified
    if (!mentorId) {
      const availableMentors = this.findAvailableMentors(pack);
      if (availableMentors.length > 0) {
        mentorId = random.choice(availableMentors).id;
      }
    }

    // Validate mentor
    if (mentorId && !this.isValidMentor(pack, mentorId)) {
      return false;
    }

    wolf.isTraining = true;
    wolf.trainingStartDay = pack.day;
    wolf.trainingMentorId = mentorId;

    const mentorName = mentorId
      ? (getWolfById(pack, mentorId)?.name ?? 'Unknown')
      : 'none';

    pack.logs.push(
      `Day ${pack.day}: ${wolf.name} started training` +
        (mentorId ? ` under ${mentorName}` : '') +
        '.'
    );

    return true;
  }

  // Process training for a specific wolf
  processWolfTraining(wolf: Wolf, pack: Pack): TrainingResult | null {
    if (!wolf.isTraining || !wolf.trainingStartDay) {
      return null;
    }

    const trainingDays = pack.day - wolf.trainingStartDay;
    const mentor = wolf.trainingMentorId
      ? getWolfById(pack, wolf.trainingMentorId)
      : null;

    // Check if training is complete
    if (trainingDays >= this.config.durationDays) {
      return this.completeTraining(wolf, pack, mentor);
    }

    // Weekly XP grants (every 7 days)
    if (trainingDays > 0 && trainingDays % 7 === 0) {
      return this.grantWeeklyXP(wolf, pack, mentor);
    }

    return null;
  }

  // Complete training for a wolf
  private completeTraining(
    wolf: Wolf,
    pack: Pack,
    mentor: Wolf | null
  ): TrainingResult {
    wolf.isTraining = false;

    const mentorBonus = this.calculateMentorBonus(mentor);
    const completionXP =
      random.nextInt(
        this.config.completionXpRange.min,
        this.config.completionXpRange.max
      ) + mentorBonus;

    const oldXP = wolf.xp ?? 0;
    wolf.xp = oldXP + completionXP;

    const levelResult = this.checkLevelUp(wolf);

    pack.logs.push(
      `Day ${pack.day}: ${wolf.name} completed training and gained ${completionXP} XP!`
    );

    return {
      wolfId: wolf.id,
      xpGained: completionXP,
      mentorId: mentor?.id,
      mentorBonus,
      completed: true,
      leveledUp: levelResult.leveledUp,
      statIncreased: levelResult.statIncreased,
    };
  }

  // Grant weekly training XP
  private grantWeeklyXP(
    wolf: Wolf,
    pack: Pack,
    mentor: Wolf | null
  ): TrainingResult {
    const mentorBonus = this.calculateMentorBonus(mentor);
    const weeklyXP =
      random.nextInt(
        this.config.weeklyXpRange.min,
        this.config.weeklyXpRange.max
      ) + mentorBonus;

    const oldXP = wolf.xp ?? 0;
    wolf.xp = oldXP + weeklyXP;

    const levelResult = this.checkLevelUp(wolf);

    return {
      wolfId: wolf.id,
      xpGained: weeklyXP,
      mentorId: mentor?.id,
      mentorBonus,
      completed: false,
      leveledUp: levelResult.leveledUp,
      statIncreased: levelResult.statIncreased,
    };
  }

  // Calculate mentor bonus
  private calculateMentorBonus(mentor: Wolf | null): number {
    if (!mentor || !isAlive(mentor)) {
      return 0;
    }

    return Math.floor(
      (mentor.traits.trainability + mentor.stats.intelligence) / 6
    );
  }

  // Check and process level up
  private checkLevelUp(wolf: Wolf): {
    leveledUp: boolean;
    statIncreased?: string;
  } {
    const currentXP = wolf.xp ?? 0;

    if (currentXP >= this.config.xpToLevel) {
      wolf.xp = currentXP - this.config.xpToLevel;
      wolf.level = (wolf.level ?? 0) + 1;

      // Auto-assign stat increase (could be player choice in UI)
      const statIncreased = this.autoAssignStatIncrease(wolf);

      return { leveledUp: true, statIncreased };
    }

    return { leveledUp: false };
  }

  // Automatically assign stat increase on level up
  private autoAssignStatIncrease(wolf: Wolf): string {
    const availableStats = [
      { name: 'strength', value: wolf.stats.strength },
      { name: 'speed', value: wolf.stats.speed },
      { name: 'intelligence', value: wolf.stats.intelligence },
    ].filter((stat) => stat.value < this.config.maxStatValue);

    if (availableStats.length === 0) {
      return 'none'; // All stats maxed
    }

    // Weighted selection based on wolf's traits
    const weights = availableStats.map((stat) => {
      switch (stat.name) {
        case 'strength':
          return wolf.traits.bravery + 1;
        case 'speed':
          return (wolf.traits.bravery + wolf.traits.sociability) / 2 + 1;
        case 'intelligence':
          return wolf.traits.trainability + 1;
        default:
          return 1;
      }
    });

    const selectedStat = random.weightedChoice(availableStats, weights);

    // Increase the selected stat
    switch (selectedStat.name) {
      case 'strength':
        wolf.stats.strength = Math.min(
          this.config.maxStatValue,
          wolf.stats.strength + 1
        );
        break;
      case 'speed':
        wolf.stats.speed = Math.min(
          this.config.maxStatValue,
          wolf.stats.speed + 1
        );
        break;
      case 'intelligence':
        wolf.stats.intelligence = Math.min(
          this.config.maxStatValue,
          wolf.stats.intelligence + 1
        );
        break;
    }

    return selectedStat.name;
  }

  // Find available mentors in the pack
  findAvailableMentors(pack: Pack): Wolf[] {
    return pack.wolves.filter((wolf) => this.isValidMentor(pack, wolf.id));
  }

  // Check if a wolf can be a mentor
  isValidMentor(pack: Pack, wolfId: string): boolean {
    const wolf = getWolfById(pack, wolfId);
    if (!wolf || !isAlive(wolf)) return false;

    // Mentors must be adults with appropriate roles
    const validRoles = ['beta', 'hunter', 'alpha'];
    if (!validRoles.includes(wolf.role)) return false;

    // Check age requirement
    if (wolf.age < 2.0) return false;

    // Check if already mentoring too many pups
    const currentMentees = pack.wolves.filter(
      (w) => w.isTraining && w.trainingMentorId === wolfId
    ).length;

    // Limit mentors to 2 pups each
    return currentMentees < 2;
  }

  // Grant XP for post-training activities
  grantActivityXP(
    wolf: Wolf,
    activity: 'patrol' | 'battle' | 'hunt',
    _pack: Pack // eslint-disable-line @typescript-eslint/no-unused-vars
  ): number {
    if (isPup(wolf) || !isAlive(wolf)) return 0;

    // Only trained wolves get activity XP
    if (wolf.isTraining || !wolf.trainingStartDay) return 0;

    let xpGained = 0;
    switch (activity) {
      case 'patrol':
        xpGained = 2;
        break;
      case 'battle':
        xpGained = 4;
        break;
      case 'hunt':
        xpGained = 3;
        break;
    }

    const oldXP = wolf.xp ?? 0;
    wolf.xp = oldXP + xpGained;

    // Check for level up
    this.checkLevelUp(wolf);

    return xpGained;
  }

  // Get training progress for a wolf
  getTrainingProgress(
    wolf: Wolf,
    currentDay: number
  ): {
    isTraining: boolean;
    daysRemaining: number;
    progress: number; // 0-1
    mentor?: string;
  } {
    if (!wolf.isTraining || !wolf.trainingStartDay) {
      return {
        isTraining: false,
        daysRemaining: 0,
        progress: 0,
      };
    }

    const trainingDays = currentDay - wolf.trainingStartDay;
    const progress = Math.min(1, trainingDays / this.config.durationDays);
    const daysRemaining = Math.max(0, this.config.durationDays - trainingDays);

    return {
      isTraining: true,
      daysRemaining,
      progress,
      mentor: wolf.trainingMentorId,
    };
  }

  // Process all training wolves in a pack
  processPackTraining(pack: Pack): TrainingResult[] {
    const results: TrainingResult[] = [];

    const trainingWolves = pack.wolves.filter((w) => w.isTraining);

    trainingWolves.forEach((wolf) => {
      const result = this.processWolfTraining(wolf, pack);
      if (result) {
        results.push(result);
      }
    });

    return results;
  }

  // Auto-start training for eligible pups
  autoStartTraining(pack: Pack): Wolf[] {
    const eligiblePups = pack.wolves.filter((w) => this.canStartTraining(w));
    const startedTraining: Wolf[] = [];

    eligiblePups.forEach((pup) => {
      if (this.startTraining(pup, pack)) {
        startedTraining.push(pup);
      }
    });

    return startedTraining;
  }
}

// Export singleton instance
export const trainingEngine = new TrainingEngine();
