import type { Wolf } from '../types/wolf';
import type { Pack } from '../types/pack';
import type {
  EventTemplate,
  Condition,
  ConditionGroup,
  Action,
  EventResult,
} from '../types/event';
import {
  getField,
  setField,
  clampWolfStats,
  isAlive,
  replaceTemplate,
  generateId,
  random,
} from '../types/utils';

export class EventEngine {
  private eventTemplates: EventTemplate[] = [];

  loadEvents(templates: EventTemplate[]): void {
    this.eventTemplates = templates;
  }

  getEventsByTag(tag: string): EventTemplate[] {
    return this.eventTemplates.filter(
      (template) => template.tags?.includes(tag) ?? false
    );
  }

  evaluateCondition(
    condition: Condition,
    wolf: Wolf,
    pack: Pack,
    target?: Wolf
  ): boolean {
    const contextObj = { wolf, pack, target };
    const value = getField(contextObj, condition.field);

    switch (condition.op) {
      case '==':
        return value === condition.value;
      case '!=':
        return value !== condition.value;
      case '>':
        return typeof value === 'number' && value > (condition.value as number);
      case '>=':
        return (
          typeof value === 'number' && value >= (condition.value as number)
        );
      case '<':
        return typeof value === 'number' && value < (condition.value as number);
      case '<=':
        return (
          typeof value === 'number' && value <= (condition.value as number)
        );
      case 'in':
        return (
          Array.isArray(condition.value) && condition.value.includes(value)
        );
      case 'not_in':
        return (
          Array.isArray(condition.value) && !condition.value.includes(value)
        );
      default:
        return false;
    }
  }

  evaluateConditionGroup(
    group: ConditionGroup,
    wolf: Wolf,
    pack: Pack,
    target?: Wolf
  ): boolean {
    if (group.all) {
      return group.all.every((item) => {
        if ('field' in item) {
          return this.evaluateCondition(item, wolf, pack, target);
        } else {
          return this.evaluateConditionGroup(item, wolf, pack, target);
        }
      });
    }

    if (group.any) {
      return group.any.some((item) => {
        if ('field' in item) {
          return this.evaluateCondition(item, wolf, pack, target);
        } else {
          return this.evaluateConditionGroup(item, wolf, pack, target);
        }
      });
    }

    if (group.not) {
      if ('field' in group.not) {
        return !this.evaluateCondition(group.not, wolf, pack, target);
      } else {
        return !this.evaluateConditionGroup(group.not, wolf, pack, target);
      }
    }

    return false;
  }

  findCandidateWolves(template: EventTemplate, pack: Pack): Wolf[] {
    const aliveWolves = pack.wolves.filter(isAlive);
    return aliveWolves.filter((wolf) =>
      this.evaluateConditionGroup(template.condition, wolf, pack)
    );
  }

  executeAction(action: Action, wolf: Wolf, pack: Pack, target?: Wolf): void {
    switch (action.type) {
      case 'modify_stat': {
        const targetObj =
          action.target === 'target'
            ? target
            : action.target === 'wolf'
              ? wolf
              : pack;
        if (!targetObj) return;

        const currentValue = getField(
          targetObj as unknown as Record<string, unknown>,
          action.stat
        ) as number;
        if (typeof currentValue === 'number') {
          setField(
            targetObj as unknown as Record<string, unknown>,
            action.stat,
            currentValue + action.delta
          );
          if (action.target === 'wolf' || action.target === 'target') {
            clampWolfStats(targetObj as Wolf);
          }
        }
        break;
      }

      case 'set_stat': {
        const targetObj =
          action.target === 'target'
            ? target
            : action.target === 'wolf'
              ? wolf
              : pack;
        if (!targetObj) return;

        setField(
          targetObj as unknown as Record<string, unknown>,
          action.stat,
          action.value
        );
        if (action.target === 'wolf' || action.target === 'target') {
          clampWolfStats(targetObj as Wolf);
        }
        break;
      }

      case 'spawn_wolf': {
        const count = action.count ?? 1;
        for (let i = 0; i < count; i++) {
          const newWolf: Wolf = {
            id: generateId('wolf_'),
            name: this.generateWolfName(),
            sex: random.choice(['male', 'female']),
            age: 0.1, // newborn
            role: 'pup',
            appearance: {
              furColor: action.wolfTemplate.appearance?.furColor ?? 'brown',
              pattern: action.wolfTemplate.appearance?.pattern ?? 'solid',
              eyeColor: action.wolfTemplate.appearance?.eyeColor ?? 'brown',
              scars: action.wolfTemplate.appearance?.scars ?? [],
            },
            stats: {
              health: action.wolfTemplate.stats?.health ?? 70,
              strength: action.wolfTemplate.stats?.strength ?? 2,
              speed: action.wolfTemplate.stats?.speed ?? 3,
              intelligence: action.wolfTemplate.stats?.intelligence ?? 3,
            },
            traits: {
              bravery: action.wolfTemplate.traits?.bravery ?? 3,
              sociability: action.wolfTemplate.traits?.sociability ?? 6,
              trainability: action.wolfTemplate.traits?.trainability ?? 5,
              fertility: action.wolfTemplate.traits?.fertility ?? 0,
            },
            xp: 0,
            level: 0,
            bonds: {},
            ...action.wolfTemplate,
          };

          pack.wolves.push(newWolf);
        }
        break;
      }

      case 'remove_wolf': {
        if (action.targetSelector === 'wolf') {
          wolf._dead = true;
        } else if (action.targetSelector === 'lowest_health') {
          const lowestHealth = pack.wolves
            .filter(isAlive)
            .reduce((min, w) => (w.stats.health < min.stats.health ? w : min));
          if (lowestHealth) {
            lowestHealth._dead = true;
          }
        } else if (action.targetSelector === 'all_pups') {
          pack.wolves
            .filter((w) => isAlive(w) && w.role === 'pup')
            .forEach((pup) => (pup._dead = true));
        } else {
          wolf._dead = true; // default
        }
        break;
      }

      case 'change_role': {
        const targetWolf = action.target === 'target' ? target : wolf;
        if (targetWolf) {
          targetWolf.role = action.role;
        }
        break;
      }

      case 'log': {
        const context = { wolf, pack, target };
        const logText = replaceTemplate(action.text, context);
        pack.logs.push(`Day ${pack.day}: ${logText}`);
        break;
      }

      case 'adjust_bond': {
        if (action.withWolfIdField && target) {
          const bondTargetId = target.id;
          if (!wolf.bonds) wolf.bonds = {};
          if (!target.bonds) target.bonds = {};

          wolf.bonds[bondTargetId] = Math.max(
            -100,
            Math.min(100, (wolf.bonds[bondTargetId] ?? 0) + action.delta)
          );
          target.bonds[wolf.id] = Math.max(
            -100,
            Math.min(100, (target.bonds[wolf.id] ?? 0) + action.delta)
          );
        }
        break;
      }

      case 'trigger_story': {
        // Find and activate story event
        const storyEvent = pack.storyEvents.find(
          (se) => se.id === action.storyId
        );
        if (storyEvent) {
          storyEvent.unlocked = true;
        }
        break;
      }
    }
  }

  executeEvent(
    template: EventTemplate,
    wolf: Wolf,
    pack: Pack,
    target?: Wolf
  ): EventResult {
    const context = { wolf, pack, target };
    const eventText = replaceTemplate(template.text, context);

    // Execute all actions
    template.actions.forEach((action) => {
      this.executeAction(action, wolf, pack, target);
    });

    // Create event result
    const result: EventResult = {
      eventId: template.id,
      wolfId: wolf.id,
      text: eventText,
      day: pack.day,
      actions: template.actions,
    };

    if (target) {
      result.targetWolfId = target.id;
    }

    pack.eventHistory.push(result);
    return result;
  }

  selectRandomEvent(candidates: EventTemplate[]): EventTemplate | null {
    if (candidates.length === 0) return null;

    const weights = candidates.map((t) => t.weight ?? 1);
    return random.weightedChoice(candidates, weights);
  }

  runDailyEvents(pack: Pack, eventCount: number = 3): EventResult[] {
    const results: EventResult[] = [];

    for (let i = 0; i < eventCount; i++) {
      const availableTemplates = this.eventTemplates.filter((template) => {
        const candidates = this.findCandidateWolves(template, pack);
        return candidates.length > 0 || template.allowFallback;
      });

      const selectedTemplate = this.selectRandomEvent(availableTemplates);
      if (!selectedTemplate) continue;

      let candidates = this.findCandidateWolves(selectedTemplate, pack);

      // Fallback selection if no candidates
      if (candidates.length === 0 && selectedTemplate.allowFallback) {
        candidates = pack.wolves.filter(isAlive);
      }

      if (candidates.length === 0) continue;

      const selectedWolf = random.choice(candidates);
      let targetWolf: Wolf | undefined;

      // Select target wolf if needed by actions
      const needsTarget = selectedTemplate.actions.some(
        (action) =>
          action.type === 'adjust_bond' ||
          (action.type === 'modify_stat' && action.target === 'target')
      );

      if (needsTarget) {
        const potentialTargets = pack.wolves.filter(
          (w) => isAlive(w) && w.id !== selectedWolf.id
        );
        if (potentialTargets.length > 0) {
          targetWolf = random.choice(potentialTargets);
        }
      }

      const result = this.executeEvent(
        selectedTemplate,
        selectedWolf,
        pack,
        targetWolf
      );
      results.push(result);
    }

    return results;
  }

  private generateWolfName(): string {
    const names = [
      'Ash',
      'Ember',
      'Stone',
      'Bram',
      'Ivy',
      'Rook',
      'Lark',
      'Moss',
      'Storm',
      'River',
      'Sage',
      'Flint',
      'Dawn',
      'Shadow',
      'Frost',
      'Thorn',
      'Cedar',
      'Willow',
      'Rowan',
      'Hazel',
      'Sage',
      'Jasper',
      'Onyx',
      'Ruby',
    ];
    return random.choice(names);
  }
}

// Export singleton instance
export const eventEngine = new EventEngine();
