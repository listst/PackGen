import { useState } from 'react';
import './App.css';
import { simulationEngine, eventEngine } from './engine/index';
import starterWolves from './data/starter_wolves.json';
import eventExamples from './data/events_examples.json';
import type { Pack } from './types/pack';
import type { Wolf } from './types/wolf';
import {
  Roster,
  Profile,
  EventLog,
  HealerPanel,
  TerritoryPanel,
  GeneticsViewer,
  SaveLoadPanel,
} from './ui/components';
import { SaveLoadManager } from './utils/saveLoad';

type TabType =
  | 'overview'
  | 'roster'
  | 'healer'
  | 'territory'
  | 'genetics'
  | 'saves'
  | 'events';

function App() {
  const [pack, setPack] = useState<Pack>(() => {
    // Initialize pack with starter wolves
    const initialPack: Pack = {
      name: 'Moonhowl Pack',
      day: 1,
      season: 'spring',
      wolves: starterWolves as Wolf[],
      herbs: 5,
      logs: ['Day 1: The pack begins their journey...'],
      eventHistory: [],
      prophecies: [],
      storyEvents: [],
      prophecyPower: 0,
    };

    // Load events
    eventEngine.loadEvents(eventExamples);

    return initialPack;
  });

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedWolf, setSelectedWolf] = useState<Wolf | null>(null);

  const simulateDay = () => {
    const newPack = { ...pack };
    const eventResults = simulationEngine.simulateDay(newPack);

    // Log event results
    eventResults.forEach((result) => {
      newPack.logs.push(`Day ${newPack.day}: ${result.text}`);
    });

    // Auto-save every 10 days
    if (newPack.day % 10 === 0) {
      try {
        SaveLoadManager.createAutoSave(newPack);
      } catch (error) {
        console.warn('Auto-save failed:', error);
      }
    }

    setPack(newPack);
  };

  const simulateMultipleDays = (days: number) => {
    const newPack = { ...pack };
    const allResults = simulationEngine.simulateMultipleDays(newPack, days);

    // Log all results
    allResults.forEach((result) => {
      newPack.logs.push(`Day ${result.day}: ${result.text}`);
    });

    // Auto-save after multiple day simulation
    try {
      SaveLoadManager.createAutoSave(newPack);
    } catch (error) {
      console.warn('Auto-save failed:', error);
    }

    setPack(newPack);
  };

  const aliveWolves = pack.wolves.filter((w) => !w._dead && !w._dispersed);
  const packStats = simulationEngine.getPackStats(pack);

  const breedingPairs =
    aliveWolves.filter((w) => w.age >= 1.5 && w.age <= 10).length >= 2 ? 1 : 0;

  const tabs = [
    { id: 'overview' as TabType, label: '🏠 Overview', count: null },
    { id: 'roster' as TabType, label: '🐺 Roster', count: aliveWolves.length },
    { id: 'healer' as TabType, label: '🔮 Healer', count: pack.herbs },
    {
      id: 'territory' as TabType,
      label: '🗺️ Territory',
      count: pack.territory?.rivalPacks.length || 0,
    },
    { id: 'genetics' as TabType, label: '🧬 Genetics', count: breedingPairs },
    { id: 'saves' as TabType, label: '💾 Saves', count: null },
    { id: 'events' as TabType, label: '📜 Events', count: pack.logs.length },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#1a1a1a',
        color: '#e0e0e0',
        fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
      }}
    >
      {/* Header */}
      <header
        style={{
          textAlign: 'center',
          padding: '20px 20px 0 20px',
          borderBottom: '1px solid #404040',
          marginBottom: '0',
        }}
      >
        <h1
          style={{
            fontSize: '2.5rem',
            margin: '0 0 10px 0',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          🐺 PackGen - Wolf Pack Simulator
        </h1>
        <p style={{ fontSize: '1.1rem', opacity: 0.8, margin: '0 0 20px 0' }}>
          {pack.name} • Day {pack.day} ({pack.season}) • {aliveWolves.length}{' '}
          wolves
        </p>

        {/* Tab Navigation */}
        <nav style={{ display: 'flex', justifyContent: 'center', gap: '0' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                backgroundColor: activeTab === tab.id ? '#4fc3f7' : '#2a2a2a',
                color: activeTab === tab.id ? '#1a1a1a' : '#e0e0e0',
                border: '1px solid #404040',
                borderBottom:
                  activeTab === tab.id
                    ? '2px solid #4fc3f7'
                    : '1px solid #404040',
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                position: 'relative',
                borderRadius: '8px 8px 0 0',
                marginBottom: '-1px',
              }}
            >
              {tab.label}
              {tab.count !== null && (
                <span
                  style={{
                    marginLeft: '8px',
                    backgroundColor:
                      activeTab === tab.id ? '#1a1a1a' : '#4fc3f7',
                    color: activeTab === tab.id ? '#4fc3f7' : '#1a1a1a',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    fontSize: '11px',
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </header>

      {/* Tab Content */}
      <main style={{ padding: '20px' }}>
        {activeTab === 'overview' && (
          <div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '25px',
                marginBottom: '30px',
              }}
            >
              {/* Pack Status */}
              <div
                style={{
                  backgroundColor: '#2a2a2a',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid #404040',
                }}
              >
                <h2
                  style={{
                    margin: '0 0 20px 0',
                    color: '#4fc3f7',
                    fontSize: '1.4rem',
                  }}
                >
                  Pack Status
                </h2>

                <div style={{ display: 'grid', gap: '8px' }}>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <span style={{ opacity: 0.8 }}>Pack:</span>
                    <span style={{ fontWeight: 'bold' }}>{pack.name}</span>
                  </div>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <span style={{ opacity: 0.8 }}>Day:</span>
                    <span style={{ fontWeight: 'bold' }}>
                      {pack.day} ({pack.season})
                    </span>
                  </div>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <span style={{ opacity: 0.8 }}>Wolves:</span>
                    <span style={{ fontWeight: 'bold' }}>
                      {aliveWolves.length}
                    </span>
                  </div>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <span style={{ opacity: 0.8 }}>Herbs:</span>
                    <span style={{ fontWeight: 'bold' }}>{pack.herbs}</span>
                  </div>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <span style={{ opacity: 0.8 }}>Avg Health:</span>
                    <span style={{ fontWeight: 'bold' }}>
                      {packStats.averageHealth.toFixed(1)}
                    </span>
                  </div>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <span style={{ opacity: 0.8 }}>Prophecies:</span>
                    <span style={{ fontWeight: 'bold' }}>
                      {pack.prophecies.length}
                    </span>
                  </div>
                </div>

                <div
                  style={{ display: 'grid', gap: '10px', marginTop: '20px' }}
                >
                  <button
                    onClick={simulateDay}
                    style={{
                      width: '100%',
                      padding: '12px 20px',
                      fontSize: '16px',
                      backgroundColor: '#4fc3f7',
                      color: '#1a1a1a',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                    }}
                  >
                    ⏭️ Simulate 1 Day
                  </button>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '10px',
                    }}
                  >
                    <button
                      onClick={() => simulateMultipleDays(7)}
                      style={{
                        padding: '10px 16px',
                        fontSize: '14px',
                        backgroundColor: '#2a2a2a',
                        color: '#e0e0e0',
                        border: '1px solid #404040',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                      }}
                    >
                      ⏩ 7 Days
                    </button>
                    <button
                      onClick={() => simulateMultipleDays(30)}
                      style={{
                        padding: '10px 16px',
                        fontSize: '14px',
                        backgroundColor: '#2a2a2a',
                        color: '#e0e0e0',
                        border: '1px solid #404040',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                      }}
                    >
                      ⏩ 30 Days
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div
                style={{
                  backgroundColor: '#2a2a2a',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid #404040',
                }}
              >
                <h2
                  style={{
                    margin: '0 0 15px 0',
                    color: '#4fc3f7',
                    fontSize: '1.4rem',
                  }}
                >
                  Recent Activity
                </h2>
                <div
                  style={{
                    height: '280px',
                    overflowY: 'auto',
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #404040',
                    borderRadius: '6px',
                    padding: '12px',
                  }}
                >
                  {pack.logs.slice(-15).map((log, index) => (
                    <div
                      key={index}
                      style={{
                        marginBottom: '8px',
                        fontSize: '13px',
                        lineHeight: '1.4',
                        padding: '4px 0',
                        borderBottom:
                          index < pack.logs.slice(-15).length - 1
                            ? '1px solid #333'
                            : 'none',
                      }}
                    >
                      {log}
                    </div>
                  ))}
                  {pack.logs.length === 1 && (
                    <div style={{ opacity: 0.6, fontStyle: 'italic' }}>
                      Click "Simulate 1 Day" to see events unfold...
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px',
              }}
            >
              {['alpha', 'beta', 'hunter', 'healer', 'pup', 'elder'].map(
                (role) => {
                  const roleWolves = aliveWolves.filter(
                    (w) =>
                      w.role === role ||
                      (role === 'alpha' && w.role === 'alpha_mate')
                  );
                  const avgHealth =
                    roleWolves.length > 0
                      ? roleWolves.reduce((sum, w) => sum + w.stats.health, 0) /
                        roleWolves.length
                      : 0;

                  return (
                    <div
                      key={role}
                      style={{
                        backgroundColor: '#2a2a2a',
                        borderRadius: '8px',
                        padding: '16px',
                        border: '1px solid #404040',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: '24px', marginBottom: '8px' }}>
                        {roleWolves.length}
                      </div>
                      <div
                        style={{
                          fontWeight: 'bold',
                          textTransform: 'capitalize',
                          marginBottom: '4px',
                        }}
                      >
                        {role === 'alpha' ? 'Alphas' : role + 's'}
                      </div>
                      <div style={{ fontSize: '12px', opacity: 0.7 }}>
                        Avg Health: {avgHealth.toFixed(0)}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        )}

        {activeTab === 'roster' && (
          <Roster wolves={pack.wolves} onWolfSelect={setSelectedWolf} />
        )}

        {activeTab === 'healer' && (
          <HealerPanel pack={pack} onPackUpdate={setPack} />
        )}

        {activeTab === 'territory' && (
          <TerritoryPanel pack={pack} onPackUpdate={setPack} />
        )}

        {activeTab === 'genetics' && (
          <GeneticsViewer pack={pack} onWolfSelect={setSelectedWolf} />
        )}

        {activeTab === 'saves' && (
          <SaveLoadPanel
            pack={pack}
            onPackLoad={setPack}
            onSaveComplete={() => {
              // Could show a success message here
            }}
          />
        )}

        {activeTab === 'events' && <EventLog pack={pack} />}
      </main>

      {/* Wolf Profile Modal */}
      {selectedWolf && (
        <Profile
          wolf={selectedWolf}
          pack={pack}
          onClose={() => setSelectedWolf(null)}
        />
      )}
    </div>
  );
}

export default App;
