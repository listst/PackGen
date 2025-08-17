import type { Pack } from '../types/pack';

export interface SavedGame {
  id: string;
  name: string;
  pack: Pack;
  savedAt: number;
  version: string;
}

const SAVE_VERSION = '1.0.0';
const STORAGE_KEY = 'packgen_saves';
const MAX_SAVES = 10;

export class SaveLoadManager {
  static saveGame(pack: Pack, saveName?: string): SavedGame {
    const saves = this.getSavedGames();

    // Generate save name if not provided
    const name = saveName || `${pack.name} - Day ${pack.day}`;

    const savedGame: SavedGame = {
      id: Date.now().toString(),
      name,
      pack: JSON.parse(JSON.stringify(pack)), // Deep clone
      savedAt: Date.now(),
      version: SAVE_VERSION,
    };

    // Add to saves array
    saves.unshift(savedGame);

    // Keep only the most recent saves
    if (saves.length > MAX_SAVES) {
      saves.splice(MAX_SAVES);
    }

    // Save to localStorage
    this.savesToStorage(saves);

    return savedGame;
  }

  static loadGame(saveId: string): Pack | null {
    const saves = this.getSavedGames();
    const savedGame = saves.find((save) => save.id === saveId);

    if (!savedGame) {
      return null;
    }

    // Validate version compatibility
    if (savedGame.version !== SAVE_VERSION) {
      console.warn(
        `Save version mismatch: ${savedGame.version} vs ${SAVE_VERSION}`
      );
      // Could implement migration logic here
    }

    return JSON.parse(JSON.stringify(savedGame.pack)); // Deep clone
  }

  static deleteSave(saveId: string): boolean {
    const saves = this.getSavedGames();
    const index = saves.findIndex((save) => save.id === saveId);

    if (index === -1) {
      return false;
    }

    saves.splice(index, 1);
    this.savesToStorage(saves);
    return true;
  }

  static getSavedGames(): SavedGame[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];

      const saves = JSON.parse(data) as SavedGame[];

      // Sort by savedAt timestamp, newest first
      return saves.sort((a, b) => b.savedAt - a.savedAt);
    } catch (error) {
      console.error('Failed to load saved games:', error);
      return [];
    }
  }

  static exportGame(pack: Pack): string {
    const exportData = {
      pack,
      exportedAt: Date.now(),
      version: SAVE_VERSION,
    };

    return JSON.stringify(exportData, null, 2);
  }

  static importGame(jsonData: string): Pack | null {
    try {
      const data = JSON.parse(jsonData);

      if (!data.pack) {
        throw new Error('Invalid save format: missing pack data');
      }

      // Basic validation
      if (
        !data.pack.name ||
        !data.pack.wolves ||
        !Array.isArray(data.pack.wolves)
      ) {
        throw new Error('Invalid pack data structure');
      }

      return data.pack as Pack;
    } catch (error) {
      console.error('Failed to import game:', error);
      return null;
    }
  }

  static createAutoSave(pack: Pack): SavedGame {
    return this.saveGame(pack, `[AUTO] ${pack.name} - Day ${pack.day}`);
  }

  static getStorageUsage(): number {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? new Blob([data]).size : 0;
    } catch {
      return 0;
    }
  }

  static clearAllSaves(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  private static savesToStorage(saves: SavedGame[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saves));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      throw error;
    }
  }
}

// Utility functions for formatting
export function formatSaveDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function generateSavePreview(pack: Pack): string {
  const aliveWolves = pack.wolves.filter((w) => !w._dead && !w._dispersed);
  return `${pack.season} • ${aliveWolves.length} wolves • ${pack.herbs} herbs`;
}
