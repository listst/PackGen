import type { Wolf } from '../../types/wolf';
import type { Pack } from '../../types/pack';
import { AppearanceDetail } from './WolfPortrait';

interface ProfileProps {
  wolf: Wolf;
  pack: Pack;
  onClose?: () => void;
}

const roleColors = {
  alpha: '#ff6b6b',
  beta: '#4ecdc4',
  healer: '#45b7d1',
  hunter: '#96ceb4',
  omega: '#ffeaa7',
  pup: '#fd79a8',
  elder: '#a29bfe',
};

export function Profile({ wolf, pack, onClose }: ProfileProps) {
  // Calculate relationships
  const relationships = pack.wolves
    .filter(
      (w) => w.id !== wolf.id && !w._dead && !w._dispersed && wolf.bonds?.[w.id]
    )
    .map((w) => {
      const bondValue = wolf.bonds![w.id];
      return {
        wolf: w,
        bond: bondValue ?? 0,
      };
    })
    .filter((r) => r.bond !== 0)
    .sort((a, b) => Math.abs(b.bond) - Math.abs(a.bond));

  // Find mate
  const mate = wolf.mateId
    ? pack.wolves.find((w) => w.id === wolf.mateId)
    : null;

  // Find mentor/mentees
  const mentor = wolf.trainingMentorId
    ? pack.wolves.find((w) => w.id === wolf.trainingMentorId)
    : null;
  const mentees = pack.wolves.filter((w) => w.trainingMentorId === wolf.id);

  // Calculate age in human-readable format
  const ageInDays = Math.floor(wolf.age * 365);
  const ageDisplay =
    wolf.age < 1
      ? `${ageInDays} days old`
      : `${wolf.age.toFixed(1)} years old (${ageInDays} days)`;

  return (
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
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#2a2a2a',
          borderRadius: '16px',
          padding: '24px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          color: '#e0e0e0',
          border: `3px solid ${roleColors[wolf.role] || '#404040'}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'start',
            marginBottom: '20px',
          }}
        >
          <div>
            <h2
              style={{
                margin: '0 0 8px 0',
                fontSize: '2rem',
                color: roleColors[wolf.role] || '#e0e0e0',
              }}
            >
              {wolf.name}
            </h2>
            <div
              style={{
                display: 'inline-block',
                backgroundColor: roleColors[wolf.role] || '#666',
                color: '#1a1a1a',
                padding: '6px 12px',
                borderRadius: '16px',
                fontSize: '13px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                marginBottom: '8px',
              }}
            >
              {wolf.role.replace('_', ' ')}
            </div>
            <div style={{ fontSize: '14px', opacity: 0.8 }}>
              {wolf.sex} • {ageDisplay}
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#e0e0e0',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Status Indicators */}
        <div
          style={{
            marginBottom: '24px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          {wolf.pregnant && (
            <span
              style={{
                backgroundColor: '#4caf50',
                color: '#1a1a1a',
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 'bold',
              }}
            >
              🤱 Pregnant (Day{' '}
              {wolf.pregnancyDay ? pack.day - wolf.pregnancyDay : 0}/{14})
            </span>
          )}
          {wolf.isTraining && (
            <span
              style={{
                backgroundColor: '#2196f3',
                color: '#1a1a1a',
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 'bold',
              }}
            >
              📚 Training (
              {wolf.trainingStartDay ? pack.day - wolf.trainingStartDay : 0}{' '}
              days)
            </span>
          )}
          {wolf.isSick && (
            <span
              style={{
                backgroundColor: '#f44336',
                color: '#1a1a1a',
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 'bold',
              }}
            >
              🤒 Sick
            </span>
          )}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '24px',
          }}
        >
          {/* Left Column */}
          <div>
            {/* Stats */}
            <section style={{ marginBottom: '24px' }}>
              <h3
                style={{
                  margin: '0 0 12px 0',
                  color: '#4fc3f7',
                  fontSize: '1.2rem',
                }}
              >
                Stats
              </h3>
              <div
                style={{
                  backgroundColor: '#1a1a1a',
                  borderRadius: '8px',
                  padding: '12px',
                }}
              >
                <div style={{ display: 'grid', gap: '8px' }}>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <span>Health:</span>
                    <span
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
                    </span>
                  </div>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <span>Strength:</span>
                    <span style={{ fontWeight: 'bold' }}>
                      {wolf.stats.strength.toFixed(2)}/10
                    </span>
                  </div>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <span>Speed:</span>
                    <span style={{ fontWeight: 'bold' }}>
                      {wolf.stats.speed.toFixed(2)}/10
                    </span>
                  </div>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <span>Intelligence:</span>
                    <span style={{ fontWeight: 'bold' }}>
                      {wolf.stats.intelligence.toFixed(2)}/10
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Traits */}
            <section style={{ marginBottom: '24px' }}>
              <h3
                style={{
                  margin: '0 0 12px 0',
                  color: '#4fc3f7',
                  fontSize: '1.2rem',
                }}
              >
                Traits
              </h3>
              <div
                style={{
                  backgroundColor: '#1a1a1a',
                  borderRadius: '8px',
                  padding: '12px',
                }}
              >
                <div style={{ display: 'grid', gap: '8px' }}>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <span>Bravery:</span>
                    <span style={{ fontWeight: 'bold' }}>
                      {wolf.traits.bravery.toFixed(2)}/10
                    </span>
                  </div>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <span>Sociability:</span>
                    <span style={{ fontWeight: 'bold' }}>
                      {wolf.traits.sociability.toFixed(2)}/10
                    </span>
                  </div>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <span>Trainability:</span>
                    <span style={{ fontWeight: 'bold' }}>
                      {wolf.traits.trainability.toFixed(2)}/10
                    </span>
                  </div>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <span>Fertility:</span>
                    <span style={{ fontWeight: 'bold' }}>
                      {wolf.traits.fertility.toFixed(2)}/10
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Enhanced Appearance */}
            <div style={{ marginBottom: '24px' }}>
              <AppearanceDetail wolf={wolf} />
            </div>
          </div>

          {/* Right Column */}
          <div>
            {/* Experience */}
            {(wolf.xp !== undefined || wolf.level !== undefined) && (
              <section style={{ marginBottom: '24px' }}>
                <h3
                  style={{
                    margin: '0 0 12px 0',
                    color: '#4fc3f7',
                    fontSize: '1.2rem',
                  }}
                >
                  Experience
                </h3>
                <div
                  style={{
                    backgroundColor: '#1a1a1a',
                    borderRadius: '8px',
                    padding: '12px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '8px',
                    }}
                  >
                    <span>Level:</span>
                    <span style={{ fontWeight: 'bold' }}>
                      {wolf.level || 0}
                    </span>
                  </div>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <span>XP:</span>
                    <span style={{ fontWeight: 'bold' }}>
                      {wolf.xp || 0}/100
                    </span>
                  </div>
                </div>
              </section>
            )}

            {/* Family */}
            {mate && (
              <section style={{ marginBottom: '24px' }}>
                <h3
                  style={{
                    margin: '0 0 12px 0',
                    color: '#4fc3f7',
                    fontSize: '1.2rem',
                  }}
                >
                  Family
                </h3>
                <div
                  style={{
                    backgroundColor: '#1a1a1a',
                    borderRadius: '8px',
                    padding: '12px',
                  }}
                >
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <span>Mate:</span>
                    <span
                      style={{
                        fontWeight: 'bold',
                        color: roleColors[mate.role],
                      }}
                    >
                      {mate.name}
                    </span>
                  </div>
                </div>
              </section>
            )}

            {/* Training */}
            {(mentor || mentees.length > 0) && (
              <section style={{ marginBottom: '24px' }}>
                <h3
                  style={{
                    margin: '0 0 12px 0',
                    color: '#4fc3f7',
                    fontSize: '1.2rem',
                  }}
                >
                  Training
                </h3>
                <div
                  style={{
                    backgroundColor: '#1a1a1a',
                    borderRadius: '8px',
                    padding: '12px',
                  }}
                >
                  {mentor && (
                    <div
                      style={{ marginBottom: mentees.length > 0 ? '8px' : '0' }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span>Mentor:</span>
                        <span
                          style={{
                            fontWeight: 'bold',
                            color: roleColors[mentor.role],
                          }}
                        >
                          {mentor.name}
                        </span>
                      </div>
                    </div>
                  )}
                  {mentees.length > 0 && (
                    <div>
                      <div style={{ marginBottom: '4px', fontWeight: 'bold' }}>
                        Mentees:
                      </div>
                      {mentees.map((mentee) => (
                        <div
                          key={mentee.id}
                          style={{
                            fontSize: '13px',
                            color: roleColors[mentee.role],
                            marginLeft: '8px',
                          }}
                        >
                          {mentee.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Relationships */}
            {relationships.length > 0 && (
              <section>
                <h3
                  style={{
                    margin: '0 0 12px 0',
                    color: '#4fc3f7',
                    fontSize: '1.2rem',
                  }}
                >
                  Relationships
                </h3>
                <div
                  style={{
                    backgroundColor: '#1a1a1a',
                    borderRadius: '8px',
                    padding: '12px',
                  }}
                >
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {relationships
                      .slice(0, 10)
                      .map(({ wolf: otherWolf, bond }) => (
                        <div
                          key={otherWolf.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '6px',
                            fontSize: '13px',
                          }}
                        >
                          <span style={{ color: roleColors[otherWolf.role] }}>
                            {otherWolf.name}
                          </span>
                          <span
                            style={{
                              color:
                                bond > 50
                                  ? '#4caf50'
                                  : bond > 0
                                    ? '#ff9800'
                                    : '#f44336',
                              fontWeight: 'bold',
                            }}
                          >
                            {bond > 0 ? '+' : ''}
                            {bond}
                          </span>
                        </div>
                      ))}
                    {relationships.length > 10 && (
                      <div
                        style={{
                          fontSize: '12px',
                          opacity: 0.6,
                          textAlign: 'center',
                          marginTop: '8px',
                        }}
                      >
                        +{relationships.length - 10} more relationships
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
