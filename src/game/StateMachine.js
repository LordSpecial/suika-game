/**
 * StateMachine - Manages game state transitions
 * 
 * Provides a clean abstraction for managing game states with
 * proper transitions, validation, and event emission.
 */
export class StateMachine {
    constructor(eventSystem, states, initialState) {
        this.eventSystem = eventSystem;
        this.states = new Map();
        this.currentState = null;
        this.previousState = null;
        this.isTransitioning = false;
        
        // Register states
        states.forEach(state => {
            this.registerState(state);
        });
        
        // Set initial state
        if (initialState && this.states.has(initialState)) {
            this.transition(initialState);
        }
    }
    
    /**
     * Register a state
     * @param {Object} state - State object with name and optional handlers
     */
    registerState(state) {
        if (!state.name) {
            throw new Error('State must have a name property');
        }
        
        // Store the actual state instance to preserve context
        this.states.set(state.name, state);
    }
    
    /**
     * Transition to a new state
     * @param {string} stateName - Name of the state to transition to
     * @param {Object} data - Optional data to pass to the new state
     * @returns {boolean} True if transition was successful
     */
    transition(stateName, data = null) {
        if (this.isTransitioning) {
            console.warn('Cannot transition while another transition is in progress');
            return false;
        }
        
        if (!this.states.has(stateName)) {
            console.error(`State '${stateName}' not found`);
            return false;
        }
        
        const newState = this.states.get(stateName);
        
        // Check if we can transition from current state
        if (this.currentState) {
            if (!this.canTransition(stateName)) {
                console.warn(`Cannot transition from '${this.currentState.name}' to '${stateName}'`);
                return false;
            }
            
            // Check if new state allows transition from current state
            if (!newState.canTransitionTo(this.currentState.name)) {
                console.warn(`State '${stateName}' does not allow transition from '${this.currentState.name}'`);
                return false;
            }
        }
        
        this.isTransitioning = true;
        
        try {
            // Exit current state
            if (this.currentState) {
                this.currentState.exit();
                this.currentState.onTransitionFrom(stateName);
                this.previousState = this.currentState;
            }
            
            // Enter new state
            this.currentState = newState;
            this.currentState.enter(data);
            
            // Emit state change event
            this.eventSystem.emit('state:change', {
                from: this.previousState ? this.previousState.name : null,
                to: this.currentState.name,
                data: data
            });
            
            this.isTransitioning = false;
            return true;
            
        } catch (error) {
            console.error('Error during state transition:', error);
            this.isTransitioning = false;
            
            // Try to recover by going back to previous state
            if (this.previousState) {
                this.currentState = this.previousState;
                this.previousState = null;
            }
            
            return false;
        }
    }
    
    /**
     * Check if transition to a state is allowed
     * @param {string} stateName - Name of the state to check
     * @returns {boolean} True if transition is allowed
     */
    canTransition(stateName) {
        if (!this.currentState) return true;
        
        // Check transition rules if defined
        if (this.currentState.transitions) {
            return this.currentState.transitions.includes(stateName);
        }
        
        return true; // Allow all transitions by default
    }
    
    /**
     * Update current state
     * @param {number} deltaTime - Time since last update in milliseconds
     * @returns {Object|null} State transition result
     */
    update(deltaTime) {
        if (this.currentState && !this.isTransitioning) {
            return this.currentState.update(deltaTime);
        }
        return null;
    }
    
    /**
     * Render current state
     * @param {Renderer} renderer - Renderer instance
     */
    render(renderer) {
        if (this.currentState && !this.isTransitioning) {
            this.currentState.render(renderer);
        }
    }
    
    /**
     * Handle input for current state
     * @param {Object} input - Input data
     * @returns {Object|null} State transition result
     */
    handleInput(input) {
        if (this.currentState && !this.isTransitioning) {
            return this.currentState.handleInput(input);
        }
        return null;
    }
    
    /**
     * Get current state name
     * @returns {string|null} Current state name
     */
    getCurrentStateName() {
        return this.currentState ? this.currentState.name : null;
    }
    
    /**
     * Get current state object
     * @returns {Object|null} Current state object
     */
    getCurrentState() {
        return this.currentState;
    }
    
    /**
     * Get previous state name
     * @returns {string|null} Previous state name
     */
    getPreviousStateName() {
        return this.previousState ? this.previousState.name : null;
    }
    
    /**
     * Check if currently in a specific state
     * @param {string} stateName - State name to check
     * @returns {boolean} True if in the specified state
     */
    isInState(stateName) {
        return this.currentState && this.currentState.name === stateName;
    }
    
    /**
     * Get all registered state names
     * @returns {Array<string>} Array of state names
     */
    getStateNames() {
        return Array.from(this.states.keys());
    }
    
    /**
     * Set state data
     * @param {string} stateName - State name
     * @param {string} key - Data key
     * @param {*} value - Data value
     */
    setStateData(stateName, key, value) {
        const state = this.states.get(stateName);
        if (state) {
            state.data[key] = value;
        }
    }
    
    /**
     * Get state data
     * @param {string} stateName - State name
     * @param {string} key - Data key
     * @returns {*} Data value
     */
    getStateData(stateName, key) {
        const state = this.states.get(stateName);
        return state ? state.data[key] : undefined;
    }
    
    /**
     * Reset state machine
     */
    reset() {
        if (this.currentState) {
            this.currentState.exit();
        }
        
        this.currentState = null;
        this.previousState = null;
        this.isTransitioning = false;
    }
}