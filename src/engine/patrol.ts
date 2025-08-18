import type { Wolf } from '../types/wolf';
import type { Pack, GameConfig } from '../types/pack';
import type {
  PatrolType,
  PatrolResult,
  PatrolTemplate,
  PatrolOutcome,
  PatrolAssignment,
} from '../types/patrol';
import { random, generateId, isAlive, getAliveWolves } from '../types/utils';

export class PatrolEngine {
  private patrolTemplates: PatrolTemplate[] = [];
  private config: GameConfig;

  constructor(config: GameConfig) {
    this.config = config;
    this.loadDefaultPatrols();
  }

  updateConfig(newConfig: GameConfig): void {
    this.config = newConfig;
  }

  loadPatrolTemplates(templates: PatrolTemplate[]): void {
    this.patrolTemplates = templates;
  }

  private loadDefaultPatrols(): void {
    const huntingConfig = this.config.patrolTemplates.huntingPatrol;
    const borderConfig = this.config.patrolTemplates.borderPatrol;
    const trainingConfig = this.config.patrolTemplates.trainingPatrol;
    const herbConfig = this.config.patrolTemplates.herbGathering;

    this.patrolTemplates = [
      {
        id: 'hunting_patrol',
        type: 'hunting',
        title: 'Hunting Patrol',
        description: 'Search for prey to feed the pack',
        baseWeight: 10,
        outcomes: [
          {
            outcome: 'success',
            weight: huntingConfig.successWeight,
            title: 'Successful Hunt',
            description: 'The patrol brought back plenty of prey',
            rewards: [
              {
                type: 'food',
                amount: huntingConfig.rewards.success.food,
                description: 'Fresh prey for the pack',
              },
              {
                type: 'experience',
                amount: huntingConfig.rewards.success.xp,
                description: 'Hunting experience gained',
              },
            ],
          },
          {
            outcome: 'major_success',
            weight: huntingConfig.majorSuccessWeight,
            title: 'Exceptional Hunt',
            description:
              'The patrol found a large herd and brought back abundant prey',
            rewards: [
              { type: 'food', amount: huntingConfig.rewards.majorSuccess.food, description: 'Abundant prey haul' },
              {
                type: 'experience',
                amount: huntingConfig.rewards.majorSuccess.xp,
                description: 'Exceptional hunting experience',
              },
              {
                type: 'reputation',
                amount: huntingConfig.rewards.majorSuccess.reputation,
                description: 'Pack reputation improved',
              },
            ],
          },
          {
            outcome: 'failure',
            weight: huntingConfig.failureWeight,
            title: 'Poor Hunt',
            description: 'The patrol found little prey',
            rewards: [{ type: 'food', amount: huntingConfig.rewards.failure.food, description: 'Meager catch' }],
          },
          {
            outcome: 'disaster',
            weight: huntingConfig.disasterWeight,
            title: 'Dangerous Encounter',
            description: 'The patrol encountered dangerous prey or predators',
            consequences: [
              {
                type: 'injury',
                severity: 'moderate',
                description: 'A patrol member was injured during the hunt',
              },
            ],
          },
        ],
      },
      {
        id: 'border_patrol',
        type: 'border',
        title: 'Border Patrol',
        description: 'Patrol the territory borders and mark boundaries',
        baseWeight: 8,
        outcomes: [
          {
            outcome: 'success',
            weight: borderConfig.successWeight,
            title: 'Secure Borders',
            description:
              'The patrol maintained territorial boundaries without incident',
            rewards: [
              {
                type: 'reputation',
                amount: borderConfig.rewards.success.reputation,
                description: 'Territory secured',
              },
              {
                type: 'experience',
                amount: borderConfig.rewards.success.xp,
                description: 'Patrol experience gained',
              },
            ],
          },
          {
            outcome: 'major_success',
            weight: borderConfig.majorSuccessWeight,
            title: 'Rival Pack Encounter',
            description: 'The patrol encountered wolves from a rival pack',
            rewards: [
              {
                type: 'reputation',
                amount: borderConfig.rewards.majorSuccess.reputation,
                description: 'Gained reputation from successful confrontation',
              },
              {
                type: 'experience',
                amount: borderConfig.rewards.majorSuccess.xp,
                description: 'Valuable intel and experience gathered',
              },
            ],
          },
          {
            outcome: 'failure',
            weight: borderConfig.failureWeight,
            title: 'Border Intrusion',
            description: 'The patrol found evidence of trespassers',
            consequences: [
              {
                type: 'territory_loss',
                severity: 'minor',
                description: 'Small territory area lost to rivals',
              },
            ],
          },
          {
            outcome: 'disaster',
            weight: borderConfig.disasterWeight,
            title: 'Border Conflict',
            description: 'The patrol was attacked by rival wolves',
            consequences: [
              {
                type: 'injury',
                severity: 'severe',
                description: 'Patrol members injured in territorial fight',
              },
            ],
          },
        ],
      },
      {
        id: 'training_patrol',
        type: 'training',
        title: 'Training Patrol',
        description: 'Take apprentices on a training expedition',
        baseWeight: 6,
        requirements: [
          { type: 'wolf_count', value: 2, operator: '>=' },
          { type: 'role_required', value: ['pup'] },
        ],
        outcomes: [
          {
            outcome: 'success',
            weight: trainingConfig.successWeight,
            title: 'Good Training',
            description: 'The apprentices learned valuable skills',
            rewards: [
              {
                type: 'experience',
                amount: trainingConfig.rewards.success.xp,
                description: 'Training experience for apprentices',
              },
            ],
          },
          {
            outcome: 'major_success',
            weight: trainingConfig.majorSuccessWeight,
            title: 'Exceptional Training',
            description: 'The apprentices excelled in their training',
            rewards: [
              {
                type: 'experience',
                amount: trainingConfig.rewards.majorSuccess.xp,
                description: 'Exceptional training progress',
              },
              {
                type: 'reputation',
                amount: 2,
                description: 'Mentor reputation improved',
              },
            ],
          },
          {
            outcome: 'failure',
            weight: trainingConfig.failureWeight,
            title: 'Poor Training',
            description: 'The training session did not go well',
            rewards: [
              {
                type: 'experience',
                amount: 5,
                description: 'Minimal learning achieved',
              },
            ],
          },
        ],
      },
      {
        id: 'herb_gathering_patrol',
        type: 'herb_gathering',
        title: 'Herb Gathering',
        description: 'Search for medicinal herbs and healing plants',
        baseWeight: 5,
        requirements: [{ type: 'wolf_count', value: 1, operator: '>=' }],
        outcomes: [
          {
            outcome: 'success',
            weight: herbConfig.successWeight,
            title: 'Herbs Found',
            description: 'The patrol discovered useful medicinal plants',
            rewards: [
              {
                type: 'herbs',
                amount: herbConfig.rewards.success.herbs,
                description: 'Fresh medicinal herbs collected',
              },
              {
                type: 'experience',
                amount: herbConfig.rewards.success.xp,
                description: 'Herb gathering knowledge gained',
              },
            ],
          },
          {
            outcome: 'major_success',
            weight: herbConfig.majorSuccessWeight,
            title: 'Rare Herb Discovery',
            description:
              'The patrol found a patch of rare and powerful healing herbs',
            rewards: [
              {
                type: 'herbs',
                amount: herbConfig.rewards.majorSuccess.herbs,
                description: 'Rare medicinal herbs discovered',
              },
              {
                type: 'experience',
                amount: herbConfig.rewards.majorSuccess.xp,
                description: 'Valuable herb lore learned',
              },
              {
                type: 'reputation',
                amount: 3,
                description: 'Pack herbalist reputation improved',
              },
            ],
          },
          {
            outcome: 'failure',
            weight: herbConfig.failureWeight,
            title: 'Few Herbs Found',
            description: 'The patrol searched but found only common plants',
            rewards: [
              { type: 'herbs', amount: 1, description: 'Basic herbs gathered' },
            ],
          },
          {
            outcome: 'disaster',
            weight: 5,
            title: 'Poisonous Plants',
            description: 'A patrol member accidentally consumed toxic plants',
            consequences: [
              {
                type: 'illness',
                severity: 'moderate',
                description: 'A wolf became sick from poisonous plants',
              },
            ],
            rewards: [
              {
                type: 'herbs',
                amount: 1,
                description: 'Some safe herbs were still collected',
              },
            ],
          },
        ],
      },
    ];
  }

  canWolfPatrol(wolf: Wolf, pack: Pack): boolean {
    if (!isAlive(wolf)) return false;
    if (wolf.age < 0.5) return false; // Too young
    if (wolf.stats.health < 30) return false; // Too injured
    if (wolf.isSick) return false;

    // Check if wolf has too many patrols this month
    const monthStart = Math.floor(pack.day / 30) * 30;
    const monthPatrols = (pack.patrolHistory || []).filter(
      (result) =>
        result.day >= monthStart && result.participants.includes(wolf.id)
    );

    return (
      monthPatrols.length < this.config.patrolSystem.maxPatrolsPerWolfPerMonth
    );
  }

  getAvailableWolves(pack: Pack, patrolType: PatrolType): Wolf[] {
    const aliveWolves = getAliveWolves(pack);

    return aliveWolves.filter((wolf) => {
      if (!this.canWolfPatrol(wolf, pack)) return false;

      // Type-specific requirements
      switch (patrolType) {
        case 'hunting':
          return (
            wolf.role === 'hunter' ||
            wolf.role === 'beta' ||
            wolf.role === 'alpha'
          );
        case 'border':
          return wolf.role !== 'pup' && wolf.role !== 'healer';
        case 'training':
          return (
            wolf.role === 'beta' || wolf.role === 'hunter' || wolf.age >= 2
          );
        case 'herb_gathering':
          return (
            wolf.role === 'healer' ||
            wolf.role === 'beta' ||
            (wolf.role !== 'pup' && wolf.stats.intelligence >= 6)
          );
        default:
          return true;
      }
    });
  }

  getMentorPupPairs(pack: Pack): Array<{ mentor: Wolf; pups: Wolf[] }> {
    const aliveWolves = getAliveWolves(pack);
    const mentors = aliveWolves.filter(
      (wolf) =>
        (wolf.role === 'beta' || wolf.role === 'hunter') &&
        wolf.age >= 2 &&
        this.canWolfPatrol(wolf, pack)
    );

    const availablePups = aliveWolves.filter(
      (wolf) =>
        wolf.role === 'pup' && wolf.age >= 0.5 && this.canWolfPatrol(wolf, pack)
    );

    const pairs: Array<{ mentor: Wolf; pups: Wolf[] }> = [];

    mentors.forEach((mentor) => {
      // Find pups that have this mentor assigned or could be mentored
      const mentoredPups = availablePups.filter(
        (pup) => pup.trainingMentorId === mentor.id || !pup.trainingMentorId
      );

      if (mentoredPups.length > 0) {
        pairs.push({
          mentor,
          pups: mentoredPups.slice(0, 2), // Max 2 pups per mentor
        });
      }
    });

    return pairs;
  }

  getRequiredPatrols(pack: Pack): { hunting: number; border: number } {
    const monthStart = Math.floor(pack.day / 30) * 30;
    const monthPatrols = (pack.patrolHistory || []).filter(
      (result) => result.day >= monthStart
    );

    const huntingDone = monthPatrols.filter((p) => p.type === 'hunting').length;
    const borderDone = monthPatrols.filter((p) => p.type === 'border').length;

    return {
      hunting: Math.max(
        0,
        this.config.patrolSystem.minHuntingPatrolsPerMonth - huntingDone
      ),
      border: Math.max(
        0,
        this.config.patrolSystem.minBorderPatrolsPerMonth - borderDone
      ),
    };
  }

  createPatrolAssignment(
    type: PatrolType,
    participants: Wolf[],
    pack: Pack
  ): PatrolAssignment {
    return {
      id: generateId(),
      type,
      participants: participants.map((w) => w.id),
      scheduledDay: pack.day + random.nextInt(1, 3), // Schedule 1-3 days out
      completed: false,
    };
  }

  createMentorPupPatrol(
    mentor: Wolf,
    pups: Wolf[],
    pack: Pack
  ): PatrolAssignment {
    // Assign mentor to any unassigned pups
    pups.forEach((pup) => {
      if (!pup.trainingMentorId) {
        pup.trainingMentorId = mentor.id;
      }
    });

    const participants = [mentor, ...pups];
    return this.createPatrolAssignment('training', participants, pack);
  }

  executePatrol(assignment: PatrolAssignment, pack: Pack): PatrolResult {
    const template = this.patrolTemplates.find(
      (t) => t.type === assignment.type
    );
    if (!template) {
      throw new Error(`No template found for patrol type: ${assignment.type}`);
    }

    const participants = assignment.participants
      .map((id) => pack.wolves.find((w) => w.id === id))
      .filter((w): w is Wolf => w !== undefined && isAlive(w));

    if (participants.length === 0) {
      throw new Error('No valid participants for patrol');
    }

    // Calculate success modifiers
    const baseSuccess = this.config.patrolSystem.baseSuccessRate;
    const reputationModifier = (pack.patrolReputation || 50) / 100;
    const participantModifier = this.calculateParticipantModifier(
      participants,
      assignment.type
    );
    const seasonalModifier = this.getSeasonalModifier(
      pack.season,
      assignment.type
    );

    const totalSuccessRate =
      baseSuccess * reputationModifier * participantModifier * seasonalModifier;

    // Select outcome based on success rate
    const outcome = this.selectOutcome(template, totalSuccessRate);
    const outcomeTemplate = template.outcomes.find(
      (o) => o.outcome === outcome
    );

    if (!outcomeTemplate) {
      throw new Error(`No outcome template found for: ${outcome}`);
    }

    // Apply consequences and rewards
    this.applyPatrolEffects(outcomeTemplate, participants, pack);

    const result: PatrolResult = {
      id: generateId(),
      type: assignment.type,
      participants: assignment.participants,
      outcome,
      description: this.generateDescription(outcomeTemplate, participants),
      day: pack.day,
      ...(outcomeTemplate.rewards && { rewards: outcomeTemplate.rewards }),
      ...(outcomeTemplate.consequences && {
        consequences: outcomeTemplate.consequences,
      }),
    };

    // Update pack patrol history
    if (!pack.patrolHistory) pack.patrolHistory = [];
    pack.patrolHistory.push(result);

    // Update patrol reputation
    this.updatePatrolReputation(pack, outcome);

    return result;
  }

  private calculateParticipantModifier(
    participants: Wolf[],
    patrolType: PatrolType
  ): number {
    let modifier = 1.0;

    participants.forEach((wolf) => {
      // Health modifier
      modifier *= wolf.stats.health / 100;

      // Role modifier based on patrol type
      switch (patrolType) {
        case 'hunting':
          if (wolf.role === 'hunter') modifier *= 1.3;
          if (wolf.role === 'alpha' || wolf.role === 'beta') modifier *= 1.1;
          break;
        case 'border':
          if (wolf.role === 'alpha' || wolf.role === 'beta') modifier *= 1.2;
          if (wolf.role === 'hunter') modifier *= 1.1;
          break;
        case 'training':
          if (wolf.role === 'beta') modifier *= 1.3;
          if (wolf.role === 'pup') modifier *= 0.8; // Pups are learning
          break;
        case 'herb_gathering':
          if (wolf.role === 'healer') modifier *= 1.4;
          if (wolf.role === 'beta') modifier *= 1.1;
          // Intelligence bonus for herb gathering
          modifier *= 0.8 + (wolf.stats.intelligence / 10) * 0.4;
          break;
      }

      // Experience modifier (if leveling system is in place)
      if (wolf.level && wolf.level > 0) {
        modifier *= 1 + wolf.level * 0.05;
      }
    });

    // Team size modifier
    const idealSize =
      patrolType === 'training' ? 3 : patrolType === 'herb_gathering' ? 1 : 2;
    const sizeRatio = participants.length / idealSize;
    if (sizeRatio < 1) {
      modifier *= 0.7 + sizeRatio * 0.3; // Penalty for undersized patrol
    } else if (sizeRatio > 1.5) {
      // Herb gathering works better alone or in small groups
      const penalty = patrolType === 'herb_gathering' ? 0.8 : 0.9;
      modifier *= penalty; // Penalty for oversized patrol
    }

    return Math.max(0.1, Math.min(2.0, modifier));
  }

  private getSeasonalModifier(season: string, patrolType: PatrolType): number {
    const modifiers = this.config.seasonalModifiers;
    const seasonModifier = modifiers[season as keyof typeof modifiers];

    switch (patrolType) {
      case 'hunting':
        return seasonModifier && 'huntSuccess' in seasonModifier
          ? seasonModifier.huntSuccess
          : 1.0;
      case 'border':
        return season === 'autumn' ? 0.9 : 1.0; // More conflicts in autumn
      case 'training':
        return season === 'winter' ? 0.8 : 1.0; // Harder to train in winter
      case 'herb_gathering':
        // Spring and summer are best for herbs
        return season === 'spring'
          ? 1.3
          : season === 'summer'
            ? 1.2
            : season === 'autumn'
              ? 0.9
              : 0.6;
      default:
        return 1.0;
    }
  }

  private selectOutcome(
    template: PatrolTemplate,
    successRate: number
  ): PatrolOutcome {
    // Adjust weights based on success rate
    const adjustedOutcomes = template.outcomes.map((outcome) => {
      let weight = outcome.weight;

      if (
        outcome.outcome === 'success' ||
        outcome.outcome === 'major_success'
      ) {
        weight *= successRate;
      } else if (
        outcome.outcome === 'failure' ||
        outcome.outcome === 'disaster'
      ) {
        weight *= 2 - successRate;
      }

      return { ...outcome, adjustedWeight: Math.max(1, weight) };
    });

    const totalWeight = adjustedOutcomes.reduce(
      (sum, o) => sum + o.adjustedWeight,
      0
    );
    let randomValue = random.next() * totalWeight;

    for (const outcome of adjustedOutcomes) {
      randomValue -= outcome.adjustedWeight;
      if (randomValue <= 0) {
        return outcome.outcome;
      }
    }

    return 'failure'; // Fallback
  }

  private applyPatrolEffects(
    outcomeTemplate: {
      rewards?: Array<{ type: string; amount: number }>;
      consequences?: Array<{
        type: string;
        severity: string;
        targetWolfId?: string;
      }>;
    },
    participants: Wolf[],
    pack: Pack
  ): void {
    // Apply rewards
    if (outcomeTemplate.rewards) {
      outcomeTemplate.rewards.forEach(
        (reward: { type: string; amount: number }) => {
          switch (reward.type) {
            case 'food':
              pack.food = (pack.food || 0) + reward.amount;
              break;
            case 'herbs':
              pack.herbs += reward.amount;
              break;
            case 'experience':
              participants.forEach((wolf) => {
                wolf.xp =
                  (wolf.xp || 0) +
                  Math.floor(reward.amount / participants.length);
              });
              break;
            case 'reputation':
              pack.patrolReputation = Math.min(
                100,
                (pack.patrolReputation || 50) + reward.amount
              );
              break;
          }
        }
      );
    }

    // Apply consequences
    if (outcomeTemplate.consequences) {
      outcomeTemplate.consequences.forEach(
        (consequence: {
          type: string;
          severity: string;
          targetWolfId?: string;
        }) => {
          const target = consequence.targetWolfId
            ? participants.find((w) => w.id === consequence.targetWolfId)
            : random.choice(participants);

          if (target) {
            switch (consequence.type) {
              case 'injury': {
                const damage =
                  consequence.severity === 'minor'
                    ? 10
                    : consequence.severity === 'moderate'
                      ? 20
                      : 35;
                target.stats.health = Math.max(1, target.stats.health - damage);
                break;
              }
              case 'illness':
                target.isSick = true;
                break;
            }
          }
        }
      );
    }
  }

  private updatePatrolReputation(pack: Pack, outcome: PatrolOutcome): void {
    if (!pack.patrolReputation) pack.patrolReputation = 50;

    switch (outcome) {
      case 'major_success':
        pack.patrolReputation = Math.min(100, pack.patrolReputation + 3);
        break;
      case 'success':
        pack.patrolReputation = Math.min(100, pack.patrolReputation + 1);
        break;
      case 'failure':
        pack.patrolReputation = Math.max(0, pack.patrolReputation - 1);
        break;
      case 'disaster':
        pack.patrolReputation = Math.max(0, pack.patrolReputation - 3);
        break;
    }
  }

  private generateDescription(
    outcomeTemplate: { description?: string },
    participants: Wolf[]
  ): string {
    const participantNames = participants.map((w) => w.name).join(', ');
    const description =
      outcomeTemplate.description || 'The patrol completed their mission.';
    return description.replace(
      '{participants}',
      participants.length === 1
        ? participants[0]?.name || 'Unknown'
        : participantNames
    );
  }

  processScheduledPatrols(pack: Pack): PatrolResult[] {
    if (!pack.assignedPatrols) pack.assignedPatrols = [];

    const results: PatrolResult[] = [];
    const completedPatrols: string[] = [];

    pack.assignedPatrols.forEach((assignment) => {
      if (!assignment.completed && assignment.scheduledDay <= pack.day) {
        try {
          const result = this.executePatrol(assignment, pack);
          results.push(result);
          assignment.completed = true;
          assignment.result = result;
          completedPatrols.push(assignment.id);
        } catch (error) {
          console.warn('Failed to execute patrol:', error);
          assignment.completed = true; // Mark as completed to avoid retry
          completedPatrols.push(assignment.id);
        }
      }
    });

    // Clean up old completed patrols (keep last 30 days)
    pack.assignedPatrols = pack.assignedPatrols.filter(
      (patrol) => !patrol.completed || patrol.scheduledDay > pack.day - 30
    );

    return results;
  }
}
