import type { Pack } from '../types/pack';
import type { Wolf } from '../types/wolf';

/**
 * Migrates a pack to handle deprecated features and ensure compatibility
 */
export function migratePack(pack: Pack): Pack {
  return {
    ...pack,
    wolves: pack.wolves.map(migrateWolf),
    // Ensure matingPairs exists for backward compatibility
    matingPairs: pack.matingPairs || [],
  };
}

/**
 * Migrates a wolf to handle deprecated roles and features
 */
export function migrateWolf(wolf: Wolf): Wolf {
  return {
    ...wolf,
    // Convert alpha_mate role to beta (with type assertion for backward compatibility)
    role: (wolf.role as string) === 'alpha_mate' ? 'beta' : wolf.role,
    // Ensure new fields exist with defaults
    breedingHistory: wolf.breedingHistory || { totalLitters: 0 },
    familyTree: wolf.familyTree || {
      parentIds: [],
      siblingIds: [],
      offspringIds: [],
    },
    relationships: wolf.relationships || {},
  };
}
