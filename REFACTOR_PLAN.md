# Suika Game Refactor Plan

## Executive Summary

This document outlines a comprehensive refactoring plan for the Suika Game codebase. The refactoring aims to improve code maintainability, modularity, performance, and follows SOLID principles whilst ensuring the game remains fully functional after each step.

## Current Architecture Analysis

### File Structure
```
src/
├── entities/       # UI components (Menu, SettingsMenu)
├── game/          # Core game logic (Game, Physics)
├── systems/       # Cross-cutting systems (ScalingSystem, Settings)
├── utils/         # Utilities and configuration (Config, Database)
└── main.js        # Entry point
```

### Key Issues Identified

1. **Large Monolithic Classes**
   - `Game.js` (1000+ lines) handles too many responsibilities
   - Mixed concerns: game state, UI, physics, audio, scoring

2. **Tight Coupling**
   - Direct DOM manipulation scattered across classes
   - Physics engine (Matter.js) tightly coupled to game logic
   - Settings changes require manual propagation

3. **State Management**
   - Game state managed through simple integers
   - No clear state transition logic
   - Settings and game data mixed together

4. **Event Handling**
   - Mouse/touch events handled in multiple places
   - No centralised event system
   - Direct coupling between UI and game logic

5. **Resource Management**
   - Audio and image loading scattered
   - No proper resource preloading system
   - Theme changes require manual asset updates

6. **Code Duplication**
   - Similar rendering patterns in Menu and SettingsMenu
   - Repeated physics configuration code
   - Duplicated theme handling logic

## Refactoring Strategy

### Core Principles
1. **Single Responsibility Principle** - Each class should have one reason to change
2. **Dependency Inversion** - Depend on abstractions, not concretions
3. **Open/Closed Principle** - Open for extension, closed for modification
4. **Interface Segregation** - Many specific interfaces over one general interface
5. **DRY (Don't Repeat Yourself)** - Eliminate code duplication

### Implementation Approach
- **Incremental Refactoring** - Small, testable changes
- **Maintain Functionality** - Game remains playable after each step
- **Progressive Enhancement** - Build upon existing working code
- **Documentation** - Document as we refactor

## Detailed Refactoring Steps

### Phase 1: Foundation Layer (Priority: High)

#### Step 1.1: Create Event System
- **File**: `src/systems/EventSystem.js`
- **Purpose**: Centralised event handling with pub/sub pattern
- **Benefits**: Decouples components, easier testing
```javascript
export class EventSystem {
    constructor() {
        this.events = new Map();
    }
    
    on(event, callback) { /* ... */ }
    off(event, callback) { /* ... */ }
    emit(event, data) { /* ... */ }
    once(event, callback) { /* ... */ }
}
```

#### Step 1.2: Create Resource Manager
- **File**: `src/systems/ResourceManager.js`
- **Purpose**: Handle all asset loading and caching
- **Benefits**: Centralised resource management, preloading support
```javascript
export class ResourceManager {
    async loadImages(manifest) { /* ... */ }
    async loadSounds(manifest) { /* ... */ }
    getImage(key) { /* ... */ }
    getSound(key) { /* ... */ }
}
```

#### Step 1.3: Abstract Renderer Interface
- **File**: `src/rendering/Renderer.js`
- **Purpose**: Abstract rendering operations
- **Benefits**: Decouples rendering from game logic
```javascript
export class Renderer {
    constructor(canvas, scalingSystem) { /* ... */ }
    clear() { /* ... */ }
    drawImage(image, x, y, width, height) { /* ... */ }
    drawText(text, x, y, style) { /* ... */ }
}
```

### Phase 2: Game State Management (Priority: High)

#### Step 2.1: Create State Machine
- **File**: `src/game/StateMachine.js`
- **Purpose**: Proper state management with transitions
- **Benefits**: Clear state logic, easier debugging
```javascript
export class StateMachine {
    constructor(states, initialState) { /* ... */ }
    transition(to) { /* ... */ }
    canTransition(to) { /* ... */ }
    getCurrentState() { /* ... */ }
}
```

#### Step 2.2: Extract Game States
- **Files**: `src/game/states/*.js`
- **Purpose**: Separate state classes for each game state
- **States**: MenuState, PlayingState, GameOverState, SettingsState
```javascript
export class GameState {
    enter() { /* ... */ }
    exit() { /* ... */ }
    update(dt) { /* ... */ }
    render(renderer) { /* ... */ }
}
```

#### Step 2.3: Create Game Data Store
- **File**: `src/game/GameDataStore.js`
- **Purpose**: Centralised game data management
- **Benefits**: Single source of truth, reactive updates
```javascript
export class GameDataStore {
    constructor() {
        this.data = { score: 0, highscore: 0, /* ... */ };
    }
    
    get(key) { /* ... */ }
    set(key, value) { /* ... */ }
    subscribe(key, callback) { /* ... */ }
}
```

### Phase 3: Component Extraction (Priority: Medium)

#### Step 3.1: Extract Audio System
- **File**: `src/systems/AudioSystem.js`
- **Purpose**: Centralised audio management
- **Benefits**: Better iOS handling, volume control
```javascript
export class AudioSystem {
    constructor(settings, resourceManager) { /* ... */ }
    play(soundKey, options) { /* ... */ }
    setMasterVolume(volume) { /* ... */ }
    toggleMute() { /* ... */ }
}
```

#### Step 3.2: Extract Scoring System
- **File**: `src/game/ScoringSystem.js`
- **Purpose**: Handle all scoring logic
- **Benefits**: Testable scoring, achievement support
```javascript
export class ScoringSystem {
    calculateMergeScore(ballIndex) { /* ... */ }
    updateHighscore(score) { /* ... */ }
    getMultiplier() { /* ... */ }
}
```

#### Step 3.3: Extract Ball Factory
- **File**: `src/entities/BallFactory.js`
- **Purpose**: Create and manage ball entities
- **Benefits**: Centralised ball creation, theme support
```javascript
export class BallFactory {
    constructor(physics, scalingSystem, themeManager) { /* ... */ }
    createBall(type, x, y) { /* ... */ }
    createMergeEffect(x, y, radius) { /* ... */ }
}
```

### Phase 4: UI Layer Refactoring (Priority: Medium)

#### Step 4.1: Create UI Component Base
- **File**: `src/ui/UIComponent.js`
- **Purpose**: Base class for all UI components
- **Benefits**: Consistent UI behaviour, reusable patterns
```javascript
export class UIComponent {
    constructor(bounds) { /* ... */ }
    render(renderer) { /* ... */ }
    handleClick(x, y) { /* ... */ }
    isPointInside(x, y) { /* ... */ }
}
```

#### Step 4.2: Extract UI Components
- **Files**: `src/ui/components/*.js`
- **Components**: Button, Label, ScoreDisplay, Modal
- **Benefits**: Reusable UI elements, consistent styling

#### Step 4.3: Create Theme Manager
- **File**: `src/systems/ThemeManager.js`
- **Purpose**: Handle all theme-related logic
- **Benefits**: Dynamic theme switching, custom themes
```javascript
export class ThemeManager {
    constructor(settings, resourceManager) { /* ... */ }
    getCurrentTheme() { /* ... */ }
    applyTheme(themeKey) { /* ... */ }
    registerTheme(key, theme) { /* ... */ }
}
```

### Phase 5: Physics Abstraction (Priority: Low)

#### Step 5.1: Create Physics Interface
- **File**: `src/physics/PhysicsInterface.js`
- **Purpose**: Abstract physics engine operations
- **Benefits**: Engine-agnostic code, easier testing
```javascript
export class PhysicsInterface {
    createBody(options) { /* ... */ }
    addBody(body) { /* ... */ }
    removeBody(body) { /* ... */ }
    setGravity(scale) { /* ... */ }
}
```

#### Step 5.2: Extract Collision Handler
- **File**: `src/physics/CollisionHandler.js`
- **Purpose**: Handle all collision logic
- **Benefits**: Centralised collision rules, easier debugging
```javascript
export class CollisionHandler {
    constructor(eventSystem) { /* ... */ }
    handleCollision(bodyA, bodyB) { /* ... */ }
    registerCollisionRule(rule) { /* ... */ }
}
```

### Phase 6: Input System (Priority: Low)

#### Step 6.1: Create Input Manager
- **File**: `src/input/InputManager.js`
- **Purpose**: Unified input handling
- **Benefits**: Support for multiple input types
```javascript
export class InputManager {
    constructor(canvas, eventSystem) { /* ... */ }
    onPointerDown(callback) { /* ... */ }
    onPointerMove(callback) { /* ... */ }
    onPointerUp(callback) { /* ... */ }
}
```

### Phase 7: Performance Optimisations (Priority: Low)

#### Step 7.1: Implement Object Pooling
- **File**: `src/utils/ObjectPool.js`
- **Purpose**: Reuse objects to reduce GC pressure
- **Benefits**: Better performance on mobile

#### Step 7.2: Add Request Animation Frame Manager
- **File**: `src/utils/AnimationFrameManager.js`
- **Purpose**: Centralise RAF handling
- **Benefits**: Better frame timing, pause support

## Implementation Timeline

### Week 1: Foundation
- [ ] Event System
- [ ] Resource Manager
- [ ] Basic Renderer abstraction

### Week 2: State Management
- [ ] State Machine
- [ ] Extract game states
- [ ] Game Data Store

### Week 3: Core Systems
- [ ] Audio System
- [ ] Scoring System
- [ ] Ball Factory

### Week 4: UI Refactoring
- [ ] UI Component base
- [ ] Extract UI components
- [ ] Theme Manager

### Week 5: Advanced Systems
- [ ] Physics abstraction
- [ ] Collision handling
- [ ] Input management

### Week 6: Polish & Optimisation
- [ ] Object pooling
- [ ] Performance profiling
- [ ] Documentation updates

## Testing Strategy

### Unit Tests
- Test each new system in isolation
- Mock dependencies
- Focus on business logic

### Integration Tests
- Test system interactions
- Verify state transitions
- Test resource loading

### Manual Testing
- Play test after each refactoring step
- Verify all game features work
- Test on multiple devices

## Migration Strategy

1. **Parallel Development**: New systems alongside old code
2. **Gradual Migration**: Move functionality piece by piece
3. **Feature Flags**: Toggle between old and new implementations
4. **Rollback Plan**: Keep old code until new code is stable

## Success Metrics

- **Code Quality**
  - Reduced coupling (measure with dependency analysis)
  - Smaller class sizes (< 200 lines per class)
  - Higher cohesion (single responsibility)

- **Performance**
  - Consistent 60 FPS on target devices
  - Reduced memory usage
  - Faster load times

- **Maintainability**
  - Clear separation of concerns
  - Easy to add new features
  - Comprehensive documentation

## Risk Mitigation

1. **Breaking Changes**: Test thoroughly after each step
2. **Performance Regression**: Profile before and after
3. **Scope Creep**: Stick to the plan, defer nice-to-haves
4. **Browser Compatibility**: Test on all target browsers

## Conclusion

This refactoring plan provides a roadmap to transform the Suika Game codebase into a more maintainable, modular, and performant application. By following this incremental approach, we ensure the game remains functional throughout the process whilst systematically improving its architecture.