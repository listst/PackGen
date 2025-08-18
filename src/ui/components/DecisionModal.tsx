import type { DecisionEvent, MoonEvent } from '../../types/event';
import type { Pack } from '../../types/pack';

interface DecisionModalProps {
  decision: DecisionEvent;
  pack: Pack;
  onChoice: (choiceId: string) => void;
  onClose?: () => void;
}

const categoryColors: Record<string, string> = {
  leadership: '#ff6b6b',
  ceremony: '#45b7d1',
  crisis: '#fd79a8',
  opportunity: '#96ceb4',
  pack_wide: '#ffeaa7',
};

const categoryIcons: Record<string, string> = {
  leadership: '👑',
  ceremony: '🎭',
  crisis: '⚠️',
  opportunity: '✨',
  pack_wide: '🐺',
};

export function DecisionModal({
  decision,
  pack,
  onChoice,
  onClose,
}: DecisionModalProps) {
  const isMoonEvent = 'category' in decision;
  const moonEvent = isMoonEvent ? (decision as MoonEvent) : null;
  const category: string = moonEvent?.category || 'leadership';

  // Filter choices based on conditions
  const availableChoices = decision.choices.filter((choice) => {
    if (!choice.condition) return true;

    // This is a simplified condition check - in a full implementation,
    // you'd use the eventEngine.evaluateConditionGroup method
    // For now, we'll show all choices
    return true;
  });

  const timeRemaining = decision.timeoutDays
    ? `${decision.timeoutDays} days to decide`
    : 'No time limit';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
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
          padding: '32px',
          maxWidth: '700px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          color: '#e0e0e0',
          border: `3px solid ${categoryColors[category] || '#404040'}`,
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '24px',
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px',
              }}
            >
              {isMoonEvent && (
                <div
                  style={{
                    fontSize: '32px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  🌙 {categoryIcons[category]}
                </div>
              )}
              <div>
                <h2
                  style={{
                    margin: '0 0 8px 0',
                    fontSize: '1.8rem',
                    color: categoryColors[category] || '#e0e0e0',
                    lineHeight: '1.2',
                  }}
                >
                  {decision.title || 'Pack Decision'}
                </h2>
                {isMoonEvent && (
                  <div
                    style={{
                      display: 'inline-block',
                      backgroundColor: categoryColors[category],
                      color: '#1a1a1a',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                    }}
                  >
                    {category.replace('_', ' ')} • Moon Event
                  </div>
                )}
              </div>
            </div>

            <div
              style={{
                fontSize: '12px',
                opacity: 0.7,
                marginBottom: '16px',
              }}
            >
              Day {pack.day} • {pack.season} • {timeRemaining}
            </div>
          </div>

          {onClose && (
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
                opacity: 0.7,
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Event Description */}
        <div
          style={{
            backgroundColor: '#1a1a1a',
            border: `1px solid ${categoryColors[category]}40`,
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '32px',
            fontSize: '16px',
            lineHeight: '1.6',
          }}
        >
          {decision.text}
        </div>

        {/* Pack Status Context */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '12px',
            marginBottom: '24px',
            padding: '16px',
            backgroundColor: '#1a1a1a',
            borderRadius: '8px',
            border: '1px solid #333',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div
              style={{ fontSize: '18px', fontWeight: 'bold', color: '#4fc3f7' }}
            >
              {pack.wolves.filter((w) => !w._dead && !w._dispersed).length}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.7 }}>Wolves</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{ fontSize: '18px', fontWeight: 'bold', color: '#96ceb4' }}
            >
              {pack.food || 0}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.7 }}>Food</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffeaa7' }}
            >
              {pack.packApproval || 50}%
            </div>
            <div style={{ fontSize: '12px', opacity: 0.7 }}>Approval</div>
          </div>
        </div>

        {/* Choices */}
        <div style={{ marginBottom: '20px' }}>
          <h3
            style={{
              margin: '0 0 16px 0',
              fontSize: '1.2rem',
              color: '#4fc3f7',
            }}
          >
            Choose Your Path
          </h3>

          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
          >
            {availableChoices.map((choice, index) => (
              <button
                key={choice.id}
                onClick={() => onChoice(choice.id)}
                style={{
                  backgroundColor: '#333',
                  border: `2px solid ${categoryColors[category]}40`,
                  borderRadius: '12px',
                  padding: '20px',
                  color: '#e0e0e0',
                  fontSize: '15px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#404040';
                  e.currentTarget.style.borderColor =
                    categoryColors[category] || '#404040';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#333';
                  e.currentTarget.style.borderColor = `${categoryColors[category] || '#404040'}40`;
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{
                      backgroundColor: categoryColors[category],
                      color: '#1a1a1a',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    {index + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ lineHeight: '1.4', marginBottom: '8px' }}>
                      {choice.text}
                    </div>
                    {choice.description && (
                      <div
                        style={{
                          fontSize: '13px',
                          opacity: 0.7,
                          lineHeight: '1.3',
                        }}
                      >
                        {choice.description}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Warning for timed decisions */}
        {decision.timeoutDays && (
          <div
            style={{
              backgroundColor: '#332222',
              border: '1px solid #664444',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '13px',
              color: '#ffcc99',
              textAlign: 'center',
            }}
          >
            ⏰ This decision will be made automatically if not chosen within{' '}
            {decision.timeoutDays} days
          </div>
        )}
      </div>
    </div>
  );
}
