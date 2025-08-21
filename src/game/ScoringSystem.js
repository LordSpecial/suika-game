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
        // Listen for ball merges to calculate scores
        this.dataStore.subscribe('ballsMerged', () => {
            this.calculateScore();
        });
    }
    
    /**
     * Calculate total score based on merged balls
     * @returns {number} The calculated score
     */
    calculateScore() {
        const ballsMerged = this.dataStore.get('ballsMerged');
        const score = ballsMerged.reduce((total, count, sizeIndex) => {
            const value = GAME_CONFIG.BALLS[sizeIndex].scoreValue * count;
            return total + value;
        }, 0);
        
        // Update score in data store
        this.dataStore.set('score', score);
        
        return score;
    }
    
    /**
     * Record a ball merge and update score
     * @param {number} ballIndex - The index of the merged ball */
    recordMerge(ballIndex) {
        // Record the merge in data store
        this.dataStore.recordMerge(ballIndex);
        
        // Calculate new score
        const newScore = this.calculateScore();
        
        // Check for achievements or milestones
        this.checkAchievements(ballIndex, newScore);
        
        // Emit scoring event for UI updates or effects
        this.eventSystem.emit('score:merge', { 
            ballIndex, 
            newScore,
            points: GAME_CONFIG.BALLS[ballIndex].scoreValue
        });
    }
    
    /**
     * Get score for a specific ball merge
     * @param {number} ballIndex - The ball index
     * @returns {number} Points for this ball */
    getBallScore(ballIndex) {
        return GAME_CONFIG.BALLS[ballIndex]?.scoreValue || 0;
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
     * Check for achievements based on ball merge
     * @param {number} ballIndex - The merged ball index
     * @param {number} score - Current score
     */
    checkAchievements(ballIndex, score) {
        // Check if player reached the watermelon
        if (ballIndex === GAME_CONFIG.BALLS.length - 1) {
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
            ballsMerged: this.dataStore.get('ballsMerged'),
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