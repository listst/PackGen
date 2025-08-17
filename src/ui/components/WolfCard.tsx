import type { Wolf } from '../../types/wolf';

interface WolfCardProps {
  wolf: Wolf;
  onClick?: (wolf: Wolf) => void;
  className?: string;
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

export function WolfCard({ wolf, onClick, className = '' }: WolfCardProps) {
  const handleClick = () => onClick?.(wolf);

  return (
    <div
      className={className}
      onClick={handleClick}
      style={{
        backgroundColor: '#2a2a2a',
        border: `2px solid ${roleColors[wolf.role] || '#404040'}`,
        borderRadius: '12px',
        padding: '18px',
        color: '#e0e0e0',
        position: 'relative',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        cursor: onClick ? 'pointer' : 'default',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = `0 8px 25px rgba(${
          roleColors[wolf.role]
            ? roleColors[wolf.role]
                .slice(1)
                .match(/.{2}/g)
                ?.map((x) => parseInt(x, 16))
                .join(',')
            : '64,64,64'
        }, 0.3)`;
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          backgroundColor: roleColors[wolf.role] || '#666',
          color: '#1a1a1a',
          padding: '4px 8px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: 'bold',
          textTransform: 'uppercase',
        }}
      >
        {wolf.role.replace('_', ' ')}
      </div>

      <h3
        style={{
          margin: '0 0 12px 0',
          fontSize: '1.3rem',
          color: roleColors[wolf.role] || '#e0e0e0',
        }}
      >
        {wolf.name}
      </h3>

      <div style={{ fontSize: '13px', opacity: 0.8, marginBottom: '12px' }}>
        {wolf.sex} • {wolf.age.toFixed(1)} years old
      </div>

      <div style={{ display: 'grid', gap: '6px', fontSize: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Health:</span>
          <span
            style={{
              color:
                wolf.stats.health > 70
                  ? '#4caf50'
                  : wolf.stats.health > 40
                    ? '#ff9800'
                    : '#f44336',
            }}
          >
            {wolf.stats.health}/100
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '8px',
            margin: '8px 0',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11px', opacity: 0.7 }}>STR</div>
            <div style={{ fontWeight: 'bold' }}>
              {wolf.stats.strength.toFixed(2)}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11px', opacity: 0.7 }}>SPD</div>
            <div style={{ fontWeight: 'bold' }}>
              {wolf.stats.speed.toFixed(2)}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11px', opacity: 0.7 }}>INT</div>
            <div style={{ fontWeight: 'bold' }}>
              {wolf.stats.intelligence.toFixed(2)}
            </div>
          </div>
        </div>

        <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '8px' }}>
          <div>
            {wolf.appearance.furColor} {wolf.appearance.pattern}
          </div>
          <div>{wolf.appearance.eyeColor} eyes</div>
        </div>

        <div
          style={{
            marginTop: '10px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
          }}
        >
          {wolf.pregnant && (
            <span
              style={{
                backgroundColor: '#4caf50',
                color: '#1a1a1a',
                padding: '2px 6px',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: 'bold',
              }}
            >
              🤱 Pregnant
            </span>
          )}
          {wolf.isTraining && (
            <span
              style={{
                backgroundColor: '#2196f3',
                color: '#1a1a1a',
                padding: '2px 6px',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: 'bold',
              }}
            >
              📚 Training
            </span>
          )}
          {wolf.isSick && (
            <span
              style={{
                backgroundColor: '#f44336',
                color: '#1a1a1a',
                padding: '2px 6px',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: 'bold',
              }}
            >
              🤒 Sick
            </span>
          )}
          {wolf.xp !== undefined && wolf.xp > 0 && (
            <span
              style={{
                backgroundColor: '#ff9800',
                color: '#1a1a1a',
                padding: '2px 6px',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: 'bold',
              }}
            >
              ⭐ Lv.{wolf.level} ({wolf.xp}XP)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
