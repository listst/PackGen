import type { Wolf } from '../../types/wolf';

interface WolfPortraitProps {
  wolf: Wolf;
  size?: 'small' | 'medium' | 'large';
  showDetails?: boolean;
}

export function WolfPortrait({
  wolf,
  size = 'medium',
  showDetails = true,
}: WolfPortraitProps) {
  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24',
    large: 'w-32 h-32',
  };

  const getColorValue = (color: string): string => {
    const colorMap: Record<string, string> = {
      black: '#1a1a1a',
      dark_brown: '#3d2914',
      brown: '#8b4513',
      gray: '#808080',
      light_gray: '#d3d3d3',
      white: '#f5f5f5',
      red: '#b22222',
      cream: '#f5deb3',
      silver: '#c0c0c0',
      tawny: '#cd853f',
      golden: '#ffd700',
      russet: '#80461b',
      sable: '#654321',
      olive: '#808000',
    };
    return colorMap[color] || colorMap[wolf.appearance.furColor] || '#8b4513';
  };

  const getEyeColorValue = (color: string): string => {
    const eyeColorMap: Record<string, string> = {
      amber: '#ffbf00',
      brown: '#8b4513',
      yellow: '#ffff00',
      gold: '#ffd700',
      green: '#00ff00',
      blue: '#0000ff',
      hazel: '#8e7618',
      copper: '#b87333',
    };
    return eyeColorMap[color] || '#ffbf00';
  };

  const baseColor = getColorValue(
    wolf.appearance.baseColor || wolf.appearance.furColor
  );
  const markingColor = wolf.appearance.markingColor
    ? getColorValue(wolf.appearance.markingColor)
    : undefined;
  const eyeColor = getEyeColorValue(wolf.appearance.eyeColor);

  // Generate a simple wolf silhouette with color styling
  const wolfStyle = {
    backgroundColor: baseColor,
    borderColor: markingColor || baseColor,
  };

  const renderSimplePortrait = () => (
    <div
      className={`${sizeClasses[size]} bg-gray-700 rounded-full border-2 flex items-center justify-center relative overflow-hidden`}
      style={wolfStyle}
      title={`${wolf.name} - ${wolf.appearance.furColor} ${wolf.appearance.pattern}`}
    >
      {/* Simple wolf face representation */}
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Eyes */}
        <div
          className="absolute top-1/3 left-1/4 w-2 h-2 rounded-full border border-black"
          style={{ backgroundColor: eyeColor }}
        ></div>
        <div
          className="absolute top-1/3 right-1/4 w-2 h-2 rounded-full border border-black"
          style={{ backgroundColor: eyeColor }}
        ></div>

        {/* Nose */}
        <div className="absolute bottom-1/3 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-black rounded-full"></div>

        {/* Markings based on pattern */}
        {wolf.appearance.pattern !== 'solid' && markingColor && (
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background:
                wolf.appearance.pattern === 'striped'
                  ? `repeating-linear-gradient(45deg, transparent, transparent 2px, ${markingColor} 2px, ${markingColor} 4px)`
                  : wolf.appearance.pattern === 'spotted' ||
                      wolf.appearance.markingType === 'spotted'
                    ? `radial-gradient(circle at 30% 30%, ${markingColor} 2px, transparent 2px), radial-gradient(circle at 70% 60%, ${markingColor} 1px, transparent 1px)`
                    : `linear-gradient(135deg, ${markingColor} 0%, transparent 50%)`,
            }}
          />
        )}

        {/* Scars indicator */}
        {wolf.appearance.scars.length > 0 && (
          <div className="absolute top-1/4 right-1/6 w-1 h-3 bg-red-600 opacity-60 transform rotate-45"></div>
        )}
      </div>
    </div>
  );

  const renderDetailedInfo = () => (
    <div className="text-xs space-y-1 mt-2">
      <div className="font-semibold text-white">{wolf.name}</div>
      <div className="text-gray-300">
        {wolf.appearance.baseColor || wolf.appearance.furColor}{' '}
        {wolf.appearance.pattern}
      </div>
      <div className="text-gray-400">{wolf.appearance.eyeColor} eyes</div>
      {wolf.appearance.scars.length > 0 && (
        <div className="text-red-400 text-xs">
          {wolf.appearance.scars.length} scar
          {wolf.appearance.scars.length > 1 ? 's' : ''}
        </div>
      )}
      {wolf.appearance.bodySize && (
        <div className="text-gray-400">{wolf.appearance.bodySize} build</div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col items-center">
      {renderSimplePortrait()}
      {showDetails && renderDetailedInfo()}
    </div>
  );
}

// Enhanced appearance display component for detailed views
interface AppearanceDetailProps {
  wolf: Wolf;
}

export function AppearanceDetail({ wolf }: AppearanceDetailProps) {
  const app = wolf.appearance;

  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-3">
      <h3 className="text-lg font-semibold text-white mb-3">Appearance</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="text-sm">
            <span className="text-gray-400">Coat:</span>
            <span className="text-white ml-2">
              {app.baseColor || app.furColor} {app.pattern}
            </span>
          </div>

          <div className="text-sm">
            <span className="text-gray-400">Eyes:</span>
            <span className="text-white ml-2">{app.eyeColor}</span>
          </div>

          {app.markingColor && (
            <div className="text-sm">
              <span className="text-gray-400">Markings:</span>
              <span className="text-white ml-2">
                {app.markingColor} {app.markingType}
              </span>
            </div>
          )}

          {app.noseColor && (
            <div className="text-sm">
              <span className="text-gray-400">Nose:</span>
              <span className="text-white ml-2">{app.noseColor}</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          {app.furLength && (
            <div className="text-sm">
              <span className="text-gray-400">Fur:</span>
              <span className="text-white ml-2">
                {app.furLength} {app.furTexture && `& ${app.furTexture}`}
              </span>
            </div>
          )}

          {app.bodySize && (
            <div className="text-sm">
              <span className="text-gray-400">Build:</span>
              <span className="text-white ml-2">{app.bodySize}</span>
            </div>
          )}

          {app.earShape && (
            <div className="text-sm">
              <span className="text-gray-400">Ears:</span>
              <span className="text-white ml-2">{app.earShape}</span>
            </div>
          )}

          {app.tailType && (
            <div className="text-sm">
              <span className="text-gray-400">Tail:</span>
              <span className="text-white ml-2">{app.tailType}</span>
            </div>
          )}
        </div>
      </div>

      {app.scars.length > 0 && (
        <div className="pt-2 border-t border-gray-700">
          <div className="text-sm">
            <span className="text-gray-400">Scars:</span>
            <span className="text-red-400 ml-2">{app.scars.join(', ')}</span>
          </div>
        </div>
      )}
    </div>
  );
}
