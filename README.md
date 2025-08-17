# 🐺 PackGen - Wolf Pack Simulator

A comprehensive wolf pack management and simulation game built with React, TypeScript, and modern web technologies. Experience realistic wolf pack dynamics, genetics, breeding, territory management, and supernatural elements through an intuitive web interface.

![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)

## ✨ Features

### 🧬 **Advanced Genetics System**

- Realistic breeding mechanics with genetic inheritance
- Compatibility analysis between potential mates
- Genetic diversity tracking and optimization
- Offspring trait prediction with mutation factors

### 🏞️ **Territory Management**

- Biome-based territories with unique characteristics
- Rival pack interactions and territorial disputes
- Resource management (herbs, hunting grounds)
- Exploration and border patrol mechanics

### ⚔️ **Combat & Training**

- Comprehensive wolf combat system
- Experience points and leveling mechanics
- Mentor-apprentice training relationships
- Role-based skill development

### 🔮 **Mystical Elements**

- Healer wolves with special abilities
- Prophecy system with Crystal Pool visions
- Herb gathering and healing mechanics
- Spiritual bonds and pack dynamics

### 📊 **Pack Management**

- Detailed wolf profiles with stats and traits
- Pack hierarchy and role assignments
- Health monitoring and care systems
- Comprehensive event logging

### 💾 **Save System**

- Multiple save slots with auto-save functionality
- Import/export saves as JSON files
- Save game previews and metadata
- Cross-session persistence

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn package manager

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd packgen-web
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start development server**

   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173` to start playing!

### Available Scripts

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm run preview      # Preview production build locally
npm run lint         # Run ESLint for code quality
npm run format       # Format code with Prettier
npm run typecheck    # Run TypeScript type checking
npm test             # Run test suite (when implemented)
```

## 🎮 How to Play

### Getting Started

1. **Overview Tab**: Monitor your pack's status and simulate days
2. **Roster Tab**: View all wolves with filtering and sorting options
3. **Healer Tab**: Manage healers, gather herbs, and receive prophecies
4. **Territory Tab**: Explore your territory and manage rival packs
5. **Genetics Tab**: Analyze breeding compatibility and plan offspring
6. **Saves Tab**: Save your progress and load previous games
7. **Events Tab**: Review the complete history of pack events

### Basic Gameplay Loop

1. **Simulate Days**: Advance time to trigger events and pack evolution
2. **Manage Wolves**: Monitor health, assign roles, and track relationships
3. **Breed Strategically**: Use the genetics system to improve your pack
4. **Handle Events**: Respond to random events affecting your pack
5. **Expand Territory**: Explore and defend your pack's homeland

### Wolf Roles

- **Alpha**: Pack leaders with high strength and intelligence
- **Alpha Mate**: Partner to the alpha with leadership qualities
- **Beta**: Second-in-command, assists with pack management
- **Healer**: Mystical wolves with healing and prophecy abilities
- **Hunter**: Skilled wolves focused on providing food
- **Omega**: Standard pack members with balanced abilities
- **Pup**: Young wolves in training
- **Elder**: Experienced wolves with wisdom bonuses

### Stats & Traits

**Core Stats:**

- **Health**: Wolf's current physical condition (0-100)
- **Strength**: Physical power affecting combat and hunting
- **Speed**: Agility affecting hunting success and combat
- **Intelligence**: Mental acuity affecting training and problem-solving

**Personality Traits:**

- **Bravery**: Willingness to face danger and lead others
- **Sociability**: Ability to form bonds and work with pack
- **Trainability**: Aptitude for learning new skills
- **Fertility**: Reproductive success and litter size potential

## 🏗️ Architecture

### Project Structure

```
src/
├── engine/          # Core simulation systems
│   ├── combat.ts    # Battle resolution and mechanics
│   ├── eventEngine.ts # Event processing and DSL parser
│   ├── healer.ts    # Healing and prophecy systems
│   ├── simulation.ts # Main simulation loop
│   └── training.ts  # Experience and skill systems
├── types/           # TypeScript type definitions
│   ├── event.ts     # Event and DSL types
│   ├── pack.ts      # Pack and game configuration
│   ├── territory.ts # Territory and rival pack types
│   ├── utils.ts     # Utility functions and helpers
│   └── wolf.ts      # Wolf stats, traits, and properties
├── ui/              # React components and interface
│   └── components/  # Reusable UI components
├── utils/           # Utility modules
│   └── saveLoad.ts  # Save/load system implementation
└── data/            # Game data and configuration
    ├── starter_wolves.json    # Initial pack setup
    ├── events_examples.json   # Sample events
    └── events_full.json      # Complete event library
```

### Technology Stack

- **React 18**: Modern UI framework with hooks
- **TypeScript**: Type-safe development with strict mode
- **Vite**: Fast build tool with hot module replacement
- **ESLint + Prettier**: Code quality and formatting
- **CSS-in-JS**: Styled components with professional dark theme

### Key Systems

#### Event Engine

The event system uses a custom DSL (Domain Specific Language) for authoring game events:

```json
{
  "id": "hunt_success",
  "name": "Successful Hunt",
  "text": "The hunting party returns with a large elk!",
  "conditions": [
    "pack.wolves.filter(w => w.role === 'hunter').length >= 2",
    "season === 'summer'"
  ],
  "effects": [
    "targetWolf.stats.health += 10",
    "pack.logs.push(`${targetWolf.name} gained confidence from the hunt!`)"
  ],
  "weight": 0.3
}
```

#### Genetics System

Breeding combines parental traits with realistic inheritance patterns:

- **Base inheritance**: Average of parent stats with ±1 mutation
- **Genetic diversity**: Encourages varied pairings
- **Fertility factors**: Age and trait-based breeding success
- **Bond bonuses**: Relationship strength affects compatibility

#### Save System

Robust save management with multiple features:

- **Auto-save**: Every 10 simulated days
- **Manual saves**: User-named save slots (max 10)
- **Import/Export**: JSON-based save sharing
- **Version control**: Save compatibility tracking

## 🔧 Configuration

### Game Configuration

Modify `src/engine/simulation.ts` to adjust game parameters:

```typescript
export const DEFAULT_CONFIG: GameConfig = {
  daysPerSeason: 40, // Days per season cycle
  eventsPerDay: { min: 2, max: 4 }, // Random events per day
  gestationDays: 14, // Pregnancy duration
  trainingStartAge: 40, // Training eligibility (days)
  trainingDuration: 40, // Training completion time
  maxLifespan: { min: 12, max: 14 }, // Wolf lifespan range
  xpToLevel: 100, // Experience points per level
  healerHerbsPerTend: 1, // Herbs consumed per healing
  healHpRange: { min: 15, max: 25 }, // Healing amount range
  healerBaseSuccessRate: 0.9, // Base healing success rate
  seasonalModifiers: {
    /* ... */
  }, // Season-specific bonuses
};
```

### Adding Custom Events

Create new events in `src/data/events_examples.json`:

```json
{
  "id": "custom_event",
  "name": "Your Custom Event",
  "text": "Something interesting happens...",
  "conditions": ["/* JavaScript conditions */"],
  "effects": ["/* JavaScript effects */"],
  "targetType": "wolf", // or "pack"
  "weight": 0.2,
  "rarity": "common" // "common", "uncommon", "rare", "legendary"
}
```

## 📈 Development

### Code Quality

- **TypeScript Strict Mode**: Full type safety enforcement
- **ESLint Configuration**: Comprehensive linting rules
- **Prettier Integration**: Automatic code formatting
- **Git Hooks**: Pre-commit quality checks

### Testing Strategy

```bash
npm test                    # Run all tests
npm run test:watch         # Watch mode for development
npm run test:coverage      # Generate coverage report
```

### Building for Production

```bash
npm run build              # Create optimized production build
npm run preview            # Test production build locally
```

The production build is optimized with:

- Code splitting for faster loading
- Tree shaking to remove unused code
- Asset optimization and compression
- Source maps for debugging

## 🤝 Contributing

### Getting Started

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes following the established patterns
4. Run linting and tests: `npm run lint && npm test`
5. Commit with clear messages: `git commit -m 'Add amazing feature'`
6. Push to your fork: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Development Guidelines

- Follow TypeScript strict mode requirements
- Use existing component patterns and styling
- Add JSDoc comments for complex functions
- Include tests for new features
- Update documentation for API changes

### Code Style

- Use functional components with hooks
- Prefer immutable data patterns
- Keep components focused and reusable
- Use descriptive variable and function names
- Follow the established file organization

## 📊 Game Balance

### Wolf Stats Range

- **Health**: 0-100 (current condition)
- **Core Stats**: 0-10 (strength, speed, intelligence)
- **Traits**: 0-10 (bravery, sociability, trainability, fertility)

### Breeding Mechanics

- **Optimal Age**: 2-8 years for best fertility
- **Genetic Diversity**: Encouraged through compatibility scoring
- **Mutation Rate**: ±1 stat variance from parent average
- **Litter Size**: 1-4 pups (weighted probability)

### Event Frequency

- **Daily Events**: 2-4 random events per simulated day
- **Seasonal Modifiers**: Spring births, winter hardships
- **Rarity Distribution**: 60% common, 25% uncommon, 12% rare, 3% legendary

## 🐛 Known Issues & Limitations

### Current Limitations

- Events are read-only during gameplay (no dynamic event creation)
- AI for rival packs is simplified
- No multiplayer functionality
- Limited sound/visual effects

### Performance Notes

- Save files can become large with extensive play sessions
- Event history is maintained indefinitely (may impact performance)
- No lazy loading for large wolf populations

### Future Enhancements

- Dynamic event system with user-created events
- Enhanced AI for rival pack behaviors
- Multiplayer pack interactions
- Advanced genetics with recessive traits
- Achievement system and challenges

## 📜 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Inspired by real wolf pack dynamics and behavior
- Built with modern web development best practices
- Designed for both casual players and simulation enthusiasts

---

**Ready to lead your pack to greatness? Start your PackGen adventure today!** 🐺🌙

_For support, feature requests, or contributions, please open an issue or pull request on our GitHub repository._
