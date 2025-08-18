import type {
  Wolf,
  MatingPair,
  Relationship,
  RelationshipStage,
} from '../types/wolf';
import type { Pack, GameConfig } from '../types/pack';
import {
  isAlive,
  isBreedingAge,
  getAliveWolves,
  random,
  generateId,
} from '../types/utils';

export interface CompatibilityScore {
  total: number;
  factors: {
    ageDifference: number;
    traitCompatibility: number;
    existingBond: number;
    roleCompatibility: number;
    familyRelation: number;
  };
}

export class MatingSystem {
  private config: GameConfig;

  // Relationship stage thresholds and requirements are now in config

  constructor(config: GameConfig) {
    this.config = config;
  }

  // Relationship management methods
  getRelationship(wolf1: Wolf, wolf2: Wolf): Relationship {
    if (!wolf1.relationships) wolf1.relationships = {};

    if (!wolf1.relationships[wolf2.id]) {
      wolf1.relationships[wolf2.id] = {
        stage: 'strangers',
        daysMet: 0,
        daysSinceStageChange: 0,
        bond: 0,
      };
    }

    return wolf1.relationships[wolf2.id]!;
  }

  setRelationship(wolf1: Wolf, wolf2: Wolf, relationship: Relationship): void {
    if (!wolf1.relationships) wolf1.relationships = {};
    if (!wolf2.relationships) wolf2.relationships = {};

    wolf1.relationships[wolf2.id] = relationship;

    // Mirror the relationship (with same values)
    wolf2.relationships[wolf1.id] = {
      ...relationship,
    };
  }

  canProgressToStage(
    relationship: Relationship,
    targetStage: RelationshipStage
  ): boolean {
    const currentStageIndex = this.getStageIndex(relationship.stage);
    const targetStageIndex = this.getStageIndex(targetStage);

    // Can only progress to next stage
    if (targetStageIndex !== currentStageIndex + 1) return false;

    if (targetStage === 'strangers') return true; // Can always become strangers

    const requirements = this.config.relationshipSystem.stageRequirements[
      targetStage as keyof typeof this.config.relationshipSystem.stageRequirements
    ];
    if (!requirements) return false;

    return (
      relationship.daysSinceStageChange >= requirements.minDays &&
      relationship.bond >= requirements.minBond
    );
  }

  private getStageIndex(stage: RelationshipStage): number {
    const stages: RelationshipStage[] = [
      'strangers',
      'acquainted',
      'friends',
      'attracted',
      'courting',
      'mates',
    ];
    return stages.indexOf(stage);
  }

  progressRelationship(wolf1: Wolf, wolf2: Wolf, pack: Pack): boolean {
    const relationship = this.getRelationship(wolf1, wolf2);
    const nextStage = this.getNextStage(relationship.stage);

    if (!nextStage || !this.canProgressToStage(relationship, nextStage)) {
      return false;
    }

    relationship.stage = nextStage;
    relationship.daysSinceStageChange = 0;

    this.setRelationship(wolf1, wolf2, relationship);

    // Log significant progressions
    if (
      nextStage === 'friends' ||
      nextStage === 'attracted' ||
      nextStage === 'mates'
    ) {
      pack.logs.push(
        `Day ${pack.day}: ${wolf1.name} and ${wolf2.name} have become ${nextStage}.`
      );
    }

    // Form mating pair when reaching 'mates' stage
    if (nextStage === 'mates') {
      this.formPairFromRelationship(wolf1, wolf2, pack);
    }

    return true;
  }

  private getNextStage(
    currentStage: RelationshipStage
  ): RelationshipStage | null {
    const stages: RelationshipStage[] = [
      'strangers',
      'acquainted',
      'friends',
      'attracted',
      'courting',
      'mates',
    ];
    const currentIndex = stages.indexOf(currentStage);
    return currentIndex < stages.length - 1 ? stages[currentIndex + 1]! : null;
  }

  processRelationships(pack: Pack): void {
    const aliveWolves = getAliveWolves(pack);

    // Update relationship durations for all wolves
    aliveWolves.forEach((wolf) => {
      if (!wolf.relationships) return;

      Object.keys(wolf.relationships).forEach((otherId) => {
        const other = pack.wolves.find((w) => w.id === otherId);
        if (!other || !isAlive(other)) {
          // Remove relationships with dead/missing wolves
          delete wolf.relationships![otherId];
          return;
        }

        const relationship = wolf.relationships![otherId];
        if (relationship) {
          relationship.daysMet++;
          relationship.daysSinceStageChange++;

          // Try to progress relationship if conditions are met
          if (relationship.stage !== 'mates') {
            this.progressRelationship(wolf, other, pack);
          }
        }
      });
    });
  }

  buildDailyBonds(pack: Pack): void {
    const aliveWolves = getAliveWolves(pack);

    // Random daily interactions between pack members
    for (let i = 0; i < Math.min(5, aliveWolves.length); i++) {
      if (aliveWolves.length < 2) break;

      const wolf1 = random.choice(aliveWolves);
      const wolf2 = random.choice(aliveWolves.filter((w) => w.id !== wolf1.id));

      if (!wolf1 || !wolf2) continue;

      // Skip if wolves are too different in age (adults don't bond romantically with pups)
      if ((wolf1.role === 'pup') !== (wolf2.role === 'pup')) continue;

      const relationship = this.getRelationship(wolf1, wolf2);

      // Small daily bond increase based on compatibility and progression rate
      const compatibility = this.calculateCompatibility(wolf1, wolf2);
      const baseBondIncrease = Math.max(0.5, compatibility.total / 30);
      const bondIncrease =
        baseBondIncrease * this.config.matingSystem.relationshipProgressionRate;

      relationship.bond = Math.min(100, relationship.bond + bondIncrease);
      this.setRelationship(wolf1, wolf2, relationship);

      // Small chance of logging interaction
      if (random.next() < 0.1) {
        pack.logs.push(
          `Day ${pack.day}: ${wolf1.name} and ${wolf2.name} spent time together.`
        );
      }
    }
  }

  calculateCompatibility(male: Wolf, female: Wolf): CompatibilityScore {
    const factors = {
      ageDifference: this.calculateAgeFactor(male, female),
      traitCompatibility: this.calculateTraitCompatibility(male, female),
      existingBond: this.calculateBondFactor(male, female),
      roleCompatibility: this.calculateRoleCompatibility(male, female),
      familyRelation: this.calculateFamilyFactor(male, female),
    };

    const total = Object.values(factors).reduce(
      (sum, factor) => sum + factor,
      0
    );

    return { total, factors };
  }

  private calculateAgeFactor(male: Wolf, female: Wolf): number {
    const ageDiff = Math.abs(male.age - female.age);
    if (ageDiff > 3) return -20; // large age gap penalty
    if (ageDiff > 1.5) return -10; // moderate age gap penalty
    return 10; // similar age bonus
  }

  private calculateTraitCompatibility(male: Wolf, female: Wolf): number {
    const traits = ['bravery', 'sociability', 'trainability'] as const;
    let compatibility = 0;

    traits.forEach((trait) => {
      const diff = Math.abs(male.traits[trait] - female.traits[trait]);
      if (diff <= 2)
        compatibility += 10; // similar traits
      else if (diff <= 4)
        compatibility += 5; // somewhat compatible
      else compatibility -= 5; // very different traits
    });

    return compatibility;
  }

  private calculateBondFactor(male: Wolf, female: Wolf): number {
    const existingBond = male.bonds?.[female.id] || 0;
    if (existingBond > 50) return 20;
    if (existingBond > 20) return 10;
    if (existingBond < -20) return -30;
    return 0;
  }

  private calculateRoleCompatibility(male: Wolf, female: Wolf): number {
    // Alphas can mate with anyone
    if (male.role === 'alpha' || female.role === 'alpha') return 10;

    // Similar roles have some compatibility
    if (male.role === female.role) return 5;

    // Betas are generally compatible with all
    if (male.role === 'beta' || female.role === 'beta') return 5;

    return 0;
  }

  private calculateFamilyFactor(male: Wolf, female: Wolf): number {
    if (!this.config.matingSystem.inbreedingPrevention) return 0;

    // Check if they're family members
    if (this.areRelated(male, female)) {
      return -100; // Prevent inbreeding completely
    }

    return 0;
  }

  private areRelated(wolf1: Wolf, wolf2: Wolf): boolean {
    if (!wolf1.familyTree || !wolf2.familyTree) return false;

    // Check if they share parents
    const wolf1Parents = wolf1.familyTree.parentIds;
    const wolf2Parents = wolf2.familyTree.parentIds;

    if (wolf1Parents.some((parentId) => wolf2Parents.includes(parentId))) {
      return true; // Siblings
    }

    // Check if one is parent of the other
    if (
      wolf1.familyTree.offspringIds.includes(wolf2.id) ||
      wolf2.familyTree.offspringIds.includes(wolf1.id)
    ) {
      return true; // Parent-child
    }

    return false;
  }

  canFormPair(male: Wolf, female: Wolf, pack: Pack): boolean {
    if (!isAlive(male) || !isAlive(female)) return false;
    if (male.sex !== 'male' || female.sex !== 'female') return false;
    if (!isBreedingAge(male) || !isBreedingAge(female)) return false;

    // Check if either is already in a pair
    if (this.isInPair(male, pack) || this.isInPair(female, pack)) return false;

    // Check compatibility
    const compatibility = this.calculateCompatibility(male, female);
    if (compatibility.total < 0) return false;

    // Check alpha approval if required
    if (this.config.matingSystem.alphaApprovalRequired) {
      return this.hasAlphaApproval(male, female, pack);
    }

    return true;
  }

  private isInPair(wolf: Wolf, pack: Pack): boolean {
    return pack.matingPairs.some(
      (pair) => pair.maleId === wolf.id || pair.femaleId === wolf.id
    );
  }

  private hasAlphaApproval(male: Wolf, female: Wolf, pack: Pack): boolean {
    // If either wolf is an alpha, approval is automatic
    if (male.role === 'alpha' || female.role === 'alpha') return true;

    // Simple approval based on pack alphas' bonds with the wolves
    const alphas = getAliveWolves(pack).filter((w) => w.role === 'alpha');
    if (alphas.length === 0) return true; // No alphas, automatic approval

    const avgApproval =
      alphas.reduce((sum, alpha) => {
        const maleBond = alpha.bonds?.[male.id] || 0;
        const femaleBond = alpha.bonds?.[female.id] || 0;
        return sum + (maleBond + femaleBond) / 2;
      }, 0) / alphas.length;

    return avgApproval > -20; // Approval if not strongly disliked
  }

  formPairFromRelationship(
    wolf1: Wolf,
    wolf2: Wolf,
    pack: Pack
  ): MatingPair | null {
    // Determine male and female (for breeding purposes)
    const male = wolf1.sex === 'male' ? wolf1 : wolf2;
    const female = wolf1.sex === 'female' ? wolf1 : wolf2;

    if (male.sex === female.sex) return null; // Same-sex pairs not supported for breeding

    if (!this.canFormPair(male, female, pack)) return null;

    const relationship = this.getRelationship(wolf1, wolf2);
    const initialBondStrength = Math.min(100, relationship.bond);

    const pair: MatingPair = {
      id: generateId('pair_'),
      maleId: male.id,
      femaleId: female.id,
      bondedDay: pack.day,
      bondStrength: initialBondStrength,
      courtshipEvents: [],
    };

    // Update wolves' mate IDs for backward compatibility
    male.mateId = female.id;
    female.mateId = male.id;

    // Update legacy bonds system
    if (!male.bonds) male.bonds = {};
    if (!female.bonds) female.bonds = {};
    male.bonds[female.id] = relationship.bond;
    female.bonds[male.id] = relationship.bond;

    pack.matingPairs.push(pair);

    return pair;
  }

  formPair(male: Wolf, female: Wolf, pack: Pack): MatingPair | null {
    // Legacy method - now creates relationship progression first
    const relationship = this.getRelationship(male, female);

    // Fast-track to mates stage if using legacy method
    relationship.stage = 'mates';
    relationship.bond = 80;
    relationship.daysSinceStageChange = 0;
    this.setRelationship(male, female, relationship);

    return this.formPairFromRelationship(male, female, pack);
  }

  processCourtship(pack: Pack): void {
    // Only process courtship weekly and during spring
    if (!this.isSpring(pack.season) || pack.day % 7 !== 0) return;

    const aliveWolves = getAliveWolves(pack);

    // Look for wolves ready for courtship (attracted stage)
    aliveWolves.forEach((wolf) => {
      if (!wolf.relationships || this.isInPair(wolf, pack)) return;

      Object.keys(wolf.relationships).forEach((otherId) => {
        const other = pack.wolves.find((w) => w.id === otherId);
        if (!other || !isAlive(other) || this.isInPair(other, pack)) return;

        const relationship = wolf.relationships![otherId];

        // Only attempt courtship if they're attracted and compatible sexes
        if (
          relationship &&
          relationship.stage === 'attracted' &&
          wolf.sex !== other.sex &&
          isBreedingAge(wolf) &&
          isBreedingAge(other)
        ) {
          this.attemptCourtship(wolf, other, pack);
        }
      });
    });
  }

  private attemptCourtship(wolf1: Wolf, wolf2: Wolf, pack: Pack): void {
    const relationship = this.getRelationship(wolf1, wolf2);

    // Must be in attracted stage to attempt courtship
    if (relationship.stage !== 'attracted') return;

    const compatibility = this.calculateCompatibility(wolf1, wolf2);

    // Lower courtship success rate - 30% base chance
    const courtshipChance = Math.max(
      0.15,
      Math.min(0.4, (compatibility.total + 30) / 100)
    );

    if (random.next() < courtshipChance) {
      // Successful courtship - progress to courting stage
      relationship.stage = 'courting';
      relationship.daysSinceStageChange = 0;
      relationship.bond = Math.min(100, relationship.bond + 10);

      this.setRelationship(wolf1, wolf2, relationship);

      pack.logs.push(
        `Day ${pack.day}: ${wolf1.name} and ${wolf2.name} begin courting.`
      );
    } else {
      // Failed courtship - small bond penalty but stay attracted
      relationship.bond = Math.max(30, relationship.bond - 5);
      this.setRelationship(wolf1, wolf2, relationship);

      if (random.next() < 0.3) {
        pack.logs.push(
          `Day ${pack.day}: ${wolf1.name} attempted to court ${wolf2.name}, but was gently declined.`
        );
      }
    }
  }

  processPairBonds(pack: Pack): void {
    pack.matingPairs.forEach((pair) => {
      const male = pack.wolves.find((w) => w.id === pair.maleId);
      const female = pack.wolves.find((w) => w.id === pair.femaleId);

      if (!male || !female || !isAlive(male) || !isAlive(female)) {
        this.dissolvePair(pair, pack, 'death');
        return;
      }

      // Apply bond decay
      const decayRate = this.getSeasonalBondDecay(pack.season);
      pair.bondStrength = Math.max(0, pair.bondStrength - decayRate);

      // Dissolve weak pairs
      if (pair.bondStrength < 20) {
        this.dissolvePair(pair, pack, 'weakened bond');
        return;
      }

      // Strengthen bonds for long-term pairs
      const daysTogether = pack.day - pair.bondedDay;
      if (daysTogether > 40 && daysTogether % 10 === 0) {
        pair.bondStrength = Math.min(100, pair.bondStrength + 2);
      }
    });

    // Remove dissolved pairs
    pack.matingPairs = pack.matingPairs.filter(
      (pair) =>
        pack.wolves.some((w) => w.id === pair.maleId) &&
        pack.wolves.some((w) => w.id === pair.femaleId)
    );
  }

  private getSeasonalBondDecay(season: Pack['season']): number {
    const baseDecay = this.config.matingSystem.bondDecayRate;

    // Get the correct seasonal modifier
    let modifier = 1;
    if (season === 'spring') {
      modifier = 0.5; // Slower decay in spring
    } else if (season === 'summer') {
      modifier = this.config.seasonalModifiers[season]?.bondDecay || 1;
    } else if (season === 'autumn') {
      modifier = this.config.seasonalModifiers[season]?.bondDecay || 1;
    } else if (season === 'winter') {
      modifier = this.config.seasonalModifiers[season]?.bondDecay || 1;
    }

    return baseDecay * modifier;
  }

  private dissolvePair(pair: MatingPair, pack: Pack, reason: string): void {
    const male = pack.wolves.find((w) => w.id === pair.maleId);
    const female = pack.wolves.find((w) => w.id === pair.femaleId);

    if (male) male.mateId = null;
    if (female) female.mateId = null;

    if (reason !== 'death' && male && female) {
      pack.logs.push(
        `Day ${pack.day}: ${male.name} and ${female.name} are no longer mates (${reason}).`
      );
    }

    // Remove from mating pairs array
    const index = pack.matingPairs.findIndex((p) => p.id === pair.id);
    if (index >= 0) {
      pack.matingPairs.splice(index, 1);
    }
  }

  private isSpring(season: Pack['season']): boolean {
    return season === 'spring';
  }

  getMatingPair(wolf: Wolf, pack: Pack): MatingPair | null {
    return (
      pack.matingPairs.find(
        (pair) => pair.maleId === wolf.id || pair.femaleId === wolf.id
      ) || null
    );
  }

  canBreed(female: Wolf, pack: Pack): boolean {
    if (!isAlive(female) || female.sex !== 'female' || !isBreedingAge(female)) {
      return false;
    }

    if (female.pregnant) return false;

    // Check breeding season restriction (now disabled for year-round breeding)
    if (
      this.config.matingSystem.breedingSeasonOnly &&
      !this.isSpring(pack.season)
    ) {
      return false;
    }

    // Check breeding history
    const currentYear = Math.floor(pack.day / (this.config.daysPerSeason * 4));
    if (female.breedingHistory?.lastLitterYear === currentYear) {
      return false; // Already bred this year
    }

    // Must have a mate
    const pair = this.getMatingPair(female, pack);
    if (!pair) return false;

    // Check bond strength
    if (pair.bondStrength < this.config.matingSystem.minBreedingBond) {
      return false;
    }

    return true;
  }
}
