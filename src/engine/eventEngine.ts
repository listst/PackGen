import type { Wolf } from '../types/wolf';
import type { Pack } from '../types/pack';
import type {
  EventTemplate,
  Condition,
  ConditionGroup,
  Action,
  EventResult,
  DecisionEvent,
  DecisionResult,
  ScheduledConsequence,
  ConsequenceTemplate,
  MoonEvent,
  MultiOutcomeConsequence,
  ConsequenceOutcome,
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
  private moonEvents: MoonEvent[] = [];
  private consequenceTemplates: ConsequenceTemplate[] = [];
  private multiOutcomeConsequences: MultiOutcomeConsequence[] = [];

  loadEvents(templates: EventTemplate[]): void {
    this.eventTemplates = templates;
  }

  loadMoonEvents(events: MoonEvent[]): void {
    this.moonEvents = events;
  }

  loadConsequenceTemplates(templates: ConsequenceTemplate[]): void {
    this.consequenceTemplates = templates;
  }

  loadMultiOutcomeConsequences(consequences: MultiOutcomeConsequence[]): void {
    this.multiOutcomeConsequences = consequences;
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
        } else if (action.targetSelector === 'beta') {
          const beta = pack.wolves.find((w) => isAlive(w) && w.role === 'beta');
          if (beta) {
            beta._dead = true;
          }
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

      case 'schedule_consequence': {
        // Schedule a delayed consequence
        if (!pack.scheduledConsequences) pack.scheduledConsequences = [];

        const scheduledConsequence: ScheduledConsequence = {
          id: generateId('consequence_'),
          consequenceId: action.consequenceId,
          triggerDay: pack.day + action.daysDelay,
          eventContext: {
            wolfId: wolf.id,
            targetWolfId: target?.id || undefined,
            originalEventId: 'current_event', // This should be passed from caller
          },
          resolved: false,
        };

        pack.scheduledConsequences.push(scheduledConsequence);
        break;
      }

      case 'adjust_approval': {
        // Adjust pack approval rating
        if (!pack.packApproval) pack.packApproval = 50;
        pack.packApproval = Math.max(
          0,
          Math.min(100, pack.packApproval + action.delta)
        );
        break;
      }

      case 'kill_wolf': {
        // Kill a wolf based on selector
        let targetWolf: Wolf | null = null;
        const aliveWolves = pack.wolves.filter(
          (w) => !w._dead && !w._dispersed
        );

        switch (action.targetSelector) {
          case 'wolf':
            targetWolf = wolf;
            break;
          case 'target':
            targetWolf = target || null;
            break;
          case 'beta':
            // Find the beta - only kill if beta exists
            targetWolf = aliveWolves.find((w) => w.role === 'beta') || null;
            break;
          case 'weakest':
            if (aliveWolves.length > 0) {
              const weakestWolf = aliveWolves.reduce((acc, w) =>
                w.stats.health < acc.stats.health ? w : acc
              );
              targetWolf = weakestWolf || null;
            }
            break;
          case 'random':
          default: {
            const selectableWolves = aliveWolves.filter(
              (w) => w.id !== wolf.id
            ); // Don't kill the event wolf
            targetWolf =
              selectableWolves.length > 0
                ? random.choice(selectableWolves)
                : null;
            break;
          }
        }

        if (targetWolf) {
          targetWolf._dead = true;
          // Note: deathDay and deathCause would need to be added to Wolf type
          // (targetWolf as any).deathDay = pack.day;
          // (targetWolf as any).deathCause = 'battle';
        }
        break;
      }

      case 'injure_wolf': {
        // Injure a wolf with a specific injury
        let targetWolf: Wolf | null = null;
        const aliveWolves = pack.wolves.filter(
          (w) => !w._dead && !w._dispersed
        );

        switch (action.targetSelector) {
          case 'wolf':
            targetWolf = wolf;
            break;
          case 'target':
            targetWolf = target || null;
            break;
          case 'random':
          default:
            targetWolf = random.choice(aliveWolves);
            break;
        }

        if (targetWolf) {
          targetWolf.stats.health = Math.max(1, targetWolf.stats.health - 15);
          // Add injury tracking - this would need to be added to Wolf type
          if (!(targetWolf as Wolf & { injuries?: unknown[] }).injuries)
            (targetWolf as Wolf & { injuries: unknown[] }).injuries = [];
          (targetWolf as Wolf & { injuries: unknown[] }).injuries.push({
            type: action.injury,
            healingDay: pack.day + action.healingDays,
            description: action.injury.replace('_', ' '),
          });
        }
        break;
      }

      case 'change_alpha': {
        // Change pack leadership
        const aliveWolves = pack.wolves.filter(
          (w) => !w._dead && !w._dispersed && w.id !== wolf.id
        );
        let newAlpha: Wolf | null = null;

        switch (action.newAlphaSelector) {
          case 'beta':
            newAlpha = aliveWolves.find((w) => w.role === 'beta') || null;
            break;
          case 'strongest':
            if (aliveWolves.length > 0) {
              const strongestWolf = aliveWolves.reduce((acc, w) =>
                w.stats.strength > acc.stats.strength ? w : acc
              );
              newAlpha = strongestWolf || null;
            }
            break;
          case 'most_approved':
            // This would need approval tracking per wolf
            newAlpha =
              aliveWolves.find((w) => w.role === 'beta') ||
              aliveWolves[0] ||
              null;
            break;
          default:
            newAlpha =
              aliveWolves.find((w) => w.role === 'beta') ||
              aliveWolves[0] ||
              null;
            break;
        }

        if (newAlpha) {
          wolf.role = 'omega'; // Demote old alpha
          newAlpha.role = 'alpha';
        }
        break;
      }

      case 'create_rival_pack': {
        // Create a rival pack for future conflicts
        if (!pack.territory) {
          pack.territory = {
            biome: 'forest',
            rivalPacks: [],
            foodRichness: 5,
            herbAbundance: 5,
            dangerLevel: 3,
          };
        }
        if (!pack.territory.rivalPacks) pack.territory.rivalPacks = [];

        const newRivalPack: import('../types/territory').RivalPack = {
          id: generateId('rival_'),
          name: action.packName,
          strength: action.strength,
          lastRaidDay: pack.day,
          aggression: 5,
        };
        pack.territory.rivalPacks.push(newRivalPack);
        break;
      }

      case 'lose_territory': {
        // Reduce pack's territorial control
        if (!pack.territory) {
          pack.territory = {
            biome: 'forest',
            rivalPacks: [],
            foodRichness: 5,
            herbAbundance: 5,
            dangerLevel: 3,
          };
        }

        // Reduce food richness as a proxy for territory loss
        pack.territory.foodRichness = Math.max(
          1,
          pack.territory.foodRichness - action.amount
        );
        break;
      }

      case 'promote_role': {
        // Promote a wolf to a new role based on selector
        const aliveWolves = pack.wolves.filter(
          (w) => !w._dead && !w._dispersed
        );
        let targetWolf: Wolf | null = null;

        switch (action.targetSelector) {
          case 'best_hunter': {
            const hunters = aliveWolves.filter((w) => w.role === 'hunter');
            if (hunters.length > 0) {
              targetWolf = hunters.reduce((best, current) =>
                current.stats.speed + current.stats.strength >
                best.stats.speed + best.stats.strength
                  ? current
                  : best
              );
            }
            break;
          }
          case 'eldest_non_alpha': {
            const nonAlphas = aliveWolves.filter((w) => w.role !== 'alpha');
            if (nonAlphas.length > 0) {
              targetWolf = nonAlphas.reduce((eldest, current) =>
                current.age > eldest.age ? current : eldest
              );
            }
            break;
          }
          case 'strongest_non_alpha': {
            const nonAlphaStrong = aliveWolves.filter(
              (w) => w.role !== 'alpha'
            );
            if (nonAlphaStrong.length > 0) {
              targetWolf = nonAlphaStrong.reduce((strongest, current) =>
                current.stats.strength > strongest.stats.strength
                  ? current
                  : strongest
              );
            }
            break;
          }
          case 'smartest_non_alpha': {
            const nonAlphaSmart = aliveWolves.filter((w) => w.role !== 'alpha');
            if (nonAlphaSmart.length > 0) {
              targetWolf = nonAlphaSmart.reduce((smartest, current) =>
                current.stats.intelligence > smartest.stats.intelligence
                  ? current
                  : smartest
              );
            }
            break;
          }
        }

        if (targetWolf) {
          targetWolf.role = action.newRole;
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

  // Decision Event System Methods

  checkForMoonEvent(pack: Pack): MoonEvent | null {
    if (!pack.lastMoonEventDay) pack.lastMoonEventDay = 0;

    // Check if it's time for a moon event (monthly)
    const daysSinceLastMoon = pack.day - pack.lastMoonEventDay;
    if (daysSinceLastMoon < 30) return null;

    // Get alive wolves by role for validation
    const aliveWolves = pack.wolves.filter((w) => !w._dead && !w._dispersed);
    const roles = {
      alpha: aliveWolves.filter((w) => w.role === 'alpha').length,
      beta: aliveWolves.filter((w) => w.role === 'beta').length,
    };

    // Filter available moon events
    const availableEvents = this.moonEvents.filter((event) => {
      // Skip betrayal events if no beta exists
      if (event.id === 'betrayal_discovery' && roles.beta === 0) {
        return false;
      }

      // Create a temporary EventTemplate for condition checking
      const tempTemplate: EventTemplate = {
        id: event.id,
        text: event.text,
        condition: event.condition,
        actions: [], // MoonEvents don't have actions, only choices do
        title: event.title,
        weight: event.weight,
        tags: event.tags,
        allowFallback: event.allowFallback,
      };
      const candidates = this.findCandidateWolves(tempTemplate, pack);
      return candidates.length > 0;
    });

    if (availableEvents.length === 0) return null;

    // Apply seasonal bonuses to weights
    const season = pack.season;
    const weightedEvents = availableEvents.map((event) => ({
      event,
      weight: (event.weight || 1) * (event.seasonalBonus?.[season] || 1),
    }));

    const totalWeight = weightedEvents.reduce(
      (sum, { weight }) => sum + weight,
      0
    );
    let randomValue = random.next() * totalWeight;

    for (const { event, weight } of weightedEvents) {
      randomValue -= weight;
      if (randomValue <= 0) {
        return event;
      }
    }

    return null;
  }

  createDecisionEvent(
    event: DecisionEvent,
    wolf: Wolf,
    pack: Pack,
    target?: Wolf
  ): void {
    if (!pack.pendingDecisions) pack.pendingDecisions = [];

    // Create a copy with current context
    const decisionEvent: DecisionEvent = {
      ...event,
      id: generateId('decision_'),
      text: replaceTemplate(event.text, { wolf, pack, target }),
      choices: event.choices.map((choice) => ({
        ...choice,
        text: replaceTemplate(choice.text, { wolf, pack, target }),
        description: choice.description
          ? replaceTemplate(choice.description, { wolf, pack, target })
          : undefined,
      })),
    };

    // Store wolf context for later resolution
    (
      decisionEvent as DecisionEvent & { wolfId: string; targetWolfId?: string }
    ).wolfId = wolf.id;
    if (target?.id) {
      (
        decisionEvent as DecisionEvent & {
          wolfId: string;
          targetWolfId?: string;
        }
      ).targetWolfId = target.id;
    }

    pack.pendingDecisions.push(decisionEvent);
  }

  createSuccessionEvent(pack: Pack): DecisionEvent | null {
    // Find the beta succession moon event
    const successionMoonEvent = this.moonEvents.find(
      (event) => event.id === 'beta_succession'
    );
    if (!successionMoonEvent) return null;

    // Find an alpha to make the decision
    const alpha = pack.wolves.find(
      (w) => !w._dead && !w._dispersed && w.role === 'alpha'
    );
    if (!alpha) return null;

    // Create the decision event
    const decisionEvent: DecisionEvent = {
      ...successionMoonEvent,
      id: generateId('decision_'),
      text: replaceTemplate(successionMoonEvent.text, {
        wolf: alpha,
        pack,
        target: undefined,
      }),
      choices: successionMoonEvent.choices.map((choice) => ({
        ...choice,
        text: replaceTemplate(choice.text, {
          wolf: alpha,
          pack,
          target: undefined,
        }),
        description: choice.description
          ? replaceTemplate(choice.description, {
              wolf: alpha,
              pack,
              target: undefined,
            })
          : undefined,
      })),
    };

    // Store alpha context
    (
      decisionEvent as DecisionEvent & { wolfId: string; createdDay: number }
    ).wolfId = alpha.id;
    (
      decisionEvent as DecisionEvent & { wolfId: string; createdDay: number }
    ).createdDay = pack.day;

    return decisionEvent;
  }

  resolveDecision(
    pack: Pack,
    decisionId: string,
    choiceId: string,
    isPlayerChoice: boolean = true
  ): DecisionResult | null {
    if (!pack.pendingDecisions) return null;

    const decisionIndex = pack.pendingDecisions.findIndex(
      (d) => d.id === decisionId
    );
    if (decisionIndex === -1) return null;

    const decision = pack.pendingDecisions[decisionIndex];
    if (!decision) return null;

    const choice = decision.choices.find((c) => c.id === choiceId);
    if (!choice) return null;

    // Get wolf context
    const wolf = pack.wolves.find(
      (w) => w.id === (decision as DecisionEvent & { wolfId: string }).wolfId
    );
    const target = (decision as DecisionEvent & { targetWolfId?: string })
      .targetWolfId
      ? pack.wolves.find(
          (w) =>
            w.id ===
            (decision as DecisionEvent & { targetWolfId?: string }).targetWolfId
        )
      : undefined;

    if (!wolf) return null;

    // Execute choice actions
    choice.actions.forEach((action) => {
      this.executeAction(action, wolf, pack, target);
    });

    // Create decision result
    const result: DecisionResult = {
      eventId: decision.id,
      wolfId: wolf.id,
      targetWolfId: target?.id || undefined,
      text: choice.text,
      day: pack.day,
      actions: choice.actions,
      choiceId: choice.id,
      choiceText: choice.text,
      isPlayerChoice,
    };

    // Store in decision history
    if (!pack.decisionHistory) pack.decisionHistory = [];
    pack.decisionHistory.push(result);

    // Remove from pending decisions
    pack.pendingDecisions.splice(decisionIndex, 1);

    return result;
  }

  processScheduledConsequences(pack: Pack): EventResult[] {
    if (!pack.scheduledConsequences) return [];

    const results: EventResult[] = [];
    const toResolve = pack.scheduledConsequences.filter(
      (sc) => !sc.resolved && sc.triggerDay <= pack.day
    );

    for (const scheduledConsequence of toResolve) {
      // First check for multi-outcome consequences
      const multiOutcome = this.multiOutcomeConsequences.find(
        (moc) => moc.id === scheduledConsequence.consequenceId
      );

      if (multiOutcome) {
        const outcome = this.selectConsequenceOutcome(
          multiOutcome,
          pack,
          scheduledConsequence
        );
        if (outcome) {
          const wolf = pack.wolves.find(
            (w) => w.id === scheduledConsequence.eventContext.wolfId
          );
          const target = scheduledConsequence.eventContext.targetWolfId
            ? pack.wolves.find(
                (w) => w.id === scheduledConsequence.eventContext.targetWolfId
              )
            : undefined;

          if (wolf) {
            // Execute outcome
            const tempTemplate: EventTemplate = {
              id: outcome.id,
              title: outcome.title,
              text: outcome.text,
              condition: { all: [] },
              actions: outcome.actions,
              tags: outcome.tags,
            };
            const result = this.executeEvent(tempTemplate, wolf, pack, target);
            results.push(result);
          }
        }
        scheduledConsequence.resolved = true;
        continue;
      }

      // Fall back to single-outcome consequences
      const template = this.consequenceTemplates.find(
        (ct) => ct.id === scheduledConsequence.consequenceId
      );

      if (!template) {
        scheduledConsequence.resolved = true;
        continue;
      }

      const wolf = pack.wolves.find(
        (w) => w.id === scheduledConsequence.eventContext.wolfId
      );
      const target = scheduledConsequence.eventContext.targetWolfId
        ? pack.wolves.find(
            (w) => w.id === scheduledConsequence.eventContext.targetWolfId
          )
        : undefined;

      if (!wolf) {
        scheduledConsequence.resolved = true;
        continue;
      }

      // Check if conditions are still met
      if (
        template.condition &&
        !this.evaluateConditionGroup(template.condition, wolf, pack, target)
      ) {
        scheduledConsequence.resolved = true;
        continue;
      }

      // Execute consequence - create temporary EventTemplate
      const tempTemplate: EventTemplate = {
        id: template.id,
        title: template.title,
        text: template.text,
        condition: template.condition || { all: [] },
        actions: template.actions,
        tags: template.tags,
      };
      const result = this.executeEvent(tempTemplate, wolf, pack, target);
      results.push(result);
      scheduledConsequence.resolved = true;
    }

    // Clean up resolved consequences (keep last 30 days for history)
    pack.scheduledConsequences = pack.scheduledConsequences.filter(
      (sc) => !sc.resolved || sc.triggerDay > pack.day - 30
    );

    return results;
  }

  selectConsequenceOutcome(
    multiOutcome: MultiOutcomeConsequence,
    pack: Pack,
    scheduledConsequence: ScheduledConsequence
  ): ConsequenceOutcome | null {
    const wolf = pack.wolves.find(
      (w) => w.id === scheduledConsequence.eventContext.wolfId
    );
    const target = scheduledConsequence.eventContext.targetWolfId
      ? pack.wolves.find(
          (w) => w.id === scheduledConsequence.eventContext.targetWolfId
        )
      : undefined;

    if (!wolf) return null;

    // Calculate weighted probabilities for each outcome
    const weightedOutcomes = multiOutcome.outcomes
      .map((outcome) => {
        let weight = outcome.probability || 0.5; // Default 50% base probability

        // Modify weight based on conditions
        if (outcome.condition) {
          const conditionMet = this.evaluateConditionGroup(
            outcome.condition,
            wolf,
            pack,
            target
          );
          if (!conditionMet) {
            weight = 0; // Can't happen if conditions not met
          } else {
            weight = weight * 1.5; // Boost probability if conditions are met
          }
        }

        return { outcome, weight };
      })
      .filter((wo) => wo.weight > 0);

    if (weightedOutcomes.length === 0) {
      // Fall back to default outcome
      const defaultOutcome = multiOutcome.outcomes.find(
        (o) => o.id === multiOutcome.defaultOutcomeId
      );
      return defaultOutcome || multiOutcome.outcomes[0] || null;
    }

    // Select based on weighted random
    const totalWeight = weightedOutcomes.reduce(
      (sum, wo) => sum + wo.weight,
      0
    );
    let randomValue = random.next() * totalWeight;

    for (const { outcome, weight } of weightedOutcomes) {
      randomValue -= weight;
      if (randomValue <= 0) {
        return outcome;
      }
    }

    return weightedOutcomes[0]?.outcome || null; // Fallback
  }

  autoResolveTimedOutDecisions(pack: Pack): DecisionResult[] {
    if (!pack.pendingDecisions) return [];

    const results: DecisionResult[] = [];
    const timedOut = pack.pendingDecisions.filter((decision) => {
      const daysPending =
        pack.day -
        ((decision as DecisionEvent & { createdDay?: number }).createdDay || 0);
      return daysPending >= (decision.timeoutDays || 7);
    });

    for (const decision of timedOut) {
      let choiceId = decision.defaultChoiceId;
      if (!choiceId) {
        // Pick weighted random choice
        const weights = decision.choices.map((c) => c.weight || 1);
        const choice = random.weightedChoice(decision.choices, weights);
        choiceId = choice.id;
      }

      const result = this.resolveDecision(pack, decision.id, choiceId, false);
      if (result) results.push(result);
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
