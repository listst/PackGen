import type { Wolf } from './wolf';
import type { Pack } from './pack';

// Safe field access using dot notation
export function getField(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((current, key) => {
    if (current === null || current === undefined) return undefined;
    return current[key];
  }, obj);
}

// Safe field setting using dot notation
export function setField(
  obj: Record<string, unknown>,
  path: string,
  value: unknown
): void {
  const keys = path.split('.');
  const lastKey = keys.pop();
  if (!lastKey) return;

  const target = keys.reduce((current, key) => {
    if (current[key] === undefined || current[key] === null) {
      current[key] = {};
    }
    return current[key];
  }, obj);

  target[lastKey] = value;
}

// Clamp numeric values to min/max ranges
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// Clamp specific wolf stats
export function clampWolfStats(wolf: Wolf): void {
  wolf.stats.health = clamp(wolf.stats.health, 0, 100);
  wolf.stats.strength = clamp(wolf.stats.strength, 0, 10);
  wolf.stats.speed = clamp(wolf.stats.speed, 0, 10);
  wolf.stats.intelligence = clamp(wolf.stats.intelligence, 0, 10);

  wolf.traits.bravery = clamp(wolf.traits.bravery, 0, 10);
  wolf.traits.sociability = clamp(wolf.traits.sociability, 0, 10);
  wolf.traits.trainability = clamp(wolf.traits.trainability, 0, 10);
  wolf.traits.fertility = clamp(wolf.traits.fertility, 0, 10);

  wolf.age = Math.max(0, wolf.age);

  if (wolf.bonds) {
    Object.keys(wolf.bonds).forEach((id) => {
      wolf.bonds![id] = clamp(wolf.bonds![id], -100, 100);
    });
  }
}

// Random utilities with seeding support
export class SeededRandom {
  private seed: number;

  constructor(seed?: number) {
    this.seed = seed ?? Math.random() * 2147483647;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  choice<T>(array: T[]): T {
    if (array.length === 0) {
      throw new Error('Cannot choose from empty array');
    }
    return array[this.nextInt(0, array.length - 1)]!;
  }

  weightedChoice<T>(items: T[], weights: number[]): T {
    if (items.length === 0) {
      throw new Error('Cannot choose from empty array');
    }
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = this.next() * totalWeight;

    for (let i = 0; i < items.length; i++) {
      random -= weights[i]!;
      if (random <= 0) {
        return items[i]!;
      }
    }

    return items[items.length - 1]!;
  }
}

// Global random instance (can be seeded for testing)
export let random = new SeededRandom();

export function seedRandom(seed: number): void {
  random = new SeededRandom(seed);
}

// Wolf utility functions
export function isAlive(wolf: Wolf): boolean {
  return !wolf._dead && !wolf._dispersed;
}

export function isPup(wolf: Wolf): boolean {
  return wolf.role === 'pup';
}

export function isAdult(wolf: Wolf): boolean {
  return wolf.age >= 1.5 && !isPup(wolf);
}

export function isBreedingAge(wolf: Wolf): boolean {
  return wolf.age >= 1.0 && wolf.age <= 7.0;
}

export function canBreed(wolf: Wolf): boolean {
  return isBreedingAge(wolf) && isAlive(wolf) && !isPup(wolf);
}

export function getCombatScore(wolf: Wolf): number {
  return wolf.stats.strength + wolf.stats.speed + wolf.traits.bravery;
}

// Pack utility functions
export function getAliveWolves(pack: Pack): Wolf[] {
  return pack.wolves.filter(isAlive);
}

export function getWolvesByRole(pack: Pack, role: Wolf['role']): Wolf[] {
  return getAliveWolves(pack).filter((w) => w.role === role);
}

export function getWolfById(pack: Pack, id: string): Wolf | undefined {
  return pack.wolves.find((w) => w.id === id);
}

export function removeWolf(pack: Pack, id: string): boolean {
  const index = pack.wolves.findIndex((w) => w.id === id);
  if (index >= 0) {
    pack.wolves.splice(index, 1);
    return true;
  }
  return false;
}

// Season utilities
export function getCurrentSeason(
  day: number,
  daysPerSeason: number = 40
): Pack['season'] {
  const seasons: Pack['season'][] = ['spring', 'summer', 'autumn', 'winter'];
  const seasonIndex = Math.floor((day - 1) / daysPerSeason) % 4;
  return seasons[seasonIndex]!;
}

export function isSpring(season: Pack['season']): boolean {
  return season === 'spring';
}

export function getSeasonModifier(
  season: Pack['season'],
  type: 'hunt' | 'battle'
): number {
  switch (season) {
    case 'spring':
      return type === 'hunt' ? 1.0 : 1.0;
    case 'summer':
      return type === 'hunt' ? 1.2 : 1.0;
    case 'autumn':
      return type === 'hunt' ? 1.0 : 1.1;
    case 'winter':
      return type === 'hunt' ? 0.8 : 1.0;
    default:
      return 1.0;
  }
}

// Text template replacement
export function replaceTemplate(
  template: string,
  variables: Record<string, unknown>
): string {
  return template.replace(/\{([^}]+)\}/g, (match, key) => {
    const value = getField(variables, key);
    return value !== undefined ? String(value) : match;
  });
}

// ID generation
export function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 7);
  return `${prefix}${timestamp}_${randomPart}`;
}
