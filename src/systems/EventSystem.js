/**
 * EventSystem - Centralised event handling with pub/sub pattern
 * 
 * This system allows components to communicate without direct coupling.
 * Components can emit events and subscribe to events from other components.
 */
export class EventSystem {
    constructor() {
        this.events = new Map();
        this.eventHistory = [];
        this.maxHistorySize = 100;
    }
    
    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    on(event, callback) {
        if (!this.events.has(event)) {
            this.events.set(event, new Set());
        }
        
        this.events.get(event).add(callback);
        
        // Return unsubscribe function
        return () => this.off(event, callback);
    }
    
    /**
     * Unsubscribe from an event
     * @param {string} event - Event name
     * @param {Function} callback - Callback function to remove
     */
    off(event, callback) {
        if (!this.events.has(event)) return;
        
        this.events.get(event).delete(callback);
        
        // Clean up empty event sets
        if (this.events.get(event).size === 0) {
            this.events.delete(event);
        }
    }
    
    /**
     * Emit an event
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    emit(event, data = null) {
        // Record event in history for debugging
        this.recordEvent(event, data);
        
        if (!this.events.has(event)) return;
        
        // Create a copy to prevent issues if listeners modify the set
        const listeners = Array.from(this.events.get(event));
        
        listeners.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in event listener for '${event}':`, error);
            }
        });
    }
    
    /**
     * Subscribe to an event for one emission only
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    once(event, callback) {
        const wrapper = (data) => {
            callback(data);
            this.off(event, wrapper);
        };
        
        this.on(event, wrapper);
    }
    
    /**
     * Wait for an event (returns a promise)
     * @param {string} event - Event name
     * @returns {Promise} Promise that resolves with event data
     */
    waitFor(event) {
        return new Promise((resolve) => {
            this.once(event, resolve);
        });
    }
    
    /**
     * Clear all listeners for an event
     * @param {string} event - Event name
     */
    clear(event) {
        this.events.delete(event);
    }
    
    /**
     * Clear all event listeners
     */
    clearAll() {
        this.events.clear();
    }
    
    /**
     * Get listener count for an event
     * @param {string} event - Event name
     * @returns {number} Number of listeners
     */
    listenerCount(event) {
        return this.events.has(event) ? this.events.get(event).size : 0;
    }
    
    /**
     * Record event in history for debugging
     * @private
     */
    recordEvent(event, data) {
        this.eventHistory.push({
            event,
            data,
            timestamp: Date.now()
        });
        
        // Limit history size
        if (this.eventHistory.length > this.maxHistorySize) {
            this.eventHistory.shift();
        }
    }
    
    /**
     * Get event history for debugging
     * @returns {Array} Event history
     */
    getHistory() {
        return [...this.eventHistory];
    }
    
    /**
     * Clear event history
     */
    clearHistory() {
        this.eventHistory = [];
    }
}

// Event constants
export const GAME_EVENTS = {
    // Game state events
    STATE_CHANGE: 'state:change',
    GAME_START: 'game:start',
    GAME_OVER: 'game:over',
    GAME_PAUSE: 'game:pause',
    GAME_RESUME: 'game:resume',
    
    // Gameplay events
    BALL_DROP: 'ball:drop',
    BALL_MERGE: 'ball:merge',
    BALL_CREATE: 'ball:create',
    
    // Scoring events
    SCORE_UPDATE: 'score:update',
    HIGHSCORE_UPDATE: 'highscore:update',
    
    // Settings events
    SETTINGS_CHANGE: 'settings:change',
    THEME_CHANGE: 'theme:change',
    PHYSICS_CHANGE: 'physics:change',
    AUDIO_TOGGLE: 'audio:toggle',
    
    // UI events
    MENU_OPEN: 'menu:open',
    MENU_CLOSE: 'menu:close',
    BUTTON_CLICK: 'button:click',
    
    // Resource events
    RESOURCE_LOAD_START: 'resource:load:start',
    RESOURCE_LOAD_COMPLETE: 'resource:load:complete',
    RESOURCE_LOAD_ERROR: 'resource:load:error',
    
    // Input events
    POINTER_DOWN: 'pointer:down',
    POINTER_MOVE: 'pointer:move',
    POINTER_UP: 'pointer:up'
};

// Create a singleton instance
export const eventSystem = new EventSystem();