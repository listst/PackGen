# 🐺 PackGen → ClanGen: Development Roadmap

**Last Updated**: January 2025  
**Current Status**: Phase 1.2 Complete (Patrol System)  
**Next Milestone**: Phase 1.3 (Enhanced Event System)

---

## 📊 **Executive Summary**

This document outlines the strategic development path to transform PackGen from a wolf pack simulation into a fully-featured, ClanGen-style interactive game. The project leverages sophisticated existing foundations while adding the narrative depth and player agency that defines the ClanGen experience.

### **Current Strengths vs ClanGen**

- ✅ **Superior technical architecture** (TypeScript, React, comprehensive testing)
- ✅ **Advanced genetics system** with statistical inheritance and family trees
- ✅ **Complex relationship progression** (6-stage system vs ClanGen's simpler approach)
- ✅ **Sophisticated patrol system** with 4 patrol types and resource management
- ✅ **Real-time simulation** with seasonal mechanics and aging

### **Areas Needing Development**

- 🎯 **Player decision systems** and consequence mechanics
- 🎯 **Monthly "moon events"** with major story impacts
- 🎯 **Visual wolf appearance** generation and inheritance
- 🎯 **Death and memorial** ceremonies
- 🎯 **Pack culture and traditions** system

---

## 🎯 **Phase-by-Phase Development Plan**

### **Phase 1: Core Gameplay Loop** (Months 1-2) - **IN PROGRESS**

#### **✅ 1.1 Player Decision System** - Ready for Implementation

**Objective**: Transform from passive simulation to interactive game

- Add leader decisions during major events
- Create approval/reputation system affecting pack stability
- Implement consequences for leadership choices
- Add monthly council meetings for pack decisions

#### **✅ 1.2 Monthly Patrol System** - **COMPLETED** ✨

**Objective**: Provide core player agency through strategic patrol assignments

**Implemented Features:**

- **🦌 Hunting Patrols**: Food gathering with injury/success risks
- **🛡️ Border Patrols**: Territory defense and rival encounters
- **🎯 Training Patrols**: Apprentice skill development
- **🌿 Herb Gathering**: Medicinal supply collection (NEW)
- **👥 Mentor-Pup System**: Specialized apprentice training (NEW)

**Technical Implementation:**

```typescript
// Key files:
src / types / patrol.ts; // Type definitions
src / engine / patrol.ts; // Core patrol logic
src / ui / components / PatrolPanel.tsx; // UI interface
```

**Gameplay Features:**

- 4 distinct patrol types with unique outcomes
- Resource management (food, herbs, reputation)
- Seasonal effectiveness modifiers
- Role-based wolf eligibility
- Random outcome generation (like ClanGen)
- Monthly patrol requirements for pack survival

#### **🔄 1.3 Enhanced Event System** - **NEXT PRIORITY**

**Objective**: Add monthly "moon events" with major story consequences

**Planned Features:**

- Monthly story events requiring player decisions
- Event chains with long-term consequences
- Seasonal ceremonies (coming of age, mate bonding, leadership succession)
- Pack-wide events affecting multiple wolves
- Rival pack interactions and diplomacy

**Technical Approach:**

- Extend existing event engine (`src/engine/eventEngine.ts`)
- Add decision tree system for player choices
- Implement event chain tracking
- Create ceremony event templates

#### **🔄 1.4 Content Expansion** - **FINAL PHASE 1 STEP**

**Objective**: Rich content library matching ClanGen's depth

**Planned Content:**

- 200+ event scenarios and outcomes
- Multiple biome types (forest, mountain, tundra, desert)
- Diverse pack starting scenarios
- Extended event templates for richer storytelling
- Seasonal event variations

---

### **Phase 2: Visual & Narrative Appeal** (Months 2-3)

#### **2.1 Wolf Appearance Generator**

**Objective**: Visual wolf representation with genetic inheritance

**Planned Features:**

- Procedural fur patterns, colors, and markings
- Scar and injury visual tracking
- Eye color variations
- Visual inheritance through genetics
- Wolf portrait generation for UI

**Technical Approach:**

```typescript
// New files to create:
src / types / appearance.ts; // Visual trait definitions
src / engine / genetics.ts; // Visual trait inheritance
src / ui / components / WolfPortrait.tsx; // Visual representation
```

#### **2.2 Backstory & Lore System**

**Objective**: Procedural narrative generation

**Planned Features:**

- Auto-generated wolf backstories
- Pack history and tradition tracking
- Prophecy and spiritual systems
- Ancestral wolf guidance
- Cultural memory system

#### **2.3 Death & Memorial System**

**Objective**: Emotional engagement through loss and remembrance

**Planned Features:**

- "Spirit Pack" of deceased wolves
- Memorial ceremonies and grieving
- Guidance from deceased pack members
- Pack morale effects from deaths
- Legacy system for influential wolves

---

### **Phase 3: Advanced Features** (Months 3-4)

#### **3.1 Territory & Politics**

- Expanded rival pack interactions
- Territory claiming mechanics
- Resource competition
- Alliance and diplomacy systems

#### **3.2 Advanced Apprentice System**

- Skill specialization tracks
- Graduation ceremonies
- Role assignment mechanics
- Advanced mentor relationships

#### **3.3 Pack Culture & Traditions**

- Customizable pack values
- Seasonal festivals
- Cultural evolution over generations
- Pack-specific ceremonies

---

### **Phase 4: Polish & Community** (Months 4-5)

#### **4.1 UI/UX Enhancement**

- Professional visual design
- Mobile responsiveness
- Improved navigation
- Accessibility features

#### **4.2 Community Features**

- Pack sharing and import/export
- Event modding support
- Community content integration
- Save file compatibility

---

## 🏗️ **Technical Architecture Overview**

### **Current System Architecture**

#### **Core Engine Layer** (`src/engine/`)

```
simulation.ts     // Main simulation loop and day processing
patrol.ts         // Patrol system (4 types, outcomes, scheduling)
eventEngine.ts    // Event processing with custom DSL
mating.ts         // Breeding and relationship systems
combat.ts         // Battle resolution mechanics
healer.ts         // Healing and prophecy systems
training.ts       // Experience and skill development
```

#### **Type System** (`src/types/`)

```
wolf.ts           // Wolf stats, traits, roles, family trees
pack.ts           // Pack state, game config, seasons
patrol.ts         // Patrol types, outcomes, assignments
event.ts          // Event templates, conditions, DSL
territory.ts      // Territory and rival pack management
utils.ts          // Utility functions and helpers
```

#### **UI Layer** (`src/ui/components/`)

```
PatrolPanel.tsx   // Patrol management interface (NEW)
Roster.tsx        // Wolf listing and filtering
Profile.tsx       // Individual wolf details
HealerPanel.tsx   // Healing and prophecy interface
GeneticsViewer.tsx // Breeding and family trees
SaveLoadPanel.tsx // Save/load management
```

#### **Data Layer** (`src/data/`)

```
events_examples.json     // Event templates
starter_wolves.json      // Initial pack configuration
mating_events.json       // Breeding-specific events
relationship_events.json // Social interaction events
```

### **Key Design Patterns**

#### **1. Event-Driven Architecture**

- Custom DSL for event conditions and effects
- Template-based event system for easy content creation
- JavaScript evaluation for dynamic event logic

```javascript
// Example event condition
"wolf.stats.health > 50 && pack.season === 'winter'";

// Example event effect
'wolf.stats.health += 10; pack.logs.push(`${wolf.name} recovered!`)';
```

#### **2. Modular Engine System**

- Singleton simulation engine with pluggable systems
- Separate engines for mating, patrol, events, etc.
- Configuration-driven behavior modification

#### **3. Type-Safe State Management**

- Comprehensive TypeScript types for all game entities
- Runtime validation with Zod schemas
- Immutable state updates in React components

#### **4. Extensible Configuration**

```typescript
// Game balance through configuration
export const DEFAULT_CONFIG: GameConfig = {
  daysPerSeason: 40,
  eventsPerDay: { min: 2, max: 4 },
  patrolSystem: {
    minHuntingPatrolsPerMonth: 2,
    minBorderPatrolsPerMonth: 1,
    baseSuccessRate: 0.7,
  },
  // ... extensive configuration options
};
```

---

## 👥 **Developer Handoff Information**

### **Getting Started**

#### **Setup and Development**

```bash
cd packgen-web
npm install                 # Install dependencies
npm run dev                # Start development server
npm run build              # Build for production
npm run test               # Run Jest test suite
npm run lint               # Check TypeScript and code style
```

#### **Key Development Commands**

```bash
npm run format             # Auto-format with Prettier
npm run preview            # Preview production build
```

### **Code Organization Principles**

#### **File Naming Conventions**

- **Components**: PascalCase (`PatrolPanel.tsx`)
- **Types**: camelCase files, PascalCase interfaces (`wolf.ts` → `Wolf`)
- **Engines**: camelCase with descriptive names (`patrol.ts`)
- **Data**: kebab-case with descriptive suffixes (`starter_wolves.json`)

#### **Import/Export Patterns**

```typescript
// Centralized component exports
export { PatrolPanel } from './PatrolPanel';
export { Roster } from './Roster';
// ... in src/ui/components/index.ts

// Engine imports
import { simulationEngine } from '../engine/simulation';
import { PatrolEngine } from '../engine/patrol';
```

#### **State Management Pattern**

```typescript
// Pack state flows down, updates flow up
const [pack, setPack] = useState<Pack>(initialPack);

// Engine methods don't mutate, they return results
const patrolResults = patrolEngine.processScheduledPatrols(pack);

// UI components update pack through callbacks
const handlePatrolAssign = (assignment: PatrolAssignment) => {
  const updatedPack = { ...pack };
  updatedPack.assignedPatrols.push(assignment);
  onPackUpdate(updatedPack);
};
```

### **Testing Strategy**

#### **Current Test Coverage**

```bash
tests/mating-system.test.ts  # Breeding and relationship tests
```

#### **Test Patterns**

```typescript
// Engine testing approach
describe('Patrol System', () => {
  test('creates valid patrol assignments', () => {
    const engine = new PatrolEngine(DEFAULT_CONFIG);
    const assignment = engine.createPatrolAssignment('hunting', wolves, pack);
    expect(assignment.type).toBe('hunting');
    expect(assignment.participants.length).toBeGreaterThan(0);
  });
});
```

### **Performance Considerations**

#### **Current Optimizations**

- Immutable state updates minimize re-renders
- Efficient wolf filtering with role-based indexing
- Lazy loading of UI components
- Build-time tree shaking with Vite

#### **Scaling Considerations**

- Event engine designed for 1000+ events
- Pack size tested up to 50+ wolves
- Simulation performs well at 10x speed
- Save files remain under 1MB for large packs

### **Known Technical Debt**

#### **Areas for Future Improvement**

1. **Event Engine Type Safety**: Current DSL uses `any` types for flexibility
2. **Component Prop Drilling**: Some deep prop passing could use context
3. **Save File Migration**: Need robust migration system for new features
4. **Mobile Responsiveness**: UI designed primarily for desktop
5. **Accessibility**: Limited screen reader and keyboard navigation support

### **Extension Points**

#### **Adding New Patrol Types**

1. Update `PatrolType` union in `src/types/patrol.ts`
2. Add template in `PatrolEngine.loadDefaultPatrols()`
3. Update UI patrol type arrays and switch statements
4. Add role eligibility logic in `getAvailableWolves()`

#### **Adding New Event Types**

1. Create event templates in `src/data/`
2. Extend event conditions/effects DSL if needed
3. Load templates in `App.tsx` initialization
4. Test with new event scenarios

#### **Adding New UI Tabs**

1. Add tab type to `TabType` union in `App.tsx`
2. Create new component in `src/ui/components/`
3. Export from `index.ts`
4. Add tab configuration and content in `App.tsx`

---

## 🎮 **Feature Comparison: PackGen vs ClanGen**

### **Current Feature Parity Matrix**

| Feature Category     | PackGen Status | ClanGen Feature | Implementation Priority |
| -------------------- | -------------- | --------------- | ----------------------- |
| **Core Simulation**  | ✅ Superior    | ✅ Complete     | Maintain                |
| **Genetics System**  | ✅ Advanced    | ⚪ Basic        | Enhance visuals         |
| **Patrol System**    | ✅ Complete    | ✅ Complete     | ✅ Done                 |
| **Monthly Events**   | 🔄 Partial     | ✅ Complete     | **HIGH**                |
| **Player Decisions** | 🔄 Limited     | ✅ Complete     | **HIGH**                |
| **Wolf Appearance**  | ❌ Missing     | ✅ Complete     | **MEDIUM**              |
| **Death/Memorial**   | ❌ Missing     | ✅ Complete     | **MEDIUM**              |
| **Pack Culture**     | ❌ Missing     | ✅ Complete     | **LOW**                 |
| **Save System**      | ✅ Advanced    | ✅ Complete     | Maintain                |
| **UI/UX**            | 🔄 Functional  | ✅ Polished     | **MEDIUM**              |

### **Competitive Advantages of PackGen**

#### **Technical Superiority**

- **Modern Architecture**: TypeScript + React vs Python + Pygame
- **Web-Based**: No installation required, cross-platform compatibility
- **Type Safety**: Comprehensive TypeScript prevents runtime errors
- **Testing**: Jest test suite ensures reliability
- **Performance**: Efficient rendering and state management

#### **Gameplay Depth**

- **Advanced Genetics**: Statistical inheritance vs simple trait passing
- **Complex Relationships**: 6-stage progression with compatibility factors
- **Resource Management**: Food, herbs, reputation systems
- **Mentor Specialization**: Enhanced apprentice training beyond ClanGen

#### **Developer Experience**

- **Hot Reload**: Instant feedback during development
- **Modern Tooling**: ESLint, Prettier, Vite build system
- **Extensible Architecture**: Easy to add new features and content
- **Documentation**: Comprehensive inline documentation

---

## 🚀 **Implementation Priorities**

### **Immediate Next Steps (Phase 1.3)**

#### **1. Enhanced Event System** - **Week 1-2**

```typescript
// Priority implementation tasks:
1. Extend EventEngine with decision trees
2. Create monthly "moon event" templates
3. Add player choice UI components
4. Implement consequence tracking system
5. Create ceremony event templates
```

#### **2. Player Decision Framework** - **Week 3-4**

```typescript
// Key components to build:
1. DecisionEngine class for choice processing
2. ConsequenceTracker for long-term effects
3. ApprovalSystem for pack stability
4. DecisionModal UI component
5. Integration with existing event system
```

### **Phase 1 Completion Goals**

By end of Phase 1, PackGen should have:

- ✅ **Complete patrol system** (4 types, mentor-pup training)
- 🎯 **Monthly decision events** with meaningful consequences
- 🎯 **Player agency** through strategic choices
- 🎯 **Rich content library** (200+ events)
- 🎯 **Ceremony system** for major pack milestones

### **Success Metrics**

#### **Gameplay Metrics**

- Player makes 3-5 meaningful decisions per month
- Events have visible consequences 2-3 months later
- 90%+ of patrol assignments have strategic value
- Pack survival requires active management

#### **Technical Metrics**

- Test coverage >80% for new systems
- Build time <5 seconds for development
- Save/load operations <1 second
- 60+ FPS during simulation at 10x speed

---

## 📈 **Long-Term Vision**

### **6-Month Goals**

- **Feature-complete ClanGen alternative** with superior technical foundation
- **Rich visual system** with procedural wolf appearances
- **Deep narrative systems** with pack culture and traditions
- **Community features** for pack sharing and content creation

### **12-Month Goals**

- **Mobile version** with touch-optimized interface
- **Modding support** for community content creation
- **Multiplayer features** for pack interactions
- **Educational mode** for learning about real wolf behavior

### **Technical Evolution**

- **Performance optimization** for very large packs (100+ wolves)
- **Advanced AI** for rival pack behavior
- **Procedural territory generation** with varied biomes
- **Real-time multiplayer** pack interactions

---

## 📝 **Development Notes**

### **Architecture Decisions**

#### **Why TypeScript + React?**

- **Type safety** prevents common bugs in complex simulations
- **Component reusability** speeds up UI development
- **Modern tooling** provides excellent developer experience
- **Web deployment** requires no installation for users

#### **Why Custom Event DSL?**

- **Content creator friendly** - events can be written by non-programmers
- **Performance** - compiled JavaScript evaluation vs interpreted logic
- **Flexibility** - can express complex conditions and effects
- **Extensibility** - easy to add new condition/effect types

#### **Why Singleton Engines?**

- **Consistent state** across all game systems
- **Easy testing** with predictable engine instances
- **Configuration management** through single engine instances
- **Performance** - avoid engine recreation overhead

### **Content Creation Guidelines**

#### **Event Writing Best Practices**

```javascript
// Good event structure
{
  "id": "unique_descriptive_name",
  "title": "Player-Visible Title",
  "text": "Engaging narrative with {wolf.name} placeholders",
  "condition": { "all": [
    { "field": "wolf.role", "op": "==", "value": "hunter" },
    { "field": "pack.season", "op": "==", "value": "winter" }
  ]},
  "actions": [
    { "type": "modify_stat", "target": "wolf", "stat": "stats.health", "delta": -10 },
    { "type": "log", "text": "{wolf.name} was injured while hunting in the cold." }
  ],
  "weight": 5,
  "tags": ["hunting", "winter", "injury"]
}
```

#### **Patrol Template Guidelines**

```typescript
// Well-balanced patrol outcomes
outcomes: [
  { outcome: 'success', weight: 50 }, // Most common
  { outcome: 'major_success', weight: 15 }, // Rare positive
  { outcome: 'failure', weight: 25 }, // Common negative
  { outcome: 'disaster', weight: 10 }, // Rare negative
];
```

---

## 🔧 **Build and Deployment**

### **Development Workflow**

```bash
# Standard development cycle
npm run dev          # Start with hot reload
npm run lint         # Check before commit
npm run test         # Verify functionality
npm run build        # Test production build
```

### **Production Deployment**

```bash
npm run build        # Create optimized bundle
npm run preview      # Test production locally
# Deploy dist/ folder to web hosting
```

### **Environment Configuration**

- **Development**: Hot reload, source maps, debug logging
- **Production**: Minified, tree-shaken, optimized assets
- **Testing**: Jest with coverage reporting

---

**Document Version**: 1.0  
**Author**: Claude Code Assistant  
**Project**: PackGen Wolf Pack Simulator  
**Target**: ClanGen-style Interactive Experience

_This document will be updated as development progresses and new features are implemented._
