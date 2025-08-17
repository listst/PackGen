import { useState, useRef } from 'react';
import type { Pack } from '../../types/pack';
import {
  SaveLoadManager,
  formatSaveDate,
  formatFileSize,
  generateSavePreview,
  type SavedGame,
} from '../../utils/saveLoad';

interface SaveLoadPanelProps {
  pack: Pack;
  onPackLoad: (pack: Pack) => void;
  onSaveComplete?: (savedGame: SavedGame) => void;
}

export function SaveLoadPanel({
  pack,
  onPackLoad,
  onSaveComplete,
}: SaveLoadPanelProps) {
  const [savedGames, setSavedGames] = useState<SavedGame[]>(() =>
    SaveLoadManager.getSavedGames()
  );
  const [saveName, setSaveName] = useState('');
  const [selectedSave, setSelectedSave] = useState<SavedGame | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [exportData, setExportData] = useState('');
  const [importData, setImportData] = useState('');
  const [showImport, setShowImport] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshSavedGames = () => {
    setSavedGames(SaveLoadManager.getSavedGames());
  };

  const handleSave = () => {
    try {
      const savedGame = SaveLoadManager.saveGame(pack, saveName || undefined);
      setSaveName('');
      refreshSavedGames();
      onSaveComplete?.(savedGame);
    } catch (error) {
      console.error('Failed to save game:', error);
      alert('Failed to save game. Check browser storage.');
    }
  };

  const handleLoad = (saveId: string) => {
    try {
      const loadedPack = SaveLoadManager.loadGame(saveId);
      if (loadedPack) {
        onPackLoad(loadedPack);
      } else {
        alert('Failed to load game.');
      }
    } catch (error) {
      console.error('Failed to load game:', error);
      alert('Failed to load game.');
    }
  };

  const handleDelete = (saveId: string) => {
    if (confirm('Are you sure you want to delete this save?')) {
      SaveLoadManager.deleteSave(saveId);
      refreshSavedGames();
      if (selectedSave?.id === saveId) {
        setSelectedSave(null);
      }
    }
  };

  const handleExport = () => {
    try {
      const data = SaveLoadManager.exportGame(pack);
      setExportData(data);
      setShowExport(true);
    } catch (error) {
      console.error('Failed to export game:', error);
      alert('Failed to export game.');
    }
  };

  const handleDownloadExport = () => {
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pack.name.replace(/[^a-z0-9]/gi, '_')}_Day${pack.day}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    try {
      const importedPack = SaveLoadManager.importGame(importData);
      if (importedPack) {
        onPackLoad(importedPack);
        setImportData('');
        setShowImport(false);
      } else {
        alert('Invalid save data format.');
      }
    } catch (error) {
      console.error('Failed to import game:', error);
      alert('Failed to import game. Check the format.');
    }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImportData(result);
        setShowImport(true);
      };
      reader.readAsText(file);
    }
  };

  const handleClearAllSaves = () => {
    if (
      confirm(
        'Are you sure you want to delete ALL saved games? This cannot be undone.'
      )
    ) {
      SaveLoadManager.clearAllSaves();
      refreshSavedGames();
      setSelectedSave(null);
    }
  };

  const storageUsage = SaveLoadManager.getStorageUsage();

  return (
    <div style={{ color: '#e0e0e0' }}>
      <h2
        style={{
          margin: '0 0 20px 0',
          color: '#4fc3f7',
          fontSize: '1.6rem',
        }}
      >
        💾 Save & Load
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
        }}
      >
        {/* Left Column - Save Current Game */}
        <div>
          {/* Save Current Game */}
          <section style={{ marginBottom: '24px' }}>
            <h3
              style={{
                margin: '0 0 12px 0',
                color: '#4fc3f7',
                fontSize: '1.2rem',
              }}
            >
              Save Current Game
            </h3>
            <div
              style={{
                backgroundColor: '#2a2a2a',
                borderRadius: '8px',
                padding: '16px',
                border: '1px solid #404040',
              }}
            >
              <div style={{ marginBottom: '12px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '4px',
                    fontSize: '14px',
                  }}
                >
                  Save Name (optional):
                </label>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder={`${pack.name} - Day ${pack.day}`}
                  style={{
                    width: '100%',
                    padding: '8px',
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #404040',
                    borderRadius: '4px',
                    color: '#e0e0e0',
                    fontSize: '14px',
                  }}
                />
              </div>
              <button
                onClick={handleSave}
                style={{
                  width: '100%',
                  backgroundColor: '#4caf50',
                  color: '#1a1a1a',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                💾 Save Game
              </button>
            </div>
          </section>

          {/* Import/Export */}
          <section style={{ marginBottom: '24px' }}>
            <h3
              style={{
                margin: '0 0 12px 0',
                color: '#4fc3f7',
                fontSize: '1.2rem',
              }}
            >
              Import & Export
            </h3>
            <div
              style={{
                backgroundColor: '#2a2a2a',
                borderRadius: '8px',
                padding: '16px',
                border: '1px solid #404040',
              }}
            >
              <div style={{ display: 'grid', gap: '8px' }}>
                <button
                  onClick={handleExport}
                  style={{
                    backgroundColor: '#2196f3',
                    color: '#1a1a1a',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  📤 Export Current Game
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    backgroundColor: '#ff9800',
                    color: '#1a1a1a',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  📥 Import from File
                </button>
                <button
                  onClick={() => setShowImport(true)}
                  style={{
                    backgroundColor: '#9c27b0',
                    color: '#1a1a1a',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  📋 Import from Text
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileImport}
                style={{ display: 'none' }}
              />
            </div>
          </section>

          {/* Storage Info */}
          <section>
            <h3
              style={{
                margin: '0 0 12px 0',
                color: '#4fc3f7',
                fontSize: '1.2rem',
              }}
            >
              Storage Information
            </h3>
            <div
              style={{
                backgroundColor: '#2a2a2a',
                borderRadius: '8px',
                padding: '16px',
                border: '1px solid #404040',
              }}
            >
              <div style={{ display: 'grid', gap: '8px', fontSize: '14px' }}>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between' }}
                >
                  <span>Saved Games:</span>
                  <span style={{ fontWeight: 'bold' }}>
                    {savedGames.length}/10
                  </span>
                </div>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between' }}
                >
                  <span>Storage Used:</span>
                  <span style={{ fontWeight: 'bold' }}>
                    {formatFileSize(storageUsage)}
                  </span>
                </div>
              </div>
              {savedGames.length > 0 && (
                <button
                  onClick={handleClearAllSaves}
                  style={{
                    marginTop: '12px',
                    width: '100%',
                    backgroundColor: '#f44336',
                    color: '#1a1a1a',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  🗑️ Clear All Saves
                </button>
              )}
            </div>
          </section>
        </div>

        {/* Right Column - Load Game */}
        <div>
          <section>
            <h3
              style={{
                margin: '0 0 12px 0',
                color: '#4fc3f7',
                fontSize: '1.2rem',
              }}
            >
              Load Saved Game ({savedGames.length})
            </h3>

            {savedGames.length === 0 ? (
              <div
                style={{
                  backgroundColor: '#2a2a2a',
                  borderRadius: '8px',
                  padding: '20px',
                  textAlign: 'center',
                  border: '1px solid #404040',
                  opacity: 0.6,
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>💾</div>
                <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                  No Saved Games
                </div>
                <div style={{ fontSize: '14px' }}>
                  Save your current game to see it here.
                </div>
              </div>
            ) : (
              <div
                style={{
                  backgroundColor: '#2a2a2a',
                  borderRadius: '8px',
                  border: '1px solid #404040',
                  maxHeight: '500px',
                  overflowY: 'auto',
                }}
              >
                {savedGames.map((save) => (
                  <div
                    key={save.id}
                    onClick={() => setSelectedSave(save)}
                    style={{
                      padding: '16px',
                      borderBottom: '1px solid #404040',
                      cursor: 'pointer',
                      backgroundColor:
                        selectedSave?.id === save.id
                          ? '#404040'
                          : 'transparent',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'start',
                        marginBottom: '8px',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{ fontWeight: 'bold', marginBottom: '4px' }}
                        >
                          {save.name}
                        </div>
                        <div style={{ fontSize: '12px', opacity: 0.7 }}>
                          {formatSaveDate(save.savedAt)}
                        </div>
                        <div
                          style={{
                            fontSize: '13px',
                            opacity: 0.8,
                            marginTop: '4px',
                          }}
                        >
                          {generateSavePreview(save.pack)}
                        </div>
                      </div>
                      {save.name.includes('[AUTO]') && (
                        <span
                          style={{
                            backgroundColor: '#ff9800',
                            color: '#1a1a1a',
                            padding: '2px 6px',
                            borderRadius: '8px',
                            fontSize: '10px',
                            fontWeight: 'bold',
                          }}
                        >
                          AUTO
                        </span>
                      )}
                    </div>

                    {selectedSave?.id === save.id && (
                      <div
                        style={{
                          marginTop: '12px',
                          display: 'grid',
                          gap: '6px',
                        }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLoad(save.id);
                          }}
                          style={{
                            backgroundColor: '#4caf50',
                            color: '#1a1a1a',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                          }}
                        >
                          📂 Load Game
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(save.id);
                          }}
                          style={{
                            backgroundColor: '#f44336',
                            color: '#1a1a1a',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                          }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Export Modal */}
      {showExport && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setShowExport(false)}
        >
          <div
            style={{
              backgroundColor: '#2a2a2a',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
              color: '#e0e0e0',
              border: '1px solid #404040',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 16px 0', color: '#4fc3f7' }}>
              Export Game Data
            </h3>
            <div style={{ marginBottom: '16px' }}>
              <textarea
                value={exportData}
                readOnly
                style={{
                  width: '100%',
                  height: '200px',
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #404040',
                  borderRadius: '4px',
                  color: '#e0e0e0',
                  padding: '8px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  resize: 'vertical',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleDownloadExport}
                style={{
                  backgroundColor: '#4caf50',
                  color: '#1a1a1a',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                💾 Download File
              </button>
              <button
                onClick={() => navigator.clipboard.writeText(exportData)}
                style={{
                  backgroundColor: '#2196f3',
                  color: '#1a1a1a',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                📋 Copy to Clipboard
              </button>
              <button
                onClick={() => setShowExport(false)}
                style={{
                  backgroundColor: '#666',
                  color: '#e0e0e0',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setShowImport(false)}
        >
          <div
            style={{
              backgroundColor: '#2a2a2a',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
              color: '#e0e0e0',
              border: '1px solid #404040',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 16px 0', color: '#4fc3f7' }}>
              Import Game Data
            </h3>
            <div style={{ marginBottom: '16px' }}>
              <textarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                placeholder="Paste your game save data here..."
                style={{
                  width: '100%',
                  height: '200px',
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #404040',
                  borderRadius: '4px',
                  color: '#e0e0e0',
                  padding: '8px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  resize: 'vertical',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleImport}
                disabled={!importData.trim()}
                style={{
                  backgroundColor: importData.trim() ? '#4caf50' : '#666',
                  color: '#1a1a1a',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: importData.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                📥 Import Game
              </button>
              <button
                onClick={() => setShowImport(false)}
                style={{
                  backgroundColor: '#666',
                  color: '#e0e0e0',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
