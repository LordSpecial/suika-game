import { GAME_CONFIG } from '../utils/Config.js';

/**
 * ScoringSystem - Handle all scoring logic
 * 
 * Manages score calculation, combos, multipliers, and achievements.
 * Works with GameDataStore to persist score data.
 */
export class ScoringSystem {
    constructor(eventSystem, dataStore) {
        this.eventSystem = eventSystem;
        this.dataStore = dataStore;
        
        // Subscribe to relevant data changes
        this.setupSubscriptions();
    }
    
    /**
     * Setup data store subscriptions
     */
    setupSubscriptions() {
        // Listen for fruit merges to calculate scores
        this.dataStore.subscribe('fruitsMerged', () => {
            this.calculateScore();
        });
    }
    
    /**
     * Calculate total score based on merged fruits
     * @returns {number} The calculated score
     */
    calculateScore() {
        const fruitsMerged = this.dataStore.get('fruitsMerged');
        const score = fruitsMerged.reduce((total, count, sizeIndex) => {
            const value = GAME_CONFIG.FRUITS[sizeIndex].scoreValue * count;
            return total + value;
        }, 0);
        
        // Update score in data store
        this.dataStore.set('score', score);
        
        return score;
    }
    
    /**
     * Record a fruit merge and update score
     * @param {number} fruitIndex - The index of the merged fruit
     */
    recordMerge(fruitIndex) {
        // Record the merge in data store
        this.dataStore.recordMerge(fruitIndex);
        
        // Calculate new score
        const newScore = this.calculateScore();
        
        // Check for achievements or milestones
        this.checkAchievements(fruitIndex, newScore);
        
        // Emit scoring event for UI updates or effects
        this.eventSystem.emit('score:merge', { 
            fruitIndex, 
            newScore,
            points: GAME_CONFIG.FRUITS[fruitIndex].scoreValue
        });
    }
    
    /**
     * Get score for a specific fruit merge
     * @param {number} fruitIndex - The fruit index
     * @returns {number} Points for this fruit
     */
    getFruitScore(fruitIndex) {
        return GAME_CONFIG.FRUITS[fruitIndex]?.scoreValue || 0;
    }
    
    /**
     * Get current combo multiplier
     * @returns {number} Current multiplier
     */
    getMultiplier() {
        const currentCombo = this.dataStore.get('currentCombo') || 0;
        
        // Simple multiplier system: 1x for no combo, +0.1x per combo
        return 1 + (currentCombo * 0.1);
    }
    
    /**
     * Calculate score with multiplier
     * @param {number} baseScore - Base score before multiplier
     * @returns {number} Score with multiplier applied
     */
    applyMultiplier(baseScore) {
        return Math.floor(baseScore * this.getMultiplier());
    }
    
    /**
     * Check for achievements based on fruit merge
     * @param {number} fruitIndex - The merged fruit index
     * @param {number} score - Current score
     */
    checkAchievements(fruitIndex, score) {
        // Check if player reached the watermelon
        if (fruitIndex === GAME_CONFIG.FRUITS.length - 1) {
            this.eventSystem.emit('achievement:watermelon', { score });
        }
        
        // Check score milestones
        const milestones = [1000, 5000, 10000, 50000, 100000];
        for (const milestone of milestones) {
            if (score >= milestone && this.dataStore.get('score') < milestone) {
                this.eventSystem.emit('achievement:score', { milestone, score });
            }
        }
        
        // Check combo achievements
        const combo = this.dataStore.get('currentCombo') || 0;
        if (combo === 5) {
            this.eventSystem.emit('achievement:combo', { combo: 5 });
        } else if (combo === 10) {
            this.eventSystem.emit('achievement:combo', { combo: 10 });
        }
    }
    
    /**
     * Get score statistics
     * @returns {Object} Score statistics
     */
    getStatistics() {
        return {
            currentScore: this.dataStore.get('score'),
            highScore: this.dataStore.get('highscore'),
            totalMerges: this.dataStore.get('totalMerges'),
            fruitsMerged: this.dataStore.get('fruitsMerged'),
            currentCombo: this.dataStore.get('currentCombo'),
            bestCombo: this.dataStore.get('stats.bestCombo')
        };
    }
    
    /**
     * Reset scoring for new game
     */
    reset() {
        // The dataStore handles resetting, but we can emit an event
        this.eventSystem.emit('score:reset');
    }
}