import type { Appearance, Wolf } from '../types/wolf';
// import type { GameConfig } from '../types/pack';
import { random } from '../types/utils';

export interface AppearanceGene {
  trait: string;
  alleles: [string, string]; // Dominant/recessive pair
  expression: string; // Phenotype result
}

export interface GeneticAppearance {
  baseColorGenes: AppearanceGene;
  patternGenes: AppearanceGene;
  eyeColorGenes: AppearanceGene;
  sizeGenes: AppearanceGene;
  furLengthGenes: AppearanceGene;
  appearance: Appearance;
}

export class AppearanceGenerator {
  // Base color genetics with realistic wolf color combinations
  private readonly BASE_COLOR_GENETICS = {
    black: { dominant: true, code: 'BB' },
    dark_brown: { dominant: true, code: 'Bb' },
    brown: { dominant: false, code: 'bb' },
    gray: { dominant: true, code: 'GG' },
    light_gray: { dominant: false, code: 'Gg' },
    white: { dominant: false, code: 'ww' },
    red: { dominant: false, code: 'rr' },
    cream: { dominant: false, code: 'cc' },
    silver: { dominant: false, code: 'ss' },
    tawny: { dominant: false, code: 'tt' },
  };

  // Pattern genetics
  private readonly PATTERN_GENETICS = {
    solid: { weight: 40, genes: ['S', 'S'] },
    agouti: { weight: 25, genes: ['A', 'a'] },
    brindle: { weight: 15, genes: ['B', 'b'] },
    merle: { weight: 8, genes: ['M', 'm'] },
    patched: { weight: 12, genes: ['P', 'p'] },
  };

  // Eye color with realistic combinations
  private readonly EYE_COLOR_GENETICS = {
    amber: { weight: 30, common: true },
    brown: { weight: 25, common: true },
    yellow: { weight: 20, common: true },
    gold: { weight: 15, common: true },
    green: { weight: 5, rare: true },
    blue: { weight: 3, rare: true, special: 'merle_linked' },
    hazel: { weight: 2, rare: true },
  };

  // Fur characteristics
  private readonly FUR_CHARACTERISTICS = {
    length: ['short', 'medium', 'long'],
    texture: ['smooth', 'coarse', 'fluffy'],
    bodySize: ['small', 'medium', 'large'],
    earShape: ['pointed', 'rounded', 'large'],
    tailType: ['thick', 'bushy', 'thin', 'plume'],
  };

  // Realistic color combinations
  private readonly COLOR_COMBINATIONS = {
    black: {
      markings: ['white', 'gray', 'silver'],
      noseColors: ['black', 'dark_gray'],
      pawPadColors: ['black', 'dark_gray'],
    },
    brown: {
      markings: ['cream', 'white', 'tan'],
      noseColors: ['brown', 'black'],
      pawPadColors: ['brown', 'black'],
    },
    gray: {
      markings: ['white', 'cream', 'black'],
      noseColors: ['black', 'gray'],
      pawPadColors: ['black', 'gray'],
    },
    white: {
      markings: ['gray', 'cream', 'black'],
      noseColors: ['pink', 'black'],
      pawPadColors: ['pink', 'black'],
    },
    red: {
      markings: ['white', 'cream', 'black'],
      noseColors: ['black', 'brown'],
      pawPadColors: ['black', 'brown'],
    },
  };

  constructor() {
    // Configuration can be added in future versions
  }

  setConfig(): void {
    // Configuration can be added in future versions
  }

  generateRandomAppearance(): Appearance {
    // Generate base traits
    const baseColor = this.selectWeightedColor();
    const pattern = this.selectWeightedPattern();
    const eyeColor = this.selectEyeColor(pattern);

    // Get color-appropriate markings
    const colorCombo =
      this.COLOR_COMBINATIONS[
        baseColor as keyof typeof this.COLOR_COMBINATIONS
      ] || this.COLOR_COMBINATIONS.brown;

    const appearance: Appearance = {
      // Legacy compatibility
      furColor: baseColor,
      pattern: pattern,
      eyeColor: eyeColor,
      scars: this.generateScars(),

      // Enhanced traits
      baseColor: baseColor,
      markingColor: random.choice(colorCombo.markings),
      markingType: this.getMarkingType(pattern),
      noseColor: random.choice(colorCombo.noseColors),
      pawPadColor: random.choice(colorCombo.pawPadColors),
      furLength: random.choice(this.FUR_CHARACTERISTICS.length) as
        | 'short'
        | 'medium'
        | 'long',
      furTexture: random.choice(this.FUR_CHARACTERISTICS.texture) as
        | 'smooth'
        | 'coarse'
        | 'fluffy',
      bodySize: random.choice(this.FUR_CHARACTERISTICS.bodySize) as
        | 'small'
        | 'medium'
        | 'large',
      earShape: random.choice(this.FUR_CHARACTERISTICS.earShape) as
        | 'pointed'
        | 'rounded'
        | 'large',
      tailType: random.choice(this.FUR_CHARACTERISTICS.tailType) as
        | 'thick'
        | 'bushy'
        | 'thin'
        | 'plume',
    };

    return appearance;
  }

  private selectWeightedColor(): string {
    const colors = Object.keys(this.BASE_COLOR_GENETICS);
    const weights = [20, 18, 15, 12, 10, 8, 7, 5, 3, 2]; // Realistic frequency

    return this.weightedRandom(colors, weights);
  }

  private selectWeightedPattern(): string {
    const patterns = Object.keys(this.PATTERN_GENETICS);
    const weights = Object.values(this.PATTERN_GENETICS).map((p) => p.weight);

    return this.weightedRandom(patterns, weights);
  }

  private selectEyeColor(pattern: string): string {
    const eyeColors = Object.keys(this.EYE_COLOR_GENETICS);
    const weights = Object.values(this.EYE_COLOR_GENETICS).map((e) => e.weight);

    // Blue eyes more likely with merle pattern
    if (pattern === 'merle') {
      const blueIndex = eyeColors.indexOf('blue');
      if (blueIndex >= 0 && weights[blueIndex] !== undefined) {
        weights[blueIndex] *= 8; // Much higher chance
      }
    }

    return this.weightedRandom(eyeColors, weights);
  }

  private getMarkingType(pattern: string): string {
    const markingTypes = {
      solid: 'none',
      agouti: 'ticked',
      brindle: 'striped',
      merle: 'mottled',
      patched: 'spotted',
    };

    return markingTypes[pattern as keyof typeof markingTypes] || 'none';
  }

  private generateScars(): string[] {
    const scars: string[] = [];
    const scarChance = 0.25; // 25% chance of having scars

    if (random.next() < scarChance) {
      const scarTypes = [
        'ear notch',
        'facial scar',
        'leg scar',
        'shoulder mark',
        'chest mark',
        'back stripe',
        'tail tip',
        'paw scar',
        'neck scar',
        'flank mark',
      ];

      const numScars = random.next() < 0.7 ? 1 : random.nextInt(2, 4);

      for (let i = 0; i < numScars; i++) {
        const scar = random.choice(scarTypes);
        if (!scars.includes(scar)) {
          scars.push(scar);
        }
      }
    }

    return scars;
  }

  private weightedRandom(items: string[], weights: number[]): string {
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let randomNum = random.next() * totalWeight;

    for (let i = 0; i < items.length; i++) {
      randomNum -= weights[i]!;
      if (randomNum <= 0) {
        return items[i]!;
      }
    }

    return items[items.length - 1]!; // Fallback
  }

  // Genetic inheritance system for breeding
  inheritAppearance(mother: Wolf, father?: Wolf): Appearance {
    const fatherApp = father?.appearance || {
      furColor: 'brown',
      pattern: 'solid',
      eyeColor: 'brown',
      scars: [],
    };
    return this.geneticInheritance(mother.appearance, fatherApp);
  }

  private geneticInheritance(
    motherApp: Appearance,
    fatherApp: Appearance
  ): Appearance {
    // Weighted inheritance with genetic mixing
    const baseColor = this.inheritTrait(
      motherApp.baseColor || motherApp.furColor,
      fatherApp.baseColor || fatherApp.furColor,
      0.6 // 60% chance to inherit from one parent, 40% chance for mixing
    );

    const pattern = this.inheritTrait(
      motherApp.pattern,
      fatherApp.pattern,
      0.7 // Patterns are more heritable
    );

    const eyeColor = this.inheritEyeColor(motherApp, fatherApp);

    // Get appropriate color combinations
    const colorCombo =
      this.COLOR_COMBINATIONS[
        baseColor as keyof typeof this.COLOR_COMBINATIONS
      ] || this.COLOR_COMBINATIONS.brown;

    const appearance: Appearance = {
      // Legacy traits
      furColor: baseColor,
      pattern: pattern,
      eyeColor: eyeColor,
      scars: [], // Scars are not inherited

      // Enhanced traits with genetic mixing
      baseColor: baseColor,
      markingColor: this.inheritTrait(
        motherApp.markingColor,
        fatherApp.markingColor,
        0.5,
        colorCombo.markings
      ),
      markingType: this.getMarkingType(pattern),
      noseColor: this.inheritTrait(
        motherApp.noseColor,
        fatherApp.noseColor,
        0.6,
        colorCombo.noseColors
      ),
      pawPadColor: this.inheritTrait(
        motherApp.pawPadColor,
        fatherApp.pawPadColor,
        0.6,
        colorCombo.pawPadColors
      ),
      furLength: this.inheritPhysicalTrait(
        motherApp.furLength,
        fatherApp.furLength,
        this.FUR_CHARACTERISTICS.length
      ) as 'short' | 'medium' | 'long',
      furTexture: this.inheritPhysicalTrait(
        motherApp.furTexture,
        fatherApp.furTexture,
        this.FUR_CHARACTERISTICS.texture
      ) as 'smooth' | 'coarse' | 'fluffy',
      bodySize: this.inheritPhysicalTrait(
        motherApp.bodySize,
        fatherApp.bodySize,
        this.FUR_CHARACTERISTICS.bodySize
      ) as 'small' | 'medium' | 'large',
      earShape: this.inheritPhysicalTrait(
        motherApp.earShape,
        fatherApp.earShape,
        this.FUR_CHARACTERISTICS.earShape
      ) as 'pointed' | 'rounded' | 'large',
      tailType: this.inheritPhysicalTrait(
        motherApp.tailType,
        fatherApp.tailType,
        this.FUR_CHARACTERISTICS.tailType
      ) as 'thick' | 'bushy' | 'thin' | 'plume',
    };

    // Small chance of mutations
    if (random.next() < 0.05) {
      // 5% mutation chance
      appearance.eyeColor = this.mutateEyeColor(appearance.eyeColor);
    }

    return appearance;
  }

  private inheritTrait(
    motherTrait: string | undefined,
    fatherTrait: string | undefined,
    inheritanceRate: number,
    fallbackOptions?: string[]
  ): string {
    const validMother = motherTrait || '';
    const validFather = fatherTrait || '';

    if (!validMother && !validFather) {
      return fallbackOptions ? random.choice(fallbackOptions) : 'brown';
    }

    if (!validMother) return validFather;
    if (!validFather) return validMother;

    // Genetic inheritance with some randomness
    if (random.next() < inheritanceRate) {
      return random.choice([validMother, validFather]);
    } else {
      // Rare recessive trait expression or mutation
      return fallbackOptions ? random.choice(fallbackOptions) : validMother;
    }
  }

  private inheritPhysicalTrait(
    motherTrait: string | undefined,
    fatherTrait: string | undefined,
    options: string[]
  ): string {
    // Physical traits blend more
    const validMother = motherTrait || random.choice(options);
    const validFather = fatherTrait || random.choice(options);

    // 70% chance to inherit from parents, 30% chance for new expression
    if (random.next() < 0.7) {
      return random.choice([validMother, validFather]);
    } else {
      return random.choice(options);
    }
  }

  private inheritEyeColor(
    motherApp: Appearance,
    fatherApp: Appearance
  ): string {
    const motherEye = motherApp.eyeColor;
    const fatherEye = fatherApp.eyeColor;

    // Special cases for rare eye colors
    if ((motherEye === 'blue' || fatherEye === 'blue') && random.next() < 0.3) {
      return 'blue'; // Blue eyes have some heritability
    }

    if (
      (motherEye === 'green' || fatherEye === 'green') &&
      random.next() < 0.2
    ) {
      return 'green'; // Green eyes less heritable
    }

    // Standard inheritance
    return this.inheritTrait(motherEye, fatherEye, 0.65);
  }

  private mutateEyeColor(currentColor: string): string {
    // Mutation to adjacent colors
    const mutations: Record<string, string[]> = {
      brown: ['amber', 'hazel'],
      amber: ['brown', 'yellow', 'gold'],
      yellow: ['amber', 'gold'],
      gold: ['yellow', 'amber'],
      green: ['hazel', 'amber'],
      blue: ['green', 'hazel'],
      hazel: ['brown', 'green'],
    };

    const possibleMutations = mutations[currentColor] || ['amber'];
    return random.choice(possibleMutations);
  }

  // Generate appearance for specific biomes
  generateBiomeAppearance(biome: string): Appearance {
    const biomeColorMods = {
      tundra: {
        favoredColors: ['white', 'light_gray', 'silver'],
        weights: [40, 30, 20],
      },
      desert: {
        favoredColors: ['tawny', 'red', 'cream'],
        weights: [35, 25, 20],
      },
      forest: {
        favoredColors: ['brown', 'dark_brown', 'black'],
        weights: [30, 25, 20],
      },
      mountain: {
        favoredColors: ['gray', 'black', 'brown'],
        weights: [30, 25, 20],
      },
    };

    const biomeMod = biomeColorMods[biome as keyof typeof biomeColorMods];
    let baseColor: string;

    if (biomeMod && random.next() < 0.6) {
      // 60% chance to use biome-appropriate colors
      baseColor = this.weightedRandom(biomeMod.favoredColors, biomeMod.weights);
    } else {
      baseColor = this.selectWeightedColor();
    }

    const appearance = this.generateRandomAppearance();
    appearance.furColor = baseColor;
    appearance.baseColor = baseColor;

    return appearance;
  }
}

// Export singleton instance
export const appearanceGenerator = new AppearanceGenerator();
