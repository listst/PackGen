import { useState } from 'react';
import type { Pack, EventResult } from '../../types/pack';

interface EventLogProps {
  pack: Pack;
}

type FilterType =
  | 'all'
  | 'hunt'
  | 'birth'
  | 'death'
  | 'injury'
  | 'social'
  | 'training';

export function EventLog({ pack }: EventLogProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [showEventHistory, setShowEventHistory] = useState(false);

  // Combine logs and event history for comprehensive view
  const allEntries = [
    ...pack.logs.map((log, index) => ({
      id: `log-${index}`,
      text: log,
      day: extractDayFromLog(log),
      type: categorizeLogEntry(log),
      isEventResult: false as const,
    })),
    ...pack.eventHistory.map((event) => ({
      id: event.eventId + '-' + event.day,
      text: event.text,
      day: event.day,
      type: categorizeEventResult(event),
      isEventResult: true as const,
      wolfId: event.wolfId,
      targetWolfId: event.targetWolfId,
    })),
  ]
    .sort((a, b) => b.day - a.day) // Most recent first
    .filter((entry) => filter === 'all' || entry.type === filter);

  // Show either basic logs or full event history
  const displayEntries = showEventHistory
    ? allEntries
    : allEntries.filter((entry) => !entry.isEventResult);

  return (
    <div style={{ color: '#e0e0e0' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2
          style={{
            margin: '0 0 15px 0',
            color: '#4fc3f7',
            fontSize: '1.6rem',
          }}
        >
          📜 Event Log
        </h2>

        {/* Controls */}
        <div
          style={{
            display: 'flex',
            gap: '15px',
            flexWrap: 'wrap',
            alignItems: 'center',
            marginBottom: '15px',
          }}
        >
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '5px',
                fontSize: '14px',
                opacity: 0.8,
              }}
            >
              Filter by type:
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterType)}
              style={{
                backgroundColor: '#2a2a2a',
                color: '#e0e0e0',
                border: '1px solid #404040',
                borderRadius: '6px',
                padding: '6px 10px',
                fontSize: '14px',
              }}
            >
              <option value="all">All Events</option>
              <option value="hunt">Hunting</option>
              <option value="birth">Births</option>
              <option value="death">Deaths</option>
              <option value="injury">Injuries</option>
              <option value="social">Social</option>
              <option value="training">Training</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="show-event-history"
              checked={showEventHistory}
              onChange={(e) => setShowEventHistory(e.target.checked)}
              style={{ marginTop: '20px' }}
            />
            <label
              htmlFor="show-event-history"
              style={{ fontSize: '14px', opacity: 0.8, marginTop: '20px' }}
            >
              Show detailed event history
            </label>
          </div>
        </div>

        {/* Stats */}
        <div
          style={{
            backgroundColor: '#2a2a2a',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '15px',
            border: '1px solid #404040',
            fontSize: '13px',
          }}
        >
          <span style={{ opacity: 0.8 }}>
            Showing {displayEntries.length} of {allEntries.length} total entries
            {filter !== 'all' && ` • Filter: ${filter}`}
          </span>
        </div>
      </div>

      {/* Event List */}
      <div
        style={{
          backgroundColor: '#2a2a2a',
          borderRadius: '12px',
          border: '1px solid #404040',
          maxHeight: '600px',
          overflowY: 'auto',
        }}
      >
        {displayEntries.length === 0 ? (
          <div
            style={{
              padding: '40px',
              textAlign: 'center',
              opacity: 0.6,
              fontStyle: 'italic',
            }}
          >
            No events match the current filter.
          </div>
        ) : (
          displayEntries.map((entry) => (
            <div
              key={entry.id}
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid #404040',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
              }}
            >
              {/* Day indicator */}
              <div
                style={{
                  backgroundColor: '#1a1a1a',
                  color: '#4fc3f7',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  minWidth: '50px',
                  textAlign: 'center',
                  flexShrink: 0,
                }}
              >
                Day {entry.day}
              </div>

              {/* Type indicator */}
              <div
                style={{
                  backgroundColor: getTypeColor(entry.type),
                  color: '#1a1a1a',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  flexShrink: 0,
                }}
              >
                {entry.type}
              </div>

              {/* Event text */}
              <div
                style={{
                  flex: 1,
                  fontSize: '14px',
                  lineHeight: '1.4',
                }}
              >
                {entry.text.replace(/^Day \d+: /, '')}{' '}
                {/* Remove day prefix since we show it separately */}
                {entry.isEventResult && 'wolfId' in entry && (
                  <div
                    style={{
                      fontSize: '12px',
                      opacity: 0.6,
                      marginTop: '4px',
                    }}
                  >
                    Event ID: {entry.id.split('-')[0]}
                    {entry.wolfId &&
                      ` • Wolf: ${getWolfName(pack, entry.wolfId)}`}
                    {entry.targetWolfId &&
                      ` • Target: ${getWolfName(pack, entry.targetWolfId)}`}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Helper functions
function extractDayFromLog(log: string): number {
  const match = log.match(/^Day (\d+):/);
  return match ? parseInt(match[1], 10) : 0;
}

function categorizeLogEntry(log: string): FilterType {
  const lowercaseLog = log.toLowerCase();

  if (
    lowercaseLog.includes('hunt') ||
    lowercaseLog.includes('prey') ||
    lowercaseLog.includes('catch')
  ) {
    return 'hunt';
  }
  if (
    lowercaseLog.includes('birth') ||
    lowercaseLog.includes('born') ||
    lowercaseLog.includes('pup')
  ) {
    return 'birth';
  }
  if (
    lowercaseLog.includes('died') ||
    lowercaseLog.includes('death') ||
    lowercaseLog.includes('killed')
  ) {
    return 'death';
  }
  if (
    lowercaseLog.includes('injured') ||
    lowercaseLog.includes('hurt') ||
    lowercaseLog.includes('wounded')
  ) {
    return 'injury';
  }
  if (
    lowercaseLog.includes('training') ||
    lowercaseLog.includes('learn') ||
    lowercaseLog.includes('mentor')
  ) {
    return 'training';
  }
  if (
    lowercaseLog.includes('bond') ||
    lowercaseLog.includes('friend') ||
    lowercaseLog.includes('rival')
  ) {
    return 'social';
  }

  return 'all';
}

function categorizeEventResult(event: EventResult): FilterType {
  // Use event tags or actions to categorize
  const eventText = event.text.toLowerCase();

  if (event.eventId.includes('hunt')) return 'hunt';
  if (event.eventId.includes('birth') || event.eventId.includes('pup'))
    return 'birth';
  if (event.eventId.includes('death') || event.eventId.includes('injury'))
    return 'injury';
  if (event.eventId.includes('train')) return 'training';
  if (event.eventId.includes('social') || event.eventId.includes('bond'))
    return 'social';

  // Fallback to text analysis
  return categorizeLogEntry(eventText);
}

function getTypeColor(type: FilterType): string {
  switch (type) {
    case 'hunt':
      return '#4caf50';
    case 'birth':
      return '#e91e63';
    case 'death':
      return '#f44336';
    case 'injury':
      return '#ff9800';
    case 'social':
      return '#9c27b0';
    case 'training':
      return '#2196f3';
    default:
      return '#666';
  }
}

function getWolfName(pack: Pack, wolfId: string): string {
  const wolf = pack.wolves.find((w) => w.id === wolfId);
  return wolf?.name || 'Unknown';
}
