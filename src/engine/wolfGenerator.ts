import type { Wolf, Role } from '../types/wolf';
import { random, generateId } from '../types/utils';
import { appearanceGenerator } from './appearance';

export interface WolfGeneratorConfig {
  minPackSize: number;
  maxPackSize: number;
  guaranteedRoles: Role[];
  ageDistribution: {
    min: number;
    max: number;
    pupsPercent: number;
    adultsPercent: number;
    eldersPercent: number;
  };
}

export const DEFAULT_GENERATOR_CONFIG: WolfGeneratorConfig = {
  minPackSize: 7,
  maxPackSize: 10,
  guaranteedRoles: ['alpha', 'beta', 'healer'],
  ageDistribution: {
    min: 0.5,
    max: 8,
    pupsPercent: 0.2, // 20% pups
    adultsPercent: 0.7, // 70% adults
    eldersPercent: 0.1, // 10% elders
  },
};

export class WolfGenerator {
  private config: WolfGeneratorConfig;

  // Biome-specific name pools for varied wolf names
  private readonly BIOME_NAME_POOLS = {
    forest: {
      nature: [
        'Oak',
        'Pine',
        'Cedar',
        'Willow',
        'Birch',
        'Maple',
        'Elm',
        'Fern',
        'Moss',
        'Ivy',
        'Bramble',
        'Sage',
        'Grove',
        'Shade',
        'Thorn',
        'Brook',
        'Stream',
        'Glade',
        'Hollow',
        'Branch',
        'Leaf',
        'Root',
        'Bark',
        'Timber',
      ],
      weather: ['Mist', 'Dew', 'Rain', 'Fog', 'Drizzle', 'Storm'],
      features: ['Ridge', 'Vale', 'Glen', 'Trail', 'Path', 'Clearing'],
    },
    mountain: {
      nature: [
        'Stone',
        'Rock',
        'Granite',
        'Slate',
        'Cliff',
        'Peak',
        'Summit',
        'Ridge',
        'Boulder',
        'Crag',
        'Ledge',
        'Scree',
        'Alpine',
        'Glacier',
        'Avalanche',
      ],
      weather: [
        'Wind',
        'Storm',
        'Thunder',
        'Lightning',
        'Blizzard',
        'Frost',
        'Snow',
      ],
      features: ['Canyon', 'Gorge', 'Pass', 'Vista', 'Echo', 'Chasm'],
    },
    plains: {
      nature: [
        'Grass',
        'Prairie',
        'Meadow',
        'Field',
        'Wheat',
        'Barley',
        'Rye',
        'Oat',
        'Clover',
        'Heather',
        'Sage',
        'Horizon',
        'Distant',
        'Endless',
        'Open',
      ],
      weather: ['Wind', 'Breeze', 'Gust', 'Calm', 'Clear', 'Sunny', 'Bright'],
      features: ['Hill', 'Knoll', 'Mound', 'Rolling', 'Wide', 'Vast'],
    },
    tundra: {
      nature: [
        'Snow',
        'Ice',
        'Frost',
        'Winter',
        'Polar',
        'Arctic',
        'Frozen',
        'Crystal',
        'Lichen',
        'Permafrost',
        'Tundra',
        'North',
        'Boreal',
        'Frigid',
      ],
      weather: ['Blizzard', 'Gale', 'Chill', 'Bitter', 'Harsh', 'Cold'],
      features: ['Waste', 'Expanse', 'Plateau', 'Barren', 'Stark', 'White'],
    },
    desert: {
      nature: [
        'Sand',
        'Dune',
        'Oasis',
        'Cactus',
        'Sage',
        'Mesa',
        'Butte',
        'Sandstone',
        'Amber',
        'Gold',
        'Copper',
        'Bronze',
        'Rust',
        'Sienna',
        'Ochre',
      ],
      weather: ['Sun', 'Heat', 'Scorch', 'Blaze', 'Shimmer', 'Mirage'],
      features: ['Valley', 'Wash', 'Arroyo', 'Canyon', 'Dry', 'Arid'],
    },
    swamp: {
      nature: [
        'Marsh',
        'Bog',
        'Mud',
        'Reed',
        'Cattail',
        'Cypress',
        'Moss',
        'Lily',
        'Mangrove',
        'Mire',
        'Fen',
        'Peat',
        'Algae',
        'Vine',
        'Creeper',
      ],
      weather: ['Mist', 'Fog', 'Humid', 'Damp', 'Murky', 'Vapor'],
      features: ['Bayou', 'Slough', 'Backwater', 'Pool', 'Shallow', 'Deep'],
    },
  };

  // Common name pools that work across all biomes
  private readonly COMMON_NAME_POOLS = {
    characteristics: [
      'Swift',
      'Strong',
      'Keen',
      'Bold',
      'Wise',
      'Brave',
      'Wild',
      'Free',
      'Noble',
      'Fierce',
      'Gentle',
      'Sharp',
      'Quick',
      'Steady',
      'Bright',
      'Dark',
    ],
    colors: [
      'Silver',
      'Gray',
      'Black',
      'White',
      'Brown',
      'Red',
      'Gold',
      'Copper',
      'Russet',
      'Tawny',
      'Sable',
      'Cream',
      'Ash',
      'Smoke',
      'Shadow',
    ],
  };

  // Legacy arrays moved to appearance generator

  constructor(config: WolfGeneratorConfig = DEFAULT_GENERATOR_CONFIG) {
    this.config = config;
  }

  generateRandomPack(biome: string = 'forest'): Wolf[] {
    const packSize = random.nextInt(
      this.config.minPackSize,
      this.config.maxPackSize
    );
    const wolves: Wolf[] = [];

    // First, generate guaranteed roles
    this.config.guaranteedRoles.forEach((role) => {
      const wolf = this.generateWolfWithRole(role, biome);
      wolves.push(wolf);
    });

    // Fill remaining slots with varied roles
    const remainingSlots = packSize - wolves.length;
    const availableRoles: Role[] = ['hunter', 'omega', 'hunter', 'hunter']; // More hunters

    for (let i = 0; i < remainingSlots; i++) {
      const role = random.choice(availableRoles);
      const wolf = this.generateWolfWithRole(role, biome);
      wolves.push(wolf);
    }

    // Apply age distribution
    this.applyAgeDistribution(wolves);

    // Create some mating pairs for genetic diversity
    this.createMatingPairs(wolves);

    return wolves;
  }

  private generateWolfWithRole(role: Role, biome: string = 'forest'): Wolf {
    const wolf: Wolf = {
      id: generateId('w'),
      name: this.generateRandomName(biome),
      sex: random.choice(['male', 'female']),
      age: this.generateAgeForRole(role),
      role,
      appearance: this.generateBiomeAppearance(biome),
      stats: this.generateRandomStats(role),
      traits: this.generateRandomTraits(role),
      xp: random.nextInt(0, 50),
      level: 0,
      bonds: {},
      breedingHistory: { totalLitters: 0 },
      familyTree: {
        parentIds: [],
        siblingIds: [],
        offspringIds: [],
      },
    };

    return wolf;
  }

  private generateRandomName(biome: string = 'forest'): string {
    // Get biome-specific pools, fallback to forest if biome not found
    const biomePool =
      this.BIOME_NAME_POOLS[biome as keyof typeof this.BIOME_NAME_POOLS] ||
      this.BIOME_NAME_POOLS.forest;

    // Combine biome-specific pools with common pools
    const allPools = [
      ...Object.values(biomePool),
      ...Object.values(this.COMMON_NAME_POOLS),
    ];

    // 70% chance to use biome-specific names, 30% chance for common names
    const usesBiomeSpecific = random.next() < 0.7;
    const selectedPool = usesBiomeSpecific
      ? random.choice(Object.values(biomePool))
      : random.choice(Object.values(this.COMMON_NAME_POOLS));

    // 20% chance of compound name
    if (random.next() < 0.2) {
      const firstPart = random.choice(selectedPool);
      const secondPool = random.choice(allPools);
      const secondPart = random.choice(secondPool);
      return `${firstPart}${secondPart.toLowerCase()}`;
    }

    return random.choice(selectedPool);
  }

  private generateBiomeAppearance(biome: string) {
    return appearanceGenerator.generateBiomeAppearance(biome);
  }

  private generateRandomStats(role: Role) {
    // Base stats with role modifiers
    const baseStats = {
      health: random.nextInt(70, 95),
      strength: random.nextInt(4, 8),
      speed: random.nextInt(4, 8),
      intelligence: random.nextInt(4, 8),
    };

    // Apply role-specific bonuses
    switch (role) {
      case 'alpha':
        baseStats.strength += random.nextInt(1, 3);
        baseStats.intelligence += random.nextInt(1, 2);
        baseStats.health = Math.max(85, baseStats.health);
        break;
      case 'beta':
        baseStats.intelligence += random.nextInt(1, 2);
        baseStats.strength += random.nextInt(0, 2);
        baseStats.health = Math.max(80, baseStats.health);
        break;
      case 'healer':
        baseStats.intelligence += random.nextInt(2, 3);
        baseStats.health += random.nextInt(5, 10);
        break;
      case 'hunter':
        baseStats.speed += random.nextInt(1, 3);
        baseStats.strength += random.nextInt(1, 2);
        break;
      case 'pup':
        // Pups have lower stats
        baseStats.health = random.nextInt(60, 80);
        baseStats.strength = random.nextInt(2, 4);
        baseStats.speed = random.nextInt(3, 5);
        baseStats.intelligence = random.nextInt(3, 5);
        break;
      case 'elder':
        // Elders have high intelligence but lower physical stats
        baseStats.intelligence += random.nextInt(2, 4);
        baseStats.strength = Math.max(
          3,
          baseStats.strength - random.nextInt(1, 2)
        );
        baseStats.speed = Math.max(3, baseStats.speed - random.nextInt(1, 2));
        break;
    }

    // Clamp to valid ranges
    return {
      health: Math.min(100, Math.max(30, baseStats.health)),
      strength: Math.min(10, Math.max(1, baseStats.strength)),
      speed: Math.min(10, Math.max(1, baseStats.speed)),
      intelligence: Math.min(10, Math.max(1, baseStats.intelligence)),
    };
  }

  private generateRandomTraits(role: Role) {
    const baseTraits = {
      bravery: random.nextInt(3, 8),
      sociability: random.nextInt(3, 8),
      trainability: random.nextInt(3, 8),
      fertility: random.nextInt(3, 8),
    };

    // Apply role-specific trait modifiers
    switch (role) {
      case 'alpha':
        baseTraits.bravery += random.nextInt(1, 3);
        baseTraits.sociability += random.nextInt(0, 2);
        break;
      case 'beta':
        baseTraits.sociability += random.nextInt(1, 2);
        baseTraits.trainability += random.nextInt(1, 2);
        break;
      case 'healer':
        baseTraits.sociability += random.nextInt(2, 3);
        baseTraits.trainability += random.nextInt(1, 2);
        baseTraits.fertility -= random.nextInt(1, 2); // Often less focused on breeding
        break;
      case 'hunter':
        baseTraits.bravery += random.nextInt(1, 2);
        baseTraits.trainability += random.nextInt(1, 2);
        break;
      case 'pup':
        // Pups have undeveloped traits
        baseTraits.fertility = 0;
        baseTraits.trainability += random.nextInt(1, 3); // High learning potential
        break;
      case 'omega':
        baseTraits.sociability += random.nextInt(1, 2);
        break;
      case 'elder':
        baseTraits.trainability += random.nextInt(1, 3); // Wisdom
        baseTraits.fertility = Math.max(
          1,
          baseTraits.fertility - random.nextInt(2, 4)
        );
        break;
    }

    // Clamp to valid ranges
    return {
      bravery: Math.min(10, Math.max(1, baseTraits.bravery)),
      sociability: Math.min(10, Math.max(1, baseTraits.sociability)),
      trainability: Math.min(10, Math.max(1, baseTraits.trainability)),
      fertility: Math.min(10, Math.max(0, baseTraits.fertility)),
    };
  }

  private generateAgeForRole(role: Role): number {
    switch (role) {
      case 'pup':
        return random.nextFloat(0.3, 1.4);
      case 'alpha':
      case 'beta':
        return random.nextFloat(2.5, 6);
      case 'healer':
        return random.nextFloat(2, 7);
      case 'hunter':
        return random.nextFloat(1.5, 5);
      case 'omega':
        return random.nextFloat(1.5, 4);
      case 'elder':
        return random.nextFloat(7, 10);
      default:
        return random.nextFloat(2, 5);
    }
  }

  private applyAgeDistribution(wolves: Wolf[]): void {
    // Count current age distribution
    const pups = wolves.filter((w) => w.age < 1.5).length;

    const targetPups = Math.floor(
      wolves.length * this.config.ageDistribution.pupsPercent
    );

    // Adjust ages if needed (simplified approach)
    const adjustableWolves = wolves.filter(
      (w) => !this.config.guaranteedRoles.includes(w.role) || w.role === 'omega'
    );

    // Convert some wolves to pups if needed
    if (pups < targetPups) {
      const needMorePups = Math.min(targetPups - pups, adjustableWolves.length);
      for (let i = 0; i < needMorePups; i++) {
        const wolf = adjustableWolves[i];
        if (wolf && wolf.role !== 'alpha' && wolf.role !== 'beta') {
          wolf.age = random.nextFloat(0.8, 1.4);
          wolf.role = 'pup';
        }
      }
    }
  }

  private createMatingPairs(wolves: Wolf[]): void {
    const breedingAgeWolves = wolves.filter(
      (w) =>
        w.age >= 2 &&
        w.age < 8 &&
        (w.role === 'alpha' || w.role === 'beta' || w.role === 'hunter')
    );

    const males = breedingAgeWolves.filter((w) => w.sex === 'male');
    const females = breedingAgeWolves.filter((w) => w.sex === 'female');

    // Create 1-2 established pairs
    const maxPairs = Math.min(
      2,
      Math.floor(Math.min(males.length, females.length))
    );

    for (let i = 0; i < maxPairs && random.next() < 0.6; i++) {
      if (males.length > i && females.length > i) {
        const male = males[i];
        const female = females[i];

        if (male && female) {
          // Set them as mates
          male.mateId = female.id;
          female.mateId = male.id;

          // Initialize bonds if needed
          if (!male.bonds) male.bonds = {};
          if (!female.bonds) female.bonds = {};

          // Give them some bond strength
          male.bonds[female.id] = random.nextInt(60, 90);
          female.bonds[male.id] = random.nextInt(60, 90);
        }
      }
    }
  }

  // Generate a random biome for pack creation
  generateRandomBiome(): string {
    const biomes = [
      'forest',
      'mountain',
      'plains',
      'tundra',
      'desert',
      'swamp',
    ];
    return random.choice(biomes);
  }

  // Generate a specific wolf type for testing
  generateSpecificWolf(
    role: Role,
    name?: string,
    biome: string = 'forest'
  ): Wolf {
    const wolf = this.generateWolfWithRole(role, biome);
    if (name) {
      wolf.name = name;
    }
    return wolf;
  }

  // Update configuration
  updateConfig(newConfig: Partial<WolfGeneratorConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Export singleton instance
export const wolfGenerator = new WolfGenerator();
