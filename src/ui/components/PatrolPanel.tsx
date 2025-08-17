import { useState } from 'react';
import type { Pack } from '../../types/pack';
import type { Wolf } from '../../types/wolf';
import type { PatrolType } from '../../types/patrol';
import { simulationEngine } from '../../engine/simulation';

interface PatrolPanelProps {
  pack: Pack;
  onPackUpdate: (pack: Pack) => void;
}

export function PatrolPanel({ pack, onPackUpdate }: PatrolPanelProps) {
  const [selectedPatrolType, setSelectedPatrolType] =
    useState<PatrolType>('hunting');
  const [selectedWolves, setSelectedWolves] = useState<string[]>([]);

  const patrolEngine = simulationEngine.getPatrolEngine();
  const availableWolves = patrolEngine.getAvailableWolves(
    pack,
    selectedPatrolType
  );
  const requiredPatrols = patrolEngine.getRequiredPatrols(pack);
  const mentorPupPairs = patrolEngine.getMentorPupPairs(pack);

  // Get current month's patrol history
  const monthStart = Math.floor(pack.day / 30) * 30;
  const monthPatrols = (pack.patrolHistory || []).filter(
    (result) => result.day >= monthStart
  );

  const handleWolfToggle = (wolfId: string) => {
    setSelectedWolves((prev) =>
      prev.includes(wolfId)
        ? prev.filter((id) => id !== wolfId)
        : [...prev, wolfId]
    );
  };

  const handleAssignPatrol = () => {
    if (selectedWolves.length === 0) return;

    const selectedWolfObjects = selectedWolves
      .map((id) => pack.wolves.find((w) => w.id === id))
      .filter((w): w is Wolf => w !== undefined);

    const assignment = patrolEngine.createPatrolAssignment(
      selectedPatrolType,
      selectedWolfObjects,
      pack
    );

    const updatedPack = { ...pack };
    if (!updatedPack.assignedPatrols) updatedPack.assignedPatrols = [];
    updatedPack.assignedPatrols.push(assignment);

    updatedPack.logs.push(
      `Day ${pack.day}: ${selectedPatrolType.replace('_', ' ')} patrol assigned to ${selectedWolfObjects.map((w) => w.name).join(', ')}`
    );

    setSelectedWolves([]);
    onPackUpdate(updatedPack);
  };

  const handleAssignMentorPatrol = (mentor: Wolf, selectedPups: Wolf[]) => {
    if (selectedPups.length === 0) return;

    const updatedPack = { ...pack };

    const assignment = patrolEngine.createMentorPupPatrol(
      mentor,
      selectedPups,
      updatedPack
    );

    if (!updatedPack.assignedPatrols) updatedPack.assignedPatrols = [];
    updatedPack.assignedPatrols.push(assignment);

    updatedPack.logs.push(
      `Day ${pack.day}: ${mentor.name} will mentor ${selectedPups.map((p) => p.name).join(', ')} on a training patrol`
    );

    onPackUpdate(updatedPack);
  };

  const getPatrolTypeColor = (type: PatrolType) => {
    switch (type) {
      case 'hunting':
        return '#4caf50';
      case 'border':
        return '#ff9800';
      case 'training':
        return '#2196f3';
      case 'herb_gathering':
        return '#8bc34a';
    }
  };

  const getPatrolTypeIcon = (type: PatrolType) => {
    switch (type) {
      case 'hunting':
        return '🦌';
      case 'border':
        return '🛡️';
      case 'training':
        return '🎯';
      case 'herb_gathering':
        return '🌿';
    }
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
        🚶 Patrol Management
      </h2>

      {/* Pack Status */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          marginBottom: '25px',
        }}
      >
        <div
          style={{
            backgroundColor: '#2a2a2a',
            borderRadius: '8px',
            padding: '15px',
            border: '1px solid #404040',
          }}
        >
          <h3
            style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#4fc3f7' }}
          >
            Pack Resources
          </h3>
          <div style={{ fontSize: '13px' }}>
            <div style={{ marginBottom: '5px' }}>
              🍖 Food: <strong>{pack.food || 0}</strong>
            </div>
            <div style={{ marginBottom: '5px' }}>
              🌿 Herbs: <strong>{pack.herbs}</strong>
            </div>
            <div>
              ⭐ Reputation: <strong>{pack.patrolReputation || 50}/100</strong>
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#2a2a2a',
            borderRadius: '8px',
            padding: '15px',
            border: '1px solid #404040',
          }}
        >
          <h3
            style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#4fc3f7' }}
          >
            Monthly Requirements
          </h3>
          <div style={{ fontSize: '13px' }}>
            <div style={{ marginBottom: '5px' }}>
              🦌 Hunting: <strong>{requiredPatrols.hunting}</strong> needed
            </div>
            <div>
              🛡️ Border: <strong>{requiredPatrols.border}</strong> needed
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#2a2a2a',
            borderRadius: '8px',
            padding: '15px',
            border: '1px solid #404040',
          }}
        >
          <h3
            style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#4fc3f7' }}
          >
            This Month's Patrols
          </h3>
          <div style={{ fontSize: '13px' }}>
            <div style={{ marginBottom: '5px' }}>
              🦌 Hunting:{' '}
              <strong>
                {monthPatrols.filter((p) => p.type === 'hunting').length}
              </strong>
            </div>
            <div style={{ marginBottom: '5px' }}>
              🛡️ Border:{' '}
              <strong>
                {monthPatrols.filter((p) => p.type === 'border').length}
              </strong>
            </div>
            <div style={{ marginBottom: '5px' }}>
              🎯 Training:{' '}
              <strong>
                {monthPatrols.filter((p) => p.type === 'training').length}
              </strong>
            </div>
            <div>
              🌿 Herb Gathering:{' '}
              <strong>
                {monthPatrols.filter((p) => p.type === 'herb_gathering').length}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Patrol Assignment */}
      <div
        style={{
          backgroundColor: '#2a2a2a',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #404040',
          marginBottom: '25px',
        }}
      >
        <h3 style={{ margin: '0 0 15px 0', color: '#4fc3f7' }}>
          Assign New Patrol
        </h3>

        {/* Patrol Type Selection */}
        <div style={{ marginBottom: '15px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            Patrol Type:
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            {(
              [
                'hunting',
                'border',
                'training',
                'herb_gathering',
              ] as PatrolType[]
            ).map((type) => (
              <button
                key={type}
                onClick={() => {
                  setSelectedPatrolType(type);
                  setSelectedWolves([]);
                }}
                style={{
                  backgroundColor:
                    selectedPatrolType === type
                      ? getPatrolTypeColor(type)
                      : '#404040',
                  color: selectedPatrolType === type ? '#1a1a1a' : '#e0e0e0',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 15px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                {getPatrolTypeIcon(type)}{' '}
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Wolf Selection */}
        <div style={{ marginBottom: '15px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            Select Wolves ({selectedWolves.length} selected):
          </label>

          {availableWolves.length === 0 ? (
            <div
              style={{
                padding: '15px',
                backgroundColor: '#1a1a1a',
                borderRadius: '6px',
                border: '1px solid #404040',
                textAlign: 'center',
                fontStyle: 'italic',
                opacity: 0.7,
              }}
            >
              No wolves available for {selectedPatrolType} patrols
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: '10px',
              }}
            >
              {availableWolves.map((wolf) => (
                <div
                  key={wolf.id}
                  onClick={() => handleWolfToggle(wolf.id)}
                  style={{
                    backgroundColor: selectedWolves.includes(wolf.id)
                      ? '#4fc3f7'
                      : '#404040',
                    color: selectedWolves.includes(wolf.id)
                      ? '#1a1a1a'
                      : '#e0e0e0',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '10px',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: '3px' }}>
                    {wolf.name} ({wolf.role})
                  </div>
                  <div style={{ opacity: 0.8 }}>
                    Health: {wolf.stats.health}/100 • Age: {wolf.age.toFixed(1)}
                    y
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assign Button */}
        <button
          onClick={handleAssignPatrol}
          disabled={selectedWolves.length === 0}
          style={{
            backgroundColor:
              selectedWolves.length > 0
                ? getPatrolTypeColor(selectedPatrolType)
                : '#666',
            color: selectedWolves.length > 0 ? '#1a1a1a' : '#999',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: selectedWolves.length > 0 ? 'pointer' : 'not-allowed',
            width: '100%',
          }}
        >
          {getPatrolTypeIcon(selectedPatrolType)} Assign{' '}
          {selectedPatrolType.charAt(0).toUpperCase() +
            selectedPatrolType.slice(1).replace('_', ' ')}{' '}
          Patrol
        </button>
      </div>

      {/* Mentor-Pup Training Section */}
      {mentorPupPairs.length > 0 && (
        <div
          style={{
            backgroundColor: '#2a2a2a',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #404040',
            marginBottom: '25px',
          }}
        >
          <h3 style={{ margin: '0 0 15px 0', color: '#4fc3f7' }}>
            🎯 Mentor-Pup Training Patrols
          </h3>

          <div style={{ display: 'grid', gap: '15px' }}>
            {mentorPupPairs.map(({ mentor, pups }) => (
              <MentorPupCard
                key={mentor.id}
                mentor={mentor}
                pups={pups}
                onAssignPatrol={handleAssignMentorPatrol}
              />
            ))}
          </div>
        </div>
      )}

      {/* Scheduled Patrols */}
      {pack.assignedPatrols && pack.assignedPatrols.length > 0 && (
        <div
          style={{
            backgroundColor: '#2a2a2a',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #404040',
            marginBottom: '25px',
          }}
        >
          <h3 style={{ margin: '0 0 15px 0', color: '#4fc3f7' }}>
            Scheduled Patrols
          </h3>

          <div style={{ display: 'grid', gap: '10px' }}>
            {pack.assignedPatrols
              .filter((patrol) => !patrol.completed)
              .map((patrol) => {
                const participantNames = patrol.participants
                  .map((id) => pack.wolves.find((w) => w.id === id)?.name)
                  .filter(Boolean)
                  .join(', ');

                const daysUntil = patrol.scheduledDay - pack.day;

                return (
                  <div
                    key={patrol.id}
                    style={{
                      backgroundColor: '#1a1a1a',
                      borderRadius: '6px',
                      border: `1px solid ${getPatrolTypeColor(patrol.type)}`,
                      padding: '12px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div
                          style={{ fontWeight: 'bold', marginBottom: '3px' }}
                        >
                          {getPatrolTypeIcon(patrol.type)}{' '}
                          {patrol.type.charAt(0).toUpperCase() +
                            patrol.type.slice(1)}{' '}
                          Patrol
                        </div>
                        <div style={{ fontSize: '13px', opacity: 0.8 }}>
                          {participantNames}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', fontSize: '13px' }}>
                        {daysUntil <= 0 ? (
                          <span
                            style={{ color: '#4fc3f7', fontWeight: 'bold' }}
                          >
                            Returning today
                          </span>
                        ) : (
                          <span style={{ opacity: 0.7 }}>
                            Returns in {daysUntil} day
                            {daysUntil !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Recent Patrol Results */}
      {pack.patrolHistory && pack.patrolHistory.length > 0 && (
        <div
          style={{
            backgroundColor: '#2a2a2a',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #404040',
          }}
        >
          <h3 style={{ margin: '0 0 15px 0', color: '#4fc3f7' }}>
            Recent Patrol Results
          </h3>

          <div
            style={{
              maxHeight: '300px',
              overflowY: 'auto',
              display: 'grid',
              gap: '8px',
            }}
          >
            {pack.patrolHistory
              .slice(-10)
              .reverse()
              .map((result) => {
                const outcomeColor = {
                  success: '#4caf50',
                  major_success: '#8bc34a',
                  failure: '#ff9800',
                  disaster: '#f44336',
                  event: '#9c27b0',
                }[result.outcome];

                return (
                  <div
                    key={result.id}
                    style={{
                      backgroundColor: '#1a1a1a',
                      borderRadius: '6px',
                      border: `1px solid ${outcomeColor}`,
                      padding: '10px',
                      fontSize: '13px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '5px',
                      }}
                    >
                      <span style={{ fontWeight: 'bold' }}>
                        {getPatrolTypeIcon(result.type)}{' '}
                        {result.type.charAt(0).toUpperCase() +
                          result.type.slice(1)}
                      </span>
                      <span style={{ color: outcomeColor, fontWeight: 'bold' }}>
                        {result.outcome.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div style={{ opacity: 0.8 }}>{result.description}</div>
                    <div
                      style={{
                        fontSize: '11px',
                        opacity: 0.6,
                        marginTop: '3px',
                      }}
                    >
                      Day {result.day}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

// Mentor-Pup Training Card Component
interface MentorPupCardProps {
  mentor: Wolf;
  pups: Wolf[];
  onAssignPatrol: (mentor: Wolf, selectedPups: Wolf[]) => void;
}

function MentorPupCard({ mentor, pups, onAssignPatrol }: MentorPupCardProps) {
  const [selectedPups, setSelectedPups] = useState<string[]>([]);

  const handlePupToggle = (pupId: string) => {
    setSelectedPups((prev) =>
      prev.includes(pupId)
        ? prev.filter((id) => id !== pupId)
        : [...prev, pupId]
    );
  };

  const handleAssign = () => {
    const selectedPupObjects = selectedPups
      .map((id) => pups.find((p) => p.id === id))
      .filter((p): p is Wolf => p !== undefined);

    onAssignPatrol(mentor, selectedPupObjects);
    setSelectedPups([]);
  };

  return (
    <div
      style={{
        backgroundColor: '#1a1a1a',
        borderRadius: '8px',
        border: '1px solid #2196f3',
        padding: '15px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '10px',
        }}
      >
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
            👤 {mentor.name} ({mentor.role})
          </div>
          <div style={{ fontSize: '13px', opacity: 0.8 }}>
            Health: {mentor.stats.health}/100 • Intelligence:{' '}
            {mentor.stats.intelligence}/10
          </div>
        </div>
        <button
          onClick={handleAssign}
          disabled={selectedPups.length === 0}
          style={{
            backgroundColor: selectedPups.length > 0 ? '#2196f3' : '#666',
            color: selectedPups.length > 0 ? '#1a1a1a' : '#999',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: selectedPups.length > 0 ? 'pointer' : 'not-allowed',
          }}
        >
          🎯 Train ({selectedPups.length})
        </button>
      </div>

      <div
        style={{ marginBottom: '10px', fontSize: '14px', fontWeight: 'bold' }}
      >
        Select Pups to Train:
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '8px',
        }}
      >
        {pups.map((pup) => (
          <div
            key={pup.id}
            onClick={() => handlePupToggle(pup.id)}
            style={{
              backgroundColor: selectedPups.includes(pup.id)
                ? '#2196f3'
                : '#404040',
              color: selectedPups.includes(pup.id) ? '#1a1a1a' : '#e0e0e0',
              border: 'none',
              borderRadius: '6px',
              padding: '8px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
              🐺 {pup.name}
            </div>
            <div style={{ opacity: 0.8, fontSize: '11px' }}>
              Age: {pup.age.toFixed(1)}y • Health: {pup.stats.health}/100
              {pup.trainingMentorId === mentor.id && (
                <div
                  style={{
                    fontSize: '10px',
                    marginTop: '2px',
                    fontStyle: 'italic',
                  }}
                >
                  ✓ Already mentored by {mentor.name}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
