import { useState } from 'react';
import type { Pack } from '../../types/pack';
import type { Territory, RivalPack } from '../../types/territory';

interface TerritoryPanelProps {
  pack: Pack;
  onPackUpdate: (pack: Pack) => void;
}

const biomeColors = {
  forest: '#4caf50',
  mountain: '#9e9e9e',
  plains: '#8bc34a',
  tundra: '#90caf9',
  desert: '#ffc107',
  swamp: '#795548',
};

const biomeIcons = {
  forest: '🌲',
  mountain: '⛰️',
  plains: '🌾',
  tundra: '❄️',
  desert: '🏜️',
  swamp: '🐊',
};

export function TerritoryPanel({ pack, onPackUpdate }: TerritoryPanelProps) {
  const [selectedRival, setSelectedRival] = useState<RivalPack | null>(null);

  // Initialize territory if it doesn't exist
  const territory: Territory = pack.territory || {
    biome: 'forest',
    rivalPacks: [
      {
        id: 'rival_1',
        name: 'Shadowfang Pack',
        strength: 6,
        aggression: 4,
      },
      {
        id: 'rival_2',
        name: 'Iron Claw Pack',
        strength: 8,
        aggression: 7,
      },
    ],
    foodRichness: 7,
    herbAbundance: 6,
    dangerLevel: 4,
  };

  const handleExploreTerritory = () => {
    const newPack = { ...pack };
    if (!newPack.territory) {
      newPack.territory = territory;
    }

    // Simple exploration - chance for herbs or small events
    const exploreChance = Math.random();
    if (exploreChance < 0.3) {
      const herbsFound = Math.floor(Math.random() * 3) + 1;
      newPack.herbs += herbsFound;
      newPack.logs.push(
        `Day ${newPack.day}: The pack explored the territory and found ${herbsFound} herbs.`
      );
    } else if (exploreChance < 0.6) {
      newPack.logs.push(
        `Day ${newPack.day}: The pack explored the territory but found nothing of value.`
      );
    } else {
      newPack.logs.push(
        `Day ${newPack.day}: While exploring, the pack discovered signs of rival activity nearby.`
      );
    }

    onPackUpdate(newPack);
  };

  const handlePatrolBorders = () => {
    const newPack = { ...pack };
    if (!newPack.territory) {
      newPack.territory = territory;
    }

    // Patrolling reduces chance of rival raids temporarily
    const patrolResult = Math.random();
    if (patrolResult < 0.7) {
      newPack.logs.push(
        `Day ${newPack.day}: The patrol successfully secured the borders. Rival activity has decreased.`
      );
    } else {
      newPack.logs.push(
        `Day ${newPack.day}: The patrol encountered signs of a rival pack but managed to avoid confrontation.`
      );
    }

    onPackUpdate(newPack);
  };

  const handleMarkTerritory = () => {
    const newPack = { ...pack };
    if (!newPack.territory) {
      newPack.territory = territory;
    }

    newPack.logs.push(
      `Day ${newPack.day}: The pack marked their territory, strengthening their claim to the land.`
    );

    onPackUpdate(newPack);
  };

  const getStrengthColor = (strength: number) => {
    if (strength >= 8) return '#f44336';
    if (strength >= 6) return '#ff9800';
    if (strength >= 4) return '#ffeb3b';
    return '#4caf50';
  };

  const getAggressionColor = (aggression: number) => {
    if (aggression >= 8) return '#d32f2f';
    if (aggression >= 6) return '#f57c00';
    if (aggression >= 4) return '#fbc02d';
    return '#388e3c';
  };

  const getDangerLevelText = (level: number) => {
    if (level >= 8) return 'Extremely Dangerous';
    if (level >= 6) return 'Very Dangerous';
    if (level >= 4) return 'Moderately Dangerous';
    if (level >= 2) return 'Slightly Dangerous';
    return 'Safe';
  };

  return (
    <div style={{ color: '#e0e0e0' }}>
      <h2
        style={{
          margin: '0 0 20px 0',
          color: '#4fc3f7',
          fontSize: '1.6rem',
        }}
      >
        🗺️ Territory Management
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
        }}
      >
        {/* Left Column - Territory Info & Actions */}
        <div>
          {/* Territory Overview */}
          <section style={{ marginBottom: '24px' }}>
            <h3
              style={{
                margin: '0 0 12px 0',
                color: '#4fc3f7',
                fontSize: '1.2rem',
              }}
            >
              Territory Overview
            </h3>
            <div
              style={{
                backgroundColor: '#2a2a2a',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #404040',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '16px',
                }}
              >
                <span style={{ fontSize: '32px', marginRight: '12px' }}>
                  {biomeIcons[territory.biome as keyof typeof biomeIcons] ||
                    '🏞️'}
                </span>
                <div>
                  <h4
                    style={{
                      margin: '0 0 4px 0',
                      color:
                        biomeColors[
                          territory.biome as keyof typeof biomeColors
                        ] || '#4fc3f7',
                      textTransform: 'capitalize',
                    }}
                  >
                    {territory.biome} Territory
                  </h4>
                  <div style={{ fontSize: '14px', opacity: 0.8 }}>
                    {pack.name} Homeland
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gap: '8px', fontSize: '14px' }}>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between' }}
                >
                  <span>Food Richness:</span>
                  <span style={{ fontWeight: 'bold' }}>
                    {territory.foodRichness}/10
                  </span>
                </div>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between' }}
                >
                  <span>Herb Abundance:</span>
                  <span style={{ fontWeight: 'bold' }}>
                    {territory.herbAbundance}/10
                  </span>
                </div>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between' }}
                >
                  <span>Danger Level:</span>
                  <span
                    style={{
                      fontWeight: 'bold',
                      color:
                        territory.dangerLevel >= 6
                          ? '#f44336'
                          : territory.dangerLevel >= 4
                            ? '#ff9800'
                            : '#4caf50',
                    }}
                  >
                    {getDangerLevelText(territory.dangerLevel)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Territory Actions */}
          <section style={{ marginBottom: '24px' }}>
            <h3
              style={{
                margin: '0 0 12px 0',
                color: '#4fc3f7',
                fontSize: '1.2rem',
              }}
            >
              Territory Actions
            </h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              <button
                onClick={handleExploreTerritory}
                style={{
                  backgroundColor: '#4caf50',
                  color: '#1a1a1a',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                🔍 Explore Territory
              </button>
              <button
                onClick={handlePatrolBorders}
                style={{
                  backgroundColor: '#ff9800',
                  color: '#1a1a1a',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                🛡️ Patrol Borders
              </button>
              <button
                onClick={handleMarkTerritory}
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
                🚩 Mark Territory
              </button>
            </div>
          </section>

          {/* Territory Stats */}
          <section>
            <h3
              style={{
                margin: '0 0 12px 0',
                color: '#4fc3f7',
                fontSize: '1.2rem',
              }}
            >
              Territory Statistics
            </h3>
            <div
              style={{
                backgroundColor: '#2a2a2a',
                borderRadius: '8px',
                padding: '16px',
                border: '1px solid #404040',
              }}
            >
              <div style={{ display: 'grid', gap: '12px', fontSize: '14px' }}>
                <div>
                  <div style={{ marginBottom: '4px', opacity: 0.8 }}>
                    Hunt Success Modifier
                  </div>
                  <div
                    style={{
                      backgroundColor: '#1a1a1a',
                      borderRadius: '4px',
                      height: '8px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: '#4caf50',
                        height: '100%',
                        width: `${(territory.foodRichness / 10) * 100}%`,
                      }}
                    />
                  </div>
                  <div
                    style={{ fontSize: '12px', opacity: 0.6, marginTop: '2px' }}
                  >
                    +{Math.round((territory.foodRichness - 5) * 10)}% success
                    rate
                  </div>
                </div>

                <div>
                  <div style={{ marginBottom: '4px', opacity: 0.8 }}>
                    Herb Gathering Bonus
                  </div>
                  <div
                    style={{
                      backgroundColor: '#1a1a1a',
                      borderRadius: '4px',
                      height: '8px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: '#4fc3f7',
                        height: '100%',
                        width: `${(territory.herbAbundance / 10) * 100}%`,
                      }}
                    />
                  </div>
                  <div
                    style={{ fontSize: '12px', opacity: 0.6, marginTop: '2px' }}
                  >
                    +{Math.round((territory.herbAbundance - 5) * 20)}% more
                    herbs
                  </div>
                </div>

                <div>
                  <div style={{ marginBottom: '4px', opacity: 0.8 }}>
                    Injury Risk
                  </div>
                  <div
                    style={{
                      backgroundColor: '#1a1a1a',
                      borderRadius: '4px',
                      height: '8px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: '#f44336',
                        height: '100%',
                        width: `${(territory.dangerLevel / 10) * 100}%`,
                      }}
                    />
                  </div>
                  <div
                    style={{ fontSize: '12px', opacity: 0.6, marginTop: '2px' }}
                  >
                    +{Math.round(territory.dangerLevel * 5)}% injury chance
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column - Rival Packs */}
        <div>
          <section>
            <h3
              style={{
                margin: '0 0 12px 0',
                color: '#4fc3f7',
                fontSize: '1.2rem',
              }}
            >
              Rival Packs ({territory.rivalPacks.length})
            </h3>

            {territory.rivalPacks.length === 0 ? (
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
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🕊️</div>
                <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                  Peaceful Territory
                </div>
                <div style={{ fontSize: '14px' }}>
                  No rival packs detected in your territory.
                </div>
              </div>
            ) : (
              <div
                style={{
                  backgroundColor: '#2a2a2a',
                  borderRadius: '8px',
                  border: '1px solid #404040',
                  maxHeight: '400px',
                  overflowY: 'auto',
                }}
              >
                {territory.rivalPacks.map((rival) => (
                  <div
                    key={rival.id}
                    onClick={() => setSelectedRival(rival)}
                    style={{
                      padding: '16px',
                      borderBottom: '1px solid #404040',
                      cursor: 'pointer',
                      backgroundColor:
                        selectedRival?.id === rival.id
                          ? '#404040'
                          : 'transparent',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'start',
                        marginBottom: '12px',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
                          {rival.name}
                        </div>
                        {rival.lastRaidDay && (
                          <div style={{ fontSize: '12px', opacity: 0.6 }}>
                            Last raid: Day {rival.lastRaidDay}
                          </div>
                        )}
                      </div>
                      <span style={{ fontSize: '20px' }}>⚔️</span>
                    </div>

                    <div
                      style={{ display: 'grid', gap: '8px', fontSize: '13px' }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span>Strength:</span>
                        <span
                          style={{
                            fontWeight: 'bold',
                            color: getStrengthColor(rival.strength),
                          }}
                        >
                          {rival.strength}/10
                        </span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span>Aggression:</span>
                        <span
                          style={{
                            fontWeight: 'bold',
                            color: getAggressionColor(rival.aggression),
                          }}
                        >
                          {rival.aggression}/10
                        </span>
                      </div>
                    </div>

                    {/* Threat Assessment */}
                    <div style={{ marginTop: '12px' }}>
                      <div
                        style={{
                          fontSize: '12px',
                          opacity: 0.8,
                          marginBottom: '4px',
                        }}
                      >
                        Threat Level:
                      </div>
                      <div
                        style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          backgroundColor:
                            rival.strength + rival.aggression >= 15
                              ? '#f44336'
                              : rival.strength + rival.aggression >= 10
                                ? '#ff9800'
                                : '#4caf50',
                          color: '#1a1a1a',
                          display: 'inline-block',
                        }}
                      >
                        {rival.strength + rival.aggression >= 15
                          ? 'EXTREME'
                          : rival.strength + rival.aggression >= 10
                            ? 'HIGH'
                            : 'MODERATE'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Rival Pack Actions */}
            {selectedRival && (
              <div style={{ marginTop: '16px' }}>
                <h4
                  style={{
                    margin: '0 0 8px 0',
                    color: '#ff9800',
                    fontSize: '1rem',
                  }}
                >
                  Actions vs {selectedRival.name}
                </h4>
                <div style={{ display: 'grid', gap: '8px' }}>
                  <button
                    onClick={() => {
                      const newPack = { ...pack };
                      newPack.logs.push(
                        `Day ${newPack.day}: Scouts were sent to monitor ${selectedRival.name}'s territory.`
                      );
                      onPackUpdate(newPack);
                    }}
                    style={{
                      backgroundColor: '#2196f3',
                      color: '#1a1a1a',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                    }}
                  >
                    🔍 Send Scouts
                  </button>
                  <button
                    onClick={() => {
                      const newPack = { ...pack };
                      newPack.logs.push(
                        `Day ${newPack.day}: A diplomatic envoy was sent to ${selectedRival.name}.`
                      );
                      onPackUpdate(newPack);
                    }}
                    style={{
                      backgroundColor: '#4caf50',
                      color: '#1a1a1a',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                    }}
                  >
                    🕊️ Diplomacy
                  </button>
                  <button
                    onClick={() => {
                      const newPack = { ...pack };
                      newPack.logs.push(
                        `Day ${newPack.day}: The pack prepares for potential conflict with ${selectedRival.name}.`
                      );
                      onPackUpdate(newPack);
                    }}
                    style={{
                      backgroundColor: '#f44336',
                      color: '#1a1a1a',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                    }}
                  >
                    ⚔️ Prepare for War
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
