export interface RivalPack {
  id: string;
  name: string;
  strength: number; // simple rating
  lastRaidDay?: number;
  aggression: number; // 0-10, affects raid frequency
}

export interface Territory {
  biome: string;
  rivalPacks: RivalPack[];
  foodRichness: number; // modifies hunt success
  herbAbundance: number; // affects herb gathering
  dangerLevel: number; // affects injury rates
}

export interface BattleResult {
  winner: 'attacker' | 'defender';
  attackerDamage: number;
  defenderDamage: number;
  loserDamage: number;
  casualties: string[]; // wolf IDs that died
}
