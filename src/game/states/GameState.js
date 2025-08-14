/**
 * GameState - Base class for all game states
 * 
 * Provides common functionality and interface for game states.
 * All game states should extend this class.
 */
export class GameState {
    constructor(name, game) {
        this.name = name;
        this.game = game;
        this.isActive = false;
    }
    
    /**
     * Called when entering this state
     * @param {Object} data - Optional data passed from previous state
     */
    enter(data = null) {
        this.isActive = true;
    }
    
    /**
     * Called when exiting this state
     */
    exit() {
        this.isActive = false;
    }
    
    /**
     * Update state logic
     * @param {number} deltaTime - Time since last update in milliseconds
     */
    update(deltaTime) {
        // Override in subclasses
    }
    
    /**
     * Render state
     * @param {Renderer} renderer - Renderer instance
     */
    render(renderer) {
        // Override in subclasses
    }
    
    /**
     * Handle input
     * @param {Object} input - Input data
     */
    handleInput(input) {
        // Override in subclasses
    }
    
    /**
     * Check if can transition to another state
     * @param {string} fromState - State transitioning from
     * @returns {boolean} True if transition is allowed
     */
    canTransitionTo(fromState) {
        return true; // Allow all transitions by default
    }
    
    /**
     * Called when transitioning from this state
     * @param {string} toState - State transitioning to
     */
    onTransitionFrom(toState) {
        // Override in subclasses if needed
    }
    
    /**
     * Helper to emit events
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    emit(event, data) {
        this.game.eventSystem.emit(event, data);
    }
    
    /**
     * Helper to get game dimensions
     * @returns {Object} Game dimensions {width, height}
     */
    getDimensions() {
        return {
            width: this.game.gameWidth,
            height: this.game.gameHeight
        };
    }
    
    /**
     * Helper to get scaling system
     * @returns {ScalingSystem} Scaling system instance
     */
    getScalingSystem() {
        return this.game.scalingSystem;
    }
    
    /**
     * Helper to get settings
     * @returns {Settings} Settings instance
     */
    getSettings() {
        return this.game.settings;
    }
}