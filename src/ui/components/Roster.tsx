import { useState } from 'react';
import type { Wolf } from '../../types/wolf';
import { WolfCard } from './WolfCard';

interface RosterProps {
  wolves: Wolf[];
  onWolfSelect?: (wolf: Wolf) => void;
}

type SortOption = 'name' | 'role' | 'age' | 'health';
type FilterOption =
  | 'all'
  | 'alpha'
  | 'beta'
  | 'hunter'
  | 'healer'
  | 'pup'
  | 'elder'
  | 'omega';

export function Roster({ wolves, onWolfSelect }: RosterProps) {
  const [sortBy, setSortBy] = useState<SortOption>('role');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');

  const filteredAndSortedWolves = wolves
    .filter((wolf) => !wolf._dead && !wolf._dispersed)
    .filter((wolf) => filterBy === 'all' || wolf.role === filterBy)
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'role': {
          const roleOrder = [
            'alpha',
            'beta',
            'healer',
            'hunter',
            'omega',
            'elder',
            'pup',
          ];
          return roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role);
        }
        case 'age':
          return b.age - a.age;
        case 'health':
          return b.stats.health - a.stats.health;
        default:
          return 0;
      }
    });

  const roleStats = wolves.reduce(
    (acc, wolf) => {
      if (!wolf._dead && !wolf._dispersed) {
        acc[wolf.role] = (acc[wolf.role] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div style={{ color: '#e0e0e0' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2
          style={{
            margin: '0 0 20px 0',
            color: '#4fc3f7',
            fontSize: '1.6rem',
          }}
        >
          🐺 Wolf Roster ({filteredAndSortedWolves.length} wolves)
        </h2>

        {/* Role Summary */}
        <div
          style={{
            backgroundColor: '#2a2a2a',
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '20px',
            border: '1px solid #404040',
          }}
        >
          <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', opacity: 0.9 }}>
            Pack Composition
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
              gap: '10px',
              fontSize: '13px',
            }}
          >
            {Object.entries(roleStats).map(([role, count]) => (
              <div key={role} style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 'bold', color: '#4fc3f7' }}>
                  {count}
                </div>
                <div style={{ opacity: 0.8, textTransform: 'capitalize' }}>
                  {role.replace('_', ' ')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div
          style={{
            display: 'flex',
            gap: '15px',
            flexWrap: 'wrap',
            alignItems: 'center',
            marginBottom: '20px',
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
              Sort by:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              style={{
                backgroundColor: '#2a2a2a',
                color: '#e0e0e0',
                border: '1px solid #404040',
                borderRadius: '6px',
                padding: '6px 10px',
                fontSize: '14px',
              }}
            >
              <option value="role">Role</option>
              <option value="name">Name</option>
              <option value="age">Age</option>
              <option value="health">Health</option>
            </select>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '5px',
                fontSize: '14px',
                opacity: 0.8,
              }}
            >
              Filter by role:
            </label>
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as FilterOption)}
              style={{
                backgroundColor: '#2a2a2a',
                color: '#e0e0e0',
                border: '1px solid #404040',
                borderRadius: '6px',
                padding: '6px 10px',
                fontSize: '14px',
              }}
            >
              <option value="all">All Roles</option>
              <option value="alpha">Alpha</option>
              <option value="beta">Beta</option>
              <option value="hunter">Hunter</option>
              <option value="healer">Healer</option>
              <option value="omega">Omega</option>
              <option value="elder">Elder</option>
              <option value="pup">Pup</option>
            </select>
          </div>
        </div>
      </div>

      {/* Wolf Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
        }}
      >
        {filteredAndSortedWolves.map((wolf) => (
          <WolfCard
            key={wolf.id}
            wolf={wolf}
            {...(onWolfSelect && { onClick: onWolfSelect })}
          />
        ))}
      </div>

      {filteredAndSortedWolves.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '40px',
            opacity: 0.6,
            fontStyle: 'italic',
          }}
        >
          No wolves match the current filter.
        </div>
      )}
    </div>
  );
}
