# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Essential Commands:**

```bash
npm install                  # Install dependencies
npm run dev                  # Start development server (http://localhost:5173)
npm run build                # Build for production (outputs to dist/)
npm run preview              # Preview production build locally
npm test                     # Run Jest test suite
npm run lint                 # Run ESLint and Prettier checks
npm run format               # Auto-format code with Prettier
```

**TypeScript:**

- TypeScript checking is integrated into the build process
- Use strict mode TypeScript configuration
- Run `npm run build` to verify TypeScript compilation

## Architecture Overview

**Technology Stack:**

- React 18 with hooks and functional components
- TypeScript with strict mode enabled
- Vite for fast development and building
- Jest for testing
- ESLint + Prettier for code quality

**Core System Architecture:**

1. **Engine Layer** (`src/engine/`): Core simulation logic
   - `simulation.ts`: Main simulation engine with day/season cycles, aging, breeding, training
   - `eventEngine.ts`: Event processing system with custom DSL for game events
   - `combat.ts`: Battle resolution mechanics
   - `healer.ts`: Healing and prophecy systems
   - `training.ts`: Experience and skill development

2. **Type System** (`src/types/`): TypeScript definitions
   - `wolf.ts`: Wolf stats, traits, roles, and properties
   - `pack.ts`: Pack state, game configuration, and seasons
   - `event.ts`: Event templates, conditions, and DSL types
   - `territory.ts`: Territory and rival pack management
   - `utils.ts`: Utility functions and helpers

3. **UI Layer** (`src/ui/components/`): React components
   - Component-based architecture with reusable UI elements
   - Dark theme with CSS-in-JS styling
   - Tab-based navigation for different game views

4. **Data Layer** (`src/data/`): Game configuration and content
   - JSON files for events, starter wolves, and configuration
   - Event system uses custom DSL for conditions and effects

**Key Patterns:**

- **State Management**: Uses React useState for pack state management
- **Simulation Engine**: Singleton pattern for game simulation
- **Event System**: Template-driven events with JavaScript-based DSL for conditions/effects
- **Genetics System**: Statistical inheritance with mutation factors
- **Save System**: JSON-based with auto-save and manual save slots

## Event System DSL

Events use a custom Domain Specific Language for conditions and effects:

**Condition Examples:**

```javascript
'wolf.stats.health > 50';
"pack.season === 'winter'";
"pack.wolves.filter(w => w.role === 'hunter').length >= 2";
```

**Effect Examples:**

```javascript
'wolf.stats.health += 10';
'pack.logs.push(`${wolf.name} gained confidence!`)';
'wolf.traits.bravery = Math.min(10, wolf.traits.bravery + 1)';
```

## Game Configuration

Core game parameters are in `src/engine/simulation.ts` in the `DEFAULT_CONFIG` object:

- Season length, event frequency, breeding mechanics
- Training duration, XP requirements, healing parameters
- Lifespan ranges and seasonal modifiers

## File Organization

**When adding new features:**

- Engine logic goes in `src/engine/`
- Type definitions in `src/types/`
- UI components in `src/ui/components/`
- Game data in `src/data/`

**Component Structure:**

- Use functional components with hooks
- Follow existing naming conventions (PascalCase for components)
- Keep components focused and reusable
- Export from `src/ui/components/index.ts`

## Testing

- Tests are located in `tests/` directory
- Jest configuration in `jest.config.js`
- Test files use `*.test.ts` naming convention
- Coverage collection from `src/**/*.{ts,tsx}`

## Build & Deployment

- Production build creates optimized bundle in `dist/`
- Vite handles code splitting and tree shaking
- Source maps included for debugging
- No additional deployment configuration needed

## Project Design Insights

Based on extensive work with this codebase, here are the most important architectural and design principles:

### **Technical Architecture Principles**

1. **TypeScript-First Design**: Strict TypeScript with comprehensive type definitions ensures type safety across the entire simulation system.

2. **Modular Engine Architecture**: Clear separation between simulation logic (`src/engine/`), types (`src/types/`), UI (`src/ui/`), and data (`src/data/`) enables maintainable, testable code.

3. **Event-Driven System**: Sophisticated event engine with custom DSL allows complex game events to be defined declaratively in JSON, making content creation accessible.

4. **React Hooks State Management**: Simple but effective useState-based state management avoids unnecessary complexity while maintaining reactivity.

### **Game Design Philosophy**

5. **Simulation Over Game**: Focus on realistic wolf pack dynamics rather than traditional "game" mechanics creates emergent, meaningful experiences.

6. **Emergent Storytelling**: Procedural narrative generation through relationship dynamics, events, and seasonal changes creates unique stories for each pack.

7. **Time-Based Progression**: Daily simulation cycles with seasonal variations drive all major game systems (breeding, training, events, aging).

8. **Statistical Genetics**: Sophisticated inheritance system with trait averaging and mutation factors creates believable genetic diversity.

### **Complex Systems Design**

9. **Multi-Layered Relationship System**: 6-stage relationship progression (strangers → acquainted → friends → attracted → courting → mates) with time and compatibility requirements creates realistic social dynamics.

10. **Breeding Restrictions**: Seasonal limitations, family tree tracking, inbreeding prevention, and annual limits ensure realistic reproduction patterns.

11. **Role-Based Pack Dynamics**: Each wolf role has specific behaviors, responsibilities, and interaction patterns that affect pack survival and social structure.

12. **Age-Based Life Cycles**: Distinct life stages (pup → adult → elder) with different capabilities create natural progression and pack turnover.

### **Data Management Strategy**

13. **Save/Load System**: Comprehensive save system with auto-saves, manual saves, import/export, and backward compatibility ensures user investment is protected.

14. **Schema Validation**: Zod-based runtime type validation maintains data integrity across save/load operations and prevents corruption.

15. **Migration Strategy**: Forward-thinking migration system handles deprecated features (like removed alpha_mate role) without breaking existing saves.

16. **Hierarchical Configuration System**: Centralized configuration management through typed subsystem configs (CombatConfig, HealerConfig, RelationshipConfig, PatrolTemplateConfig) within the main GameConfig interface. This system replaces scattered hardcoded constants with organized, type-safe configuration objects that enable easy game balance adjustments and runtime configuration updates. All engine systems (combat, healer, mating, patrol) now use configurable parameters instead of magic numbers, making the codebase more maintainable and enabling features like difficulty modes and game variants.

17. **JSON-Based Configuration**: Externalized game balance through JSON and TypeScript config objects enables easy tuning without code changes.

### **Development Best Practices**

18. **Comprehensive Testing**: Jest-based testing covers core mechanics (breeding, relationships, family trees) ensuring system reliability as complexity grows.

19. **Build Pipeline Excellence**: Vite-based build with TypeScript compilation, linting, and optimization provides fast development and production builds.

20. **Component-Based UI**: Clean React component architecture with reusable elements and consistent patterns enables rapid UI development.

21. **Incremental Development**: Codebase shows evolutionary development from simple to complex systems while maintaining backward compatibility and code quality.

### **Key Design Insight**

The project masterfully balances **realism with playability** - creating believable wolf pack dynamics that feel authentic while remaining structured enough to provide clear progression and meaningful user interactions. Every system is designed to feel natural rather than "gamey," resulting in a simulation that educates about wolf behavior while being genuinely engaging.

### **Relationship System Architecture**

The gradual relationship system exemplifies this design philosophy:

- **Realistic progression**: Wolves must spend time together and build compatibility before romantic relationships
- **Meaningful interactions**: Daily bonding activities and shared experiences drive relationship growth
- **Natural timing**: Courtship only happens during appropriate seasons and life stages
- **Emergent drama**: Failed courtships, rivalries, and pair formations create organic storytelling moments

This approach creates a living, breathing pack simulation where every wolf has agency and relationships feel earned rather than arbitrary.
