import { useState } from 'react';
import type { Pack } from '../../types/pack';
import type { Wolf } from '../../types/wolf';
import { getAliveWolves, isBreedingAge } from '../../types/utils';

interface GeneticsViewerProps {
  pack: Pack;
  onWolfSelect?: (wolf: Wolf) => void;
}

interface BreedingPair {
  mother: Wolf;
  father: Wolf;
  compatibility: number;
  estimatedTraits: {
    strength: number;
    speed: number;
    intelligence: number;
    bravery: number;
    sociability: number;
    trainability: number;
    fertility: number;
  };
}

export function GeneticsViewer({ pack, onWolfSelect }: GeneticsViewerProps) {
  const [selectedMother, setSelectedMother] = useState<Wolf | null>(null);
  const [selectedFather, setSelectedFather] = useState<Wolf | null>(null);

  const aliveWolves = getAliveWolves(pack);
  const breedingWolves = aliveWolves.filter(isBreedingAge);
  const females = breedingWolves.filter(
    (w) => w.sex === 'female' && !w.pregnant
  );
  const males = breedingWolves.filter((w) => w.sex === 'male');

  const calculateCompatibility = (female: Wolf, male: Wolf): number => {
    // Genetic diversity bonus
    const statDiversity =
      Math.abs(female.stats.strength - male.stats.strength) +
      Math.abs(female.stats.speed - male.stats.speed) +
      Math.abs(female.stats.intelligence - male.stats.intelligence);

    const traitDiversity =
      Math.abs(female.traits.bravery - male.traits.bravery) +
      Math.abs(female.traits.sociability - male.traits.sociability) +
      Math.abs(female.traits.trainability - male.traits.trainability);

    // Bond bonus if they have a relationship
    const bondValue = female.bonds?.[male.id];
    const bondBonus = bondValue ? Math.abs(bondValue) / 100 : 0;

    // Fertility factor
    const fertilityFactor =
      (female.traits.fertility + male.traits.fertility) / 20;

    // Age factor (optimal breeding age)
    const ageFactor =
      Math.min(
        1,
        2 - Math.abs(female.age - 4) / 4 + 2 - Math.abs(male.age - 4) / 4
      ) / 2;

    const compatibility =
      (statDiversity / 30) * 0.3 +
      (traitDiversity / 30) * 0.3 +
      bondBonus * 0.2 +
      fertilityFactor * 0.15 +
      ageFactor * 0.05;

    return Math.min(1, Math.max(0, compatibility));
  };

  const estimateOffspring = (mother: Wolf, father: Wolf) => {
    const avgStat = (motherVal: number, fatherVal: number) =>
      (motherVal + fatherVal) / 2;

    return {
      strength: avgStat(mother.stats.strength, father.stats.strength),
      speed: avgStat(mother.stats.speed, father.stats.speed),
      intelligence: avgStat(
        mother.stats.intelligence,
        father.stats.intelligence
      ),
      bravery: avgStat(mother.traits.bravery, father.traits.bravery),
      sociability: avgStat(
        mother.traits.sociability,
        father.traits.sociability
      ),
      trainability: avgStat(
        mother.traits.trainability,
        father.traits.trainability
      ),
      fertility: avgStat(mother.traits.fertility, father.traits.fertility),
    };
  };

  const getTopBreedingPairs = (): BreedingPair[] => {
    const pairs: BreedingPair[] = [];

    females.forEach((mother) => {
      males.forEach((father) => {
        if (mother.id !== father.id) {
          const compatibility = calculateCompatibility(mother, father);
          const estimatedTraits = estimateOffspring(mother, father);

          pairs.push({
            mother,
            father,
            compatibility,
            estimatedTraits,
          });
        }
      });
    });

    return pairs.sort((a, b) => b.compatibility - a.compatibility).slice(0, 10);
  };

  const getCompatibilityColor = (compatibility: number) => {
    if (compatibility >= 0.8) return '#4caf50';
    if (compatibility >= 0.6) return '#8bc34a';
    if (compatibility >= 0.4) return '#ff9800';
    if (compatibility >= 0.2) return '#f44336';
    return '#9e9e9e';
  };

  const getCompatibilityText = (compatibility: number) => {
    if (compatibility >= 0.8) return 'Excellent';
    if (compatibility >= 0.6) return 'Good';
    if (compatibility >= 0.4) return 'Fair';
    if (compatibility >= 0.2) return 'Poor';
    return 'Very Poor';
  };

  const getStatColor = (value: number) => {
    if (value >= 8) return '#4caf50';
    if (value >= 6) return '#8bc34a';
    if (value >= 4) return '#ff9800';
    return '#f44336';
  };

  const topPairs = getTopBreedingPairs();

  return (
    <div style={{ color: '#e0e0e0' }}>
      <h2
        style={{
          margin: '0 0 20px 0',
          color: '#4fc3f7',
          fontSize: '1.6rem',
        }}
      >
        🧬 Genetics & Breeding Analysis
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
        }}
      >
        {/* Left Column - Breeding Calculator */}
        <div>
          {/* Breeding Simulator */}
          <section style={{ marginBottom: '24px' }}>
            <h3
              style={{
                margin: '0 0 12px 0',
                color: '#4fc3f7',
                fontSize: '1.2rem',
              }}
            >
              Breeding Calculator
            </h3>

            {/* Mother Selection */}
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#ff9800' }}>
                Select Mother ({females.length} available)
              </h4>
              <div
                style={{
                  backgroundColor: '#2a2a2a',
                  borderRadius: '8px',
                  border: '1px solid #404040',
                  maxHeight: '120px',
                  overflowY: 'auto',
                }}
              >
                {females.length === 0 ? (
                  <div
                    style={{
                      padding: '16px',
                      textAlign: 'center',
                      opacity: 0.6,
                    }}
                  >
                    No breeding-age females available
                  </div>
                ) : (
                  females.map((wolf) => (
                    <div
                      key={wolf.id}
                      onClick={() => setSelectedMother(wolf)}
                      style={{
                        padding: '8px 12px',
                        borderBottom: '1px solid #404040',
                        cursor: 'pointer',
                        backgroundColor:
                          selectedMother?.id === wolf.id
                            ? '#404040'
                            : 'transparent',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontWeight: 'bold' }}>{wolf.name}</span>
                      <span style={{ fontSize: '12px', opacity: 0.7 }}>
                        Fertility: {wolf.traits.fertility.toFixed(1)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Father Selection */}
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#2196f3' }}>
                Select Father ({males.length} available)
              </h4>
              <div
                style={{
                  backgroundColor: '#2a2a2a',
                  borderRadius: '8px',
                  border: '1px solid #404040',
                  maxHeight: '120px',
                  overflowY: 'auto',
                }}
              >
                {males.length === 0 ? (
                  <div
                    style={{
                      padding: '16px',
                      textAlign: 'center',
                      opacity: 0.6,
                    }}
                  >
                    No breeding-age males available
                  </div>
                ) : (
                  males.map((wolf) => (
                    <div
                      key={wolf.id}
                      onClick={() => setSelectedFather(wolf)}
                      style={{
                        padding: '8px 12px',
                        borderBottom: '1px solid #404040',
                        cursor: 'pointer',
                        backgroundColor:
                          selectedFather?.id === wolf.id
                            ? '#404040'
                            : 'transparent',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontWeight: 'bold' }}>{wolf.name}</span>
                      <span style={{ fontSize: '12px', opacity: 0.7 }}>
                        Fertility: {wolf.traits.fertility.toFixed(1)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Breeding Analysis */}
            {selectedMother && selectedFather && (
              <div
                style={{
                  backgroundColor: '#2a2a2a',
                  borderRadius: '8px',
                  padding: '16px',
                  border: '1px solid #404040',
                }}
              >
                <h4
                  style={{
                    margin: '0 0 12px 0',
                    color: '#4caf50',
                    textAlign: 'center',
                  }}
                >
                  {selectedMother.name} × {selectedFather.name}
                </h4>

                {(() => {
                  const compatibility = calculateCompatibility(
                    selectedMother,
                    selectedFather
                  );
                  const offspring = estimateOffspring(
                    selectedMother,
                    selectedFather
                  );

                  return (
                    <>
                      <div
                        style={{ textAlign: 'center', marginBottom: '16px' }}
                      >
                        <span
                          style={{
                            backgroundColor:
                              getCompatibilityColor(compatibility),
                            color: '#1a1a1a',
                            padding: '6px 12px',
                            borderRadius: '12px',
                            fontSize: '14px',
                            fontWeight: 'bold',
                          }}
                        >
                          {getCompatibilityText(compatibility)} Match (
                          {(compatibility * 100).toFixed(0)}%)
                        </span>
                      </div>

                      <div>
                        <h5 style={{ margin: '0 0 8px 0', color: '#4fc3f7' }}>
                          Estimated Offspring Stats:
                        </h5>
                        <div
                          style={{
                            display: 'grid',
                            gap: '4px',
                            fontSize: '13px',
                          }}
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
                                color: getStatColor(offspring.strength),
                              }}
                            >
                              {offspring.strength.toFixed(1)}
                            </span>
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                            }}
                          >
                            <span>Speed:</span>
                            <span
                              style={{
                                fontWeight: 'bold',
                                color: getStatColor(offspring.speed),
                              }}
                            >
                              {offspring.speed.toFixed(1)}
                            </span>
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                            }}
                          >
                            <span>Intelligence:</span>
                            <span
                              style={{
                                fontWeight: 'bold',
                                color: getStatColor(offspring.intelligence),
                              }}
                            >
                              {offspring.intelligence.toFixed(1)}
                            </span>
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                            }}
                          >
                            <span>Bravery:</span>
                            <span
                              style={{
                                fontWeight: 'bold',
                                color: getStatColor(offspring.bravery),
                              }}
                            >
                              {offspring.bravery.toFixed(1)}
                            </span>
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                            }}
                          >
                            <span>Sociability:</span>
                            <span
                              style={{
                                fontWeight: 'bold',
                                color: getStatColor(offspring.sociability),
                              }}
                            >
                              {offspring.sociability.toFixed(1)}
                            </span>
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                            }}
                          >
                            <span>Trainability:</span>
                            <span
                              style={{
                                fontWeight: 'bold',
                                color: getStatColor(offspring.trainability),
                              }}
                            >
                              {offspring.trainability.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </section>

          {/* Pack Genetics Overview */}
          <section>
            <h3
              style={{
                margin: '0 0 12px 0',
                color: '#4fc3f7',
                fontSize: '1.2rem',
              }}
            >
              Pack Genetic Diversity
            </h3>
            <div
              style={{
                backgroundColor: '#2a2a2a',
                borderRadius: '8px',
                padding: '16px',
                border: '1px solid #404040',
              }}
            >
              {(() => {
                const avgStats = breedingWolves.reduce(
                  (acc, wolf) => ({
                    strength: acc.strength + wolf.stats.strength,
                    speed: acc.speed + wolf.stats.speed,
                    intelligence: acc.intelligence + wolf.stats.intelligence,
                    bravery: acc.bravery + wolf.traits.bravery,
                    sociability: acc.sociability + wolf.traits.sociability,
                    trainability: acc.trainability + wolf.traits.trainability,
                    fertility: acc.fertility + wolf.traits.fertility,
                  }),
                  {
                    strength: 0,
                    speed: 0,
                    intelligence: 0,
                    bravery: 0,
                    sociability: 0,
                    trainability: 0,
                    fertility: 0,
                  }
                );

                if (breedingWolves.length > 0) {
                  Object.keys(avgStats).forEach((key) => {
                    avgStats[key as keyof typeof avgStats] /=
                      breedingWolves.length;
                  });
                }

                return (
                  <div
                    style={{ display: 'grid', gap: '8px', fontSize: '14px' }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>Breeding Population:</span>
                      <span style={{ fontWeight: 'bold' }}>
                        {breedingWolves.length} wolves
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>Avg Strength:</span>
                      <span
                        style={{
                          fontWeight: 'bold',
                          color: getStatColor(avgStats.strength),
                        }}
                      >
                        {avgStats.strength.toFixed(1)}
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>Avg Speed:</span>
                      <span
                        style={{
                          fontWeight: 'bold',
                          color: getStatColor(avgStats.speed),
                        }}
                      >
                        {avgStats.speed.toFixed(1)}
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>Avg Intelligence:</span>
                      <span
                        style={{
                          fontWeight: 'bold',
                          color: getStatColor(avgStats.intelligence),
                        }}
                      >
                        {avgStats.intelligence.toFixed(1)}
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>Avg Fertility:</span>
                      <span
                        style={{
                          fontWeight: 'bold',
                          color: getStatColor(avgStats.fertility),
                        }}
                      >
                        {avgStats.fertility.toFixed(1)}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </section>
        </div>

        {/* Right Column - Top Breeding Pairs */}
        <div>
          <section>
            <h3
              style={{
                margin: '0 0 12px 0',
                color: '#4fc3f7',
                fontSize: '1.2rem',
              }}
            >
              Recommended Breeding Pairs
            </h3>

            {topPairs.length === 0 ? (
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
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🐺</div>
                <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                  No Breeding Pairs Available
                </div>
                <div style={{ fontSize: '14px' }}>
                  Need at least one breeding-age male and female.
                </div>
              </div>
            ) : (
              <div
                style={{
                  backgroundColor: '#2a2a2a',
                  borderRadius: '8px',
                  border: '1px solid #404040',
                  maxHeight: '600px',
                  overflowY: 'auto',
                }}
              >
                {topPairs.map((pair, index) => (
                  <div
                    key={`${pair.mother.id}-${pair.father.id}`}
                    style={{
                      padding: '16px',
                      borderBottom: '1px solid #404040',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '12px',
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '18px', marginRight: '8px' }}>
                          #{index + 1}
                        </span>
                        <span
                          style={{
                            fontWeight: 'bold',
                            color: '#ff9800',
                            cursor: 'pointer',
                          }}
                          onClick={() => onWolfSelect?.(pair.mother)}
                        >
                          {pair.mother.name}
                        </span>
                        <span style={{ margin: '0 8px', opacity: 0.6 }}>×</span>
                        <span
                          style={{
                            fontWeight: 'bold',
                            color: '#2196f3',
                            cursor: 'pointer',
                          }}
                          onClick={() => onWolfSelect?.(pair.father)}
                        >
                          {pair.father.name}
                        </span>
                      </div>
                      <span
                        style={{
                          backgroundColor: getCompatibilityColor(
                            pair.compatibility
                          ),
                          color: '#1a1a1a',
                          padding: '4px 8px',
                          borderRadius: '10px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                        }}
                      >
                        {(pair.compatibility * 100).toFixed(0)}%
                      </span>
                    </div>

                    <div style={{ fontSize: '13px', opacity: 0.8 }}>
                      <div>Expected offspring stats:</div>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr 1fr',
                          gap: '8px',
                          marginTop: '8px',
                        }}
                      >
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '11px', opacity: 0.7 }}>
                            STR
                          </div>
                          <div
                            style={{
                              fontWeight: 'bold',
                              color: getStatColor(
                                pair.estimatedTraits.strength
                              ),
                            }}
                          >
                            {pair.estimatedTraits.strength.toFixed(1)}
                          </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '11px', opacity: 0.7 }}>
                            SPD
                          </div>
                          <div
                            style={{
                              fontWeight: 'bold',
                              color: getStatColor(pair.estimatedTraits.speed),
                            }}
                          >
                            {pair.estimatedTraits.speed.toFixed(1)}
                          </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '11px', opacity: 0.7 }}>
                            INT
                          </div>
                          <div
                            style={{
                              fontWeight: 'bold',
                              color: getStatColor(
                                pair.estimatedTraits.intelligence
                              ),
                            }}
                          >
                            {pair.estimatedTraits.intelligence.toFixed(1)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
