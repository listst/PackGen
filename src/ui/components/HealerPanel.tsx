import { useState } from 'react';
import type { Pack } from '../../types/pack';
import type { Wolf } from '../../types/wolf';
import type { SimulationEngine } from '../../engine/simulation';
import { getWolvesByRole, isAlive } from '../../types/utils';

interface HealerPanelProps {
  pack: Pack;
  onPackUpdate: (pack: Pack) => void;
  simulationEngine: SimulationEngine;
}

export function HealerPanel({ pack, onPackUpdate, simulationEngine }: HealerPanelProps) {
  const [selectedHealer, setSelectedHealer] = useState<Wolf | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Wolf | null>(null);

  const healers = getWolvesByRole(pack, 'healer').filter(isAlive);
  const activeHealer = selectedHealer || healers[0] || null;
  const healerEngine = simulationEngine.getHealerEngine();

  const handleHealWolf = () => {
    if (!activeHealer || !selectedPatient) return;

    const newPack = { ...pack };
    try {
      const result = healerEngine.healWolf(
        activeHealer,
        selectedPatient,
        newPack
      );
      newPack.logs.push(
        `Day ${newPack.day}: ${activeHealer.name} ${result.success ? 'successfully ' : 'failed to '}heal ${selectedPatient.name}.`
      );
      onPackUpdate(newPack);
      setSelectedPatient(null);
    } catch (error) {
      console.error('Healing failed:', error);
    }
  };

  const handleAutoHeal = () => {
    if (!activeHealer) return;

    const newPack = { ...pack };
    const results = healerEngine.autoHeal(activeHealer, newPack, 3);
    results.forEach((result) => {
      const patient = newPack.wolves.find((w) => w.id === result.patientId);
      newPack.logs.push(
        `Day ${newPack.day}: ${activeHealer.name} ${result.success ? 'successfully ' : 'failed to '}heal ${patient?.name}.`
      );
    });
    onPackUpdate(newPack);
  };

  const handleGatherHerbs = () => {
    if (!activeHealer) return;

    const newPack = { ...pack };
    healerEngine.gatherHerbs(activeHealer, newPack);
    onPackUpdate(newPack);
  };

  const handleVisitCrystalPool = () => {
    if (!activeHealer) return;

    const newPack = { ...pack };
    const prophecyResult = healerEngine.visitCrystalPool(activeHealer, newPack);

    if (prophecyResult) {
      newPack.logs.push(
        `Day ${newPack.day}: ${activeHealer.name} received a prophecy: "${prophecyResult.text}"`
      );
    }

    onPackUpdate(newPack);
  };

  const wolvesNeedingHealing = healerEngine.getWolvesNeedingHealing(pack);
  const healerStatus = activeHealer
    ? healerEngine.getHealerStatus(activeHealer, pack)
    : null;

  return (
    <div style={{ color: '#e0e0e0' }}>
      <h2
        style={{
          margin: '0 0 20px 0',
          color: '#4fc3f7',
          fontSize: '1.6rem',
        }}
      >
        🔮 Healer Panel
      </h2>

      {healers.length === 0 ? (
        <div
          style={{
            backgroundColor: '#2a2a2a',
            borderRadius: '12px',
            padding: '24px',
            textAlign: 'center',
            border: '1px solid #404040',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>
            🐺
          </div>
          <h3 style={{ margin: '0 0 8px 0', opacity: 0.8 }}>
            No Healers Available
          </h3>
          <p style={{ margin: 0, opacity: 0.6 }}>
            Your pack needs a healer to tend to wounded wolves and discover
            prophecies.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '24px',
          }}
        >
          {/* Left Column - Healer Info & Actions */}
          <div>
            {/* Healer Selection */}
            {healers.length > 1 && (
              <section style={{ marginBottom: '20px' }}>
                <h3
                  style={{
                    margin: '0 0 12px 0',
                    color: '#45b7d1',
                    fontSize: '1.2rem',
                  }}
                >
                  Select Healer
                </h3>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {healers.map((healer) => (
                    <button
                      key={healer.id}
                      onClick={() => setSelectedHealer(healer)}
                      style={{
                        backgroundColor:
                          activeHealer?.id === healer.id
                            ? '#45b7d1'
                            : '#2a2a2a',
                        color:
                          activeHealer?.id === healer.id
                            ? '#1a1a1a'
                            : '#e0e0e0',
                        border: '1px solid #404040',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        fontWeight:
                          activeHealer?.id === healer.id ? 'bold' : 'normal',
                      }}
                    >
                      {healer.name}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Active Healer Status */}
            {activeHealer && healerStatus && (
              <section style={{ marginBottom: '20px' }}>
                <h3
                  style={{
                    margin: '0 0 12px 0',
                    color: '#45b7d1',
                    fontSize: '1.2rem',
                  }}
                >
                  {activeHealer.name} - Healer Status
                </h3>
                <div
                  style={{
                    backgroundColor: '#2a2a2a',
                    borderRadius: '8px',
                    padding: '16px',
                    border: '1px solid #404040',
                  }}
                >
                  <div
                    style={{ display: 'grid', gap: '8px', fontSize: '14px' }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>Health:</span>
                      <span
                        style={{
                          color:
                            activeHealer.stats.health > 70
                              ? '#4caf50'
                              : activeHealer.stats.health > 40
                                ? '#ff9800'
                                : '#f44336',
                          fontWeight: 'bold',
                        }}
                      >
                        {activeHealer.stats.health}/100
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>Intelligence:</span>
                      <span style={{ fontWeight: 'bold' }}>
                        {activeHealer.stats.intelligence}/10
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>Remaining Tends:</span>
                      <span style={{ fontWeight: 'bold' }}>
                        {healerStatus.remainingTends}/5
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>Can Heal:</span>
                      <span
                        style={{
                          color: healerStatus.canHeal ? '#4caf50' : '#f44336',
                          fontWeight: 'bold',
                        }}
                      >
                        {healerStatus.canHeal ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>Prophecy Power:</span>
                      <span style={{ fontWeight: 'bold' }}>
                        {healerStatus.prophecyPower}/5
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Healer Actions */}
            {activeHealer && (
              <section style={{ marginBottom: '20px' }}>
                <h3
                  style={{
                    margin: '0 0 12px 0',
                    color: '#45b7d1',
                    fontSize: '1.2rem',
                  }}
                >
                  Healer Actions
                </h3>
                <div style={{ display: 'grid', gap: '10px' }}>
                  <button
                    onClick={handleAutoHeal}
                    disabled={
                      !healerStatus?.canHeal ||
                      wolvesNeedingHealing.length === 0
                    }
                    style={{
                      backgroundColor:
                        healerStatus?.canHeal && wolvesNeedingHealing.length > 0
                          ? '#4caf50'
                          : '#666',
                      color: '#1a1a1a',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '12px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      cursor:
                        healerStatus?.canHeal && wolvesNeedingHealing.length > 0
                          ? 'pointer'
                          : 'not-allowed',
                      opacity:
                        healerStatus?.canHeal && wolvesNeedingHealing.length > 0
                          ? 1
                          : 0.5,
                    }}
                  >
                    🏥 Auto-Heal Most Injured (Uses{' '}
                    {Math.min(3, wolvesNeedingHealing.length)} herbs)
                  </button>

                  <button
                    onClick={handleGatherHerbs}
                    style={{
                      backgroundColor: '#4fc3f7',
                      color: '#1a1a1a',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '12px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                    }}
                  >
                    🌿 Gather Herbs
                  </button>

                  <button
                    onClick={handleVisitCrystalPool}
                    style={{
                      backgroundColor: '#9c27b0',
                      color: '#1a1a1a',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '12px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                    }}
                  >
                    🔮 Visit Crystal Pool ({pack.prophecyPower}/5 power)
                  </button>
                </div>
              </section>
            )}

            {/* Pack Resources */}
            <section>
              <h3
                style={{
                  margin: '0 0 12px 0',
                  color: '#45b7d1',
                  fontSize: '1.2rem',
                }}
              >
                Pack Resources
              </h3>
              <div
                style={{
                  backgroundColor: '#2a2a2a',
                  borderRadius: '8px',
                  padding: '16px',
                  border: '1px solid #404040',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                  }}
                >
                  <span>Herbs:</span>
                  <span style={{ fontWeight: 'bold', color: '#4caf50' }}>
                    {pack.herbs}
                  </span>
                </div>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between' }}
                >
                  <span>Prophecy Power:</span>
                  <span style={{ fontWeight: 'bold', color: '#9c27b0' }}>
                    {pack.prophecyPower}/5
                  </span>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column - Patients & Prophecies */}
          <div>
            {/* Wolves Needing Healing */}
            <section style={{ marginBottom: '20px' }}>
              <h3
                style={{
                  margin: '0 0 12px 0',
                  color: '#45b7d1',
                  fontSize: '1.2rem',
                }}
              >
                Wolves Needing Healing ({wolvesNeedingHealing.length})
              </h3>

              {wolvesNeedingHealing.length === 0 ? (
                <div
                  style={{
                    backgroundColor: '#2a2a2a',
                    borderRadius: '8px',
                    padding: '16px',
                    textAlign: 'center',
                    border: '1px solid #404040',
                    opacity: 0.6,
                  }}
                >
                  All wolves are healthy! 🎉
                </div>
              ) : (
                <div
                  style={{
                    backgroundColor: '#2a2a2a',
                    borderRadius: '8px',
                    border: '1px solid #404040',
                    maxHeight: '200px',
                    overflowY: 'auto',
                  }}
                >
                  {wolvesNeedingHealing.map((wolf) => (
                    <div
                      key={wolf.id}
                      onClick={() => setSelectedPatient(wolf)}
                      style={{
                        padding: '12px',
                        borderBottom: '1px solid #404040',
                        cursor: 'pointer',
                        backgroundColor:
                          selectedPatient?.id === wolf.id
                            ? '#404040'
                            : 'transparent',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{wolf.name}</div>
                        <div style={{ fontSize: '12px', opacity: 0.8 }}>
                          {wolf.role} • {wolf.age.toFixed(1)}y
                          {wolf.isSick && ' • 🤒 Sick'}
                        </div>
                      </div>
                      <div
                        style={{
                          color:
                            wolf.stats.health > 70
                              ? '#4caf50'
                              : wolf.stats.health > 40
                                ? '#ff9800'
                                : '#f44336',
                          fontWeight: 'bold',
                        }}
                      >
                        {wolf.stats.health}/100
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Manual Heal Button */}
              {selectedPatient && activeHealer && healerStatus?.canHeal && (
                <button
                  onClick={handleHealWolf}
                  style={{
                    marginTop: '10px',
                    width: '100%',
                    backgroundColor: '#4caf50',
                    color: '#1a1a1a',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  🏥 Heal {selectedPatient.name} (Uses 1 herb)
                </button>
              )}
            </section>

            {/* Prophecies */}
            <section>
              <h3
                style={{
                  margin: '0 0 12px 0',
                  color: '#45b7d1',
                  fontSize: '1.2rem',
                }}
              >
                Prophecies ({pack.prophecies.length})
              </h3>

              {pack.prophecies.length === 0 ? (
                <div
                  style={{
                    backgroundColor: '#2a2a2a',
                    borderRadius: '8px',
                    padding: '16px',
                    textAlign: 'center',
                    border: '1px solid #404040',
                    opacity: 0.6,
                  }}
                >
                  No prophecies yet. Visit the Crystal Pool to receive visions
                  of the future.
                </div>
              ) : (
                <div
                  style={{
                    backgroundColor: '#2a2a2a',
                    borderRadius: '8px',
                    border: '1px solid #404040',
                    maxHeight: '300px',
                    overflowY: 'auto',
                  }}
                >
                  {pack.prophecies.map((prophecy) => (
                    <div
                      key={prophecy.id}
                      style={{
                        padding: '12px',
                        borderBottom: '1px solid #404040',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '8px',
                        }}
                      >
                        <span
                          style={{
                            backgroundColor: prophecy.completed
                              ? '#4caf50'
                              : '#ff9800',
                            color: '#1a1a1a',
                            padding: '2px 6px',
                            borderRadius: '10px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                          }}
                        >
                          {prophecy.completed ? '✓ FULFILLED' : 'IN PROGRESS'}
                        </span>
                        <span style={{ fontSize: '12px', opacity: 0.6 }}>
                          {Math.round(prophecy.progress * 100)}%
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: '13px',
                          fontStyle: 'italic',
                          lineHeight: '1.4',
                          color: prophecy.completed ? '#4caf50' : '#e0e0e0',
                        }}
                      >
                        "{prophecy.text}"
                      </div>
                      {prophecy.targetWolfId && (
                        <div
                          style={{
                            fontSize: '12px',
                            opacity: 0.6,
                            marginTop: '4px',
                          }}
                        >
                          Target:{' '}
                          {pack.wolves.find(
                            (w) => w.id === prophecy.targetWolfId
                          )?.name || 'Unknown'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
