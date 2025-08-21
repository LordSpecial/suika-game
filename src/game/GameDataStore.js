/**
 * GameDataStore - Centralised game data management
 * 
 * Single source of truth for game data with reactive updates.
 * Emits events when data changes to keep UI and game logic in sync.
 */
export class GameDataStore {
    constructor(eventSystem) {
        this.eventSystem = eventSystem;
        this.data = this.getInitialData();
        this.subscribers = new Map();
        this.history = [];
        this.maxHistorySize = 10;
    }
    
    /**
     * Get initial data structure
     * @returns {Object} Initial data
     */
    getInitialData() {
        return {
            // Game state
            score: 0,
            highscore: 0,
            ballsMerged: new Array(11).fill(0), // Track merges per ball type
            totalBallsDropped: 0,
            totalMerges: 0,
            
            // Current game
            currentBallSize: 0,
            nextBallSize: 0,
            gameStartTime: null,
            gameEndTime: null,
            
            // Statistics
            stats: {
                gamesPlayed: 0,
                totalScore: 0,
                averageScore: 0,
                bestCombo: 0,
                totalPlayTime: 0
            },
            
            // Temporary data
            currentCombo: 0,
            lastMergeTime: null,
            comboTimeout: 1000 // milliseconds
        };
    }
    
    /**
     * Get data value
     * @param {string} path - Dot notation path (e.g., 'stats.gamesPlayed')
     * @returns {*} Data value
     */
    get(path) {
        const keys = path.split('.');
        let value = this.data;
        
        for (const key of keys) {
            if (value && typeof value === 'object') {
                value = value[key];
            } else {
                return undefined;
            }
        }
        
        return value;
    }
    
    /**
     * Set data value
     * @param {string} path - Dot notation path
     * @param {*} value - Value to set
     * @param {boolean} silent - If true, don't emit events
     */
    set(path, value, silent = false) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        let target = this.data;
        
        // Navigate to the parent object
        for (const key of keys) {
            if (!target[key] || typeof target[key] !== 'object') {
                target[key] = {};
            }
            target = target[key];
        }
        
        // Store old value for history
        const oldValue = target[lastKey];
        
        // Set new value
        target[lastKey] = value;
        
        // Add to history
        this.addToHistory({
            path,
            oldValue,
            newValue: value,
            timestamp: Date.now()
        });
        
        // Notify subscribers and emit events
        if (!silent) {
            this.notifySubscribers(path, value, oldValue);
            
            // Emit specific events for important changes
            this.emitDataChangeEvents(path, value, oldValue);
        }
    }
    
    /**
     * Increment a numeric value
     * @param {string} path - Dot notation path
     * @param {number} amount - Amount to increment by (default: 1)
     */
    increment(path, amount = 1) {
        const current = this.get(path) || 0;
        this.set(path, current + amount);
    }
    
    /**
     * Decrement a numeric value
     * @param {string} path - Dot notation path
     * @param {number} amount - Amount to decrement by (default: 1)
     */
    decrement(path, amount = 1) {
        const current = this.get(path) || 0;
        this.set(path, current - amount);
    }
    
    /**
     * Subscribe to data changes
     * @param {string} path - Path to watch (use '*' for all changes)
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    subscribe(path, callback) {
        if (!this.subscribers.has(path)) {
            this.subscribers.set(path, new Set());
        }
        
        this.subscribers.get(path).add(callback);
        
        // Return unsubscribe function
        return () => {
            const callbacks = this.subscribers.get(path);
            if (callbacks) {
                callbacks.delete(callback);
                if (callbacks.size === 0) {
                    this.subscribers.delete(path);
                }
            }
        };
    }
    
    /**
     * Notify subscribers of data change
     * @private
     */
    notifySubscribers(path, newValue, oldValue) {
        // Notify exact path subscribers
        const exactSubscribers = this.subscribers.get(path);
        if (exactSubscribers) {
            exactSubscribers.forEach(callback => {
                callback(newValue, oldValue, path);
            });
        }
        
        // Notify wildcard subscribers
        const wildcardSubscribers = this.subscribers.get('*');
        if (wildcardSubscribers) {
            wildcardSubscribers.forEach(callback => {
                callback(newValue, oldValue, path);
            });
        }
        
        // Notify parent path subscribers
        const pathParts = path.split('.');
        for (let i = pathParts.length - 1; i > 0; i--) {
            const parentPath = pathParts.slice(0, i).join('.');
            const parentSubscribers = this.subscribers.get(parentPath + '.*');
            if (parentSubscribers) {
                parentSubscribers.forEach(callback => {
                    callback(newValue, oldValue, path);
                });
            }
        }
    }
    
    /**
     * Emit specific events for important data changes
     * @private
     */
    emitDataChangeEvents(path, newValue, oldValue) {
        switch (path) {
            case 'score':
                this.eventSystem.emit('score:update', { score: newValue, previous: oldValue });
                break;
                
            case 'highscore':
                if (newValue > oldValue) {
                    this.eventSystem.emit('highscore:update', { highscore: newValue, previous: oldValue });
                }
                break;
                
            case 'currentCombo':
                if (newValue > oldValue) {
                    this.eventSystem.emit('combo:increase', { combo: newValue });
                } else if (newValue === 0 && oldValue > 0) {
                    this.eventSystem.emit('combo:break', { finalCombo: oldValue });
                }
                break;
        }
    }
    
    /**
     * Reset game data (keep stats and highscore)
     */
    resetGame() {
        const highscore = this.get('highscore');
        const stats = this.get('stats');
        
        // Reset to initial data
        this.data = this.getInitialData();
        
        // Restore persistent data
        this.set('highscore', highscore, true);
        this.set('stats', stats, true);
        
        // Emit reset event
        this.eventSystem.emit('data:reset');
    }
    
    /**
     * Start new game
     */
    startNewGame() {
        this.set('gameStartTime', Date.now());
        this.set('gameEndTime', null);
        this.set('score', 0);
        this.set('ballsMerged', new Array(11).fill(0));
        this.set('totalBallsDropped', 0);
        this.set('totalMerges', 0);
        this.set('currentCombo', 0);
        this.increment('stats.gamesPlayed');
    }
    
    /**
     * End current game
     */
    endGame() {
        const endTime = Date.now();
        const startTime = this.get('gameStartTime');
        const score = this.get('score');
        
        this.set('gameEndTime', endTime);
        
        // Update statistics
        if (startTime) {
            const playTime = (endTime - startTime) / 1000; // Convert to seconds
            this.increment('stats.totalPlayTime', playTime);
        }
        
        this.increment('stats.totalScore', score);
        
        // Update average score
        const gamesPlayed = this.get('stats.gamesPlayed');
        const totalScore = this.get('stats.totalScore');
        this.set('stats.averageScore', Math.round(totalScore / gamesPlayed));
        
        // Update best combo
        const currentCombo = this.get('currentCombo');
        const bestCombo = this.get('stats.bestCombo');
        if (currentCombo > bestCombo) {
            this.set('stats.bestCombo', currentCombo);
        }
        
        // Update highscore
        const highscore = this.get('highscore');
        if (score > highscore) {
            this.set('highscore', score);
        }
    }
    
    /**
     * Record ball merge
     * @param {number} ballIndex - Index of the ball that was created
     */
    recordMerge(ballIndex) {
        // Update merge count for specific ball
        const merges = this.get('ballsMerged');
        merges[ballIndex] = (merges[ballIndex] || 0) + 1;
        this.set('ballsMerged', [...merges]);
        
        // Update total merges
        this.increment('totalMerges');
        
        // Update combo
        const now = Date.now();
        const lastMergeTime = this.get('lastMergeTime');
        const comboTimeout = this.get('comboTimeout');
        
        if (lastMergeTime && (now - lastMergeTime) < comboTimeout) {
            this.increment('currentCombo');
        } else {
            this.set('currentCombo', 1);
        }
        
        this.set('lastMergeTime', now);
    }
    
    /**
     * Add to history
     * @private
     */
    addToHistory(entry) {
        this.history.push(entry);
        
        // Limit history size
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        }
    }
    
    /**
     * Get history
     * @returns {Array} History entries
     */
    getHistory() {
        return [...this.history];
    }
    
    /**
     * Clear history
     */
    clearHistory() {
        this.history = [];
    }
    
    /**
     * Get all data
     * @returns {Object} All data
     */
    getAllData() {
        return JSON.parse(JSON.stringify(this.data));
    }
    
    /**
     * Load data from storage
     * @param {Object} data - Data to load
     */
    loadData(data) {
        if (data && typeof data === 'object') {
            this.data = { ...this.getInitialData(), ...data };
            this.eventSystem.emit('data:loaded');
        }
    }
    
    /**
     * Save data to storage
     * @returns {Object} Data to save
     */
    saveData() {
        return {
            highscore: this.get('highscore'),
            stats: this.get('stats')
        };
    }
}