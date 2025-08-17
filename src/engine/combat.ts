import type { Wolf } from '../types/wolf';
import type { Pack } from '../types/pack';
import type { BattleResult } from '../types/territory';
import { getCombatScore, isAlive, random } from '../types/utils';

export interface CombatOptions {
  rngSeeded?: boolean;
  damageMultiplier?: number;
  highRiskThreshold?: number;
  highRiskDamageBonus?: number;
}

export interface CombatResult {
  winner: 'attacker' | 'defender';
  attackerScore: number;
  defenderScore: number;
  scoreDifference: number;
  loserDamage: number;
  casualties: string[];
  attackerCasualties: string[];
  defenderCasualties: string[];
}

export class CombatEngine {
  resolveCombat(
    attackers: Wolf[],
    defenders: Wolf[],
    options: CombatOptions = {}
  ): CombatResult {
    const {
      damageMultiplier = 5,
      highRiskThreshold = 20,
      highRiskDamageBonus = 10,
    } = options;

    // Calculate combat scores with RNG
    const attackerScores = attackers.map((wolf) => {
      const baseScore = getCombatScore(wolf);
      const rngModifier = random.nextFloat(-5, 5);
      return baseScore + rngModifier;
    });

    const defenderScores = defenders.map((wolf) => {
      const baseScore = getCombatScore(wolf);
      const rngModifier = random.nextFloat(-5, 5);
      return baseScore + rngModifier;
    });

    const totalAttackerScore = attackerScores.reduce(
      (sum, score) => sum + score,
      0
    );
    const totalDefenderScore = defenderScores.reduce(
      (sum, score) => sum + score,
      0
    );

    const scoreDifference = Math.abs(totalAttackerScore - totalDefenderScore);
    const winner =
      totalAttackerScore > totalDefenderScore ? 'attacker' : 'defender';

    // Calculate damage
    const baseDamage = Math.round(scoreDifference * damageMultiplier);
    const losingWolves = winner === 'attacker' ? defenders : attackers;

    // Apply damage to losing side
    const casualties: string[] = [];
    const attackerCasualties: string[] = [];
    const defenderCasualties: string[] = [];

    this.applyBattleDamage(
      losingWolves,
      baseDamage,
      highRiskThreshold,
      highRiskDamageBonus,
      casualties
    );

    // Assign casualties to the correct side
    if (winner === 'attacker') {
      defenderCasualties.push(...casualties);
    } else {
      attackerCasualties.push(...casualties);
    }

    return {
      winner,
      attackerScore: totalAttackerScore,
      defenderScore: totalDefenderScore,
      scoreDifference,
      loserDamage: baseDamage,
      casualties,
      attackerCasualties,
      defenderCasualties,
    };
  }

  private applyBattleDamage(
    wolves: Wolf[],
    totalDamage: number,
    highRiskThreshold: number,
    highRiskDamageBonus: number,
    casualties: string[]
  ): void {
    if (wolves.length === 0 || totalDamage <= 0) return;

    // Distribute damage among wolves
    const damagePerWolf = Math.floor(totalDamage / wolves.length);
    let remainingDamage = totalDamage % wolves.length;

    wolves.forEach((wolf) => {
      if (!isAlive(wolf)) return;

      let damage = damagePerWolf;

      // Add remaining damage randomly
      if (remainingDamage > 0) {
        damage += 1;
        remainingDamage--;
      }

      // High risk wolves take extra damage
      if (wolf.stats.health <= highRiskThreshold) {
        damage += highRiskDamageBonus;
      }

      // Apply damage
      wolf.stats.health -= damage;

      // Check for death
      if (wolf.stats.health <= 0) {
        wolf._dead = true;
        casualties.push(wolf.id);
      }
    });
  }

  // Pack vs Pack combat
  resolvePackBattle(
    attackingPack: Pack,
    defendingPack: Pack,
    participantFilter?: (wolf: Wolf) => boolean
  ): BattleResult {
    const attackerParticipants = attackingPack.wolves.filter(
      (w) => isAlive(w) && (participantFilter ? participantFilter(w) : true)
    );

    const defenderParticipants = defendingPack.wolves.filter(
      (w) => isAlive(w) && (participantFilter ? participantFilter(w) : true)
    );

    const result = this.resolveCombat(
      attackerParticipants,
      defenderParticipants
    );

    // Log battle results
    const attackerName = attackingPack.name || 'Unknown Pack';
    const defenderName = defendingPack.name || 'Unknown Pack';

    const battleLog =
      `Day ${defendingPack.day}: ${attackerName} attacked! ` +
      `Winner: ${result.winner === 'attacker' ? attackerName : defenderName}. ` +
      `Casualties: ${result.casualties.length}`;

    defendingPack.logs.push(battleLog);

    return {
      winner: result.winner,
      attackerDamage:
        result.attackerCasualties.length > 0 ? result.scoreDifference * 0.5 : 0, // some damage to winner too
      defenderDamage: result.loserDamage,
      loserDamage: result.loserDamage,
      casualties: result.casualties,
    };
  }

  // Single wolf vs wolf combat (for alpha challenges, etc.)
  resolveDuel(challenger: Wolf, defender: Wolf): CombatResult {
    return this.resolveCombat([challenger], [defender]);
  }

  // Raid simulation (simplified)
  simulateRaid(
    raiders: Wolf[],
    defendingPack: Pack,
    raidObjective: 'territory' | 'resources' | 'revenge' = 'territory'
  ): {
    success: boolean;
    casualties: string[];
    resourcesStolen?: number;
    defenderLosses: string[];
  } {
    // Select defenders (not all wolves participate)
    const availableDefenders = defendingPack.wolves.filter(
      (w) => isAlive(w) && ['alpha', 'beta', 'hunter'].includes(w.role)
    );

    // Limit defender count to make raids more feasible
    const maxDefenders = Math.min(
      availableDefenders.length,
      raiders.length + 2
    );
    const defenders = availableDefenders.slice(0, maxDefenders);

    const combat = this.resolveCombat(raiders, defenders);

    let resourcesStolen = 0;
    if (combat.winner === 'attacker' && raidObjective === 'resources') {
      resourcesStolen = Math.min(defendingPack.herbs, random.nextInt(1, 3));
      defendingPack.herbs = Math.max(0, defendingPack.herbs - resourcesStolen);
    }

    return {
      success: combat.winner === 'attacker',
      casualties: combat.attackerCasualties,
      resourcesStolen,
      defenderLosses: combat.defenderCasualties,
    };
  }

  // Calculate pack strength for AI decisions
  calculatePackStrength(pack: Pack): number {
    const combatWolves = pack.wolves.filter(
      (w) => isAlive(w) && ['alpha', 'beta', 'hunter'].includes(w.role)
    );

    return combatWolves.reduce((total, wolf) => {
      return total + getCombatScore(wolf);
    }, 0);
  }

  // Get combat effectiveness modifiers
  getCombatModifiers(
    wolf: Wolf,
    situation: 'attack' | 'defend' = 'defend'
  ): number {
    let modifier = 1.0;

    // Health modifiers
    if (wolf.stats.health < 30) {
      modifier *= 0.7; // Severely wounded
    } else if (wolf.stats.health < 60) {
      modifier *= 0.85; // Injured
    }

    // Role modifiers
    switch (wolf.role) {
      case 'alpha':
        modifier *= situation === 'defend' ? 1.2 : 1.1;
        break;
      case 'beta':
        modifier *= 1.1;
        break;
      case 'hunter':
        modifier *= situation === 'attack' ? 1.1 : 1.0;
        break;
      case 'pup':
        modifier *= 0.3; // Pups are not effective fighters
        break;
      case 'elder':
        modifier *= 0.8; // Elders are less effective
        break;
    }

    // Age modifiers
    if (wolf.age < 1.5) {
      modifier *= 0.4; // Young wolves
    } else if (wolf.age > 10) {
      modifier *= 0.7; // Old wolves
    }

    return modifier;
  }
}

// Export singleton instance
export const combatEngine = new CombatEngine();
