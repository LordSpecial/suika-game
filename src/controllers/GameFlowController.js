import { GAME_CONFIG } from '../utils/Config.js';
import { Database } from '../utils/Database.js';

// Create database instance
const database = new Database();

/**
 * GameFlowController - Manages game flow and state transitions
 * 
 * Handles game initialization, state transitions, scoring,
 * and game lifecycle management.
 */
export class GameFlowController {
    constructor(game) {
        this.game = game;
        this.gameUpdateLoop = null;
    }
    
    /**
     * Start game update loop
     */
    startGameUpdateLoop() {
        const updateGame = () => {
            // Update state machine
            const stateResult = this.game.stateMachine.update(16); // ~60fps
            
            // Handle state transitions
            if (stateResult && stateResult.transition) {
                this.game.stateMachine.transition(stateResult.transition, stateResult.data);
            }
            
            // Continue the loop
            this.gameUpdateLoop = requestAnimationFrame(updateGame);
        };
        
        updateGame();
    }
    
    /**
     * Stop game update loop
     */
    stopGameUpdateLoop() {
        if (this.gameUpdateLoop) {
            cancelAnimationFrame(this.gameUpdateLoop);
            this.gameUpdateLoop = null;
        }
    }
    
    /**
     * Setup data store subscriptions
     */
    setupDataSubscriptions() {
        // Subscribe to score changes
        this.game.dataStore.subscribe('score', (newScore) => {
            this.game.uiController.updateScore(newScore);
        });
        
        // Subscribe to highscore changes
        this.game.dataStore.subscribe('highscore', (newHighscore) => {
            this.game.uiController.updateHighscore(newHighscore);
        });
        
        // Subscribe to next fruit changes
        this.game.dataStore.subscribe('nextFruitSize', (size) => {
            if (this.game.fruitFactory) {
                const fruitData = this.game.fruitFactory.getFruitData(size);
                this.game.uiController.updateNextFruit(fruitData);
            }
        });
    }
    
    /**
     * Clear game state
     */
    clearGame() {
        // Clear all physics bodies except walls
        this.game.physicsController.clearBodies();
        
        // Clear preview ball reference
        this.game.elements.previewBall = null;
        
        // Hide UI elements
        this.game.uiController.hideEndModal();
    }
    
    /**
     * Go to menu
     */
    goToMenu() {
        this.game.playSound('click');
        this.game.stateMachine.transition('MENU');
    }
    
    /**
     * Open settings
     */
    openSettings() {
        this.game.playSound('click');
        this.game.stateMachine.transition('SETTINGS');
    }
    
    /**
     * Close settings
     */
    closeSettings() {
        this.game.playSound('click');
        this.game.stateMachine.transition('MENU');
    }
    
    /**
     * Toggle mute state
     */
    toggleMute() {
        // Toggle mute state through audio system
        this.game.audioSystem.toggleMute();
        
        // Force re-render to update mute button state
        const canvas = this.game.physics.render.canvas;
        const ctx = canvas.getContext('2d');
        this.game.menu.render(ctx, this.game.gameWidth, this.game.gameHeight);
    }
    
    /**
     * Add fruit to the game
     */
    addFruit(x) {
        if (!this.game.stateMachine.isInState('READY')) return;
        
        // Let the state handle the drop
        const result = this.game.stateMachine.handleInput({ type: 'drop', x });
        
        // Handle state transition
        if (result && result.transition) {
            this.game.stateMachine.transition(result.transition, result.data);
        }
    }
    
    /**
     * Handle game over
     */
    loseGame() {
        this.game.audioSystem.play('click');
        
        // Transition to lose state
        this.game.stateMachine.transition('LOSE');
    }
    
    /**
     * Set next fruit size
     */
    setNextFruitSize() {
        const maxDropableSize = GAME_CONFIG.GAMEPLAY.maxDropableSize;
        const nextSize = Math.floor(Math.random() * maxDropableSize);
        
        this.game.dataStore.set('currentFruitSize', nextSize);
        this.game.dataStore.set('nextFruitSize', Math.floor(Math.random() * maxDropableSize));
    }
    
    /**
     * Calculate current score
     */
    calculateScore() {
        const score = this.game.scoringSystem.calculateScore();
        this.game.dataStore.set('score', score);
        return score;
    }
    
    /**
     * Load highscore from database
     */
    async loadHighscore() {
        try {
            const highscore = await database.getHighScore();
            this.game.dataStore.set('highscore', highscore || 0);
            
            // Update UI
            this.game.uiController.updateHighscore(highscore || 0);
        } catch (error) {
            console.error('Failed to load highscore:', error);
            this.game.dataStore.set('highscore', 0);
            this.game.uiController.updateHighscore(0);
        }
    }
    
    /**
     * Save highscore to database
     */
    async saveHighscore(score) {
        try {
            await database.saveScore({ score, duration: 0, fruitsUsed: 0 });
            this.game.dataStore.set('highscore', score);
            
            // Update UI
            this.game.uiController.updateHighscore(score);
            
            return true;
        } catch (error) {
            console.error('Failed to save highscore:', error);
            return false;
        }
    }
    
    /**
     * Show highscore notification if new record
     */
    showHighscore() {
        const currentScore = this.game.dataStore.get('score');
        const highscore = this.game.dataStore.get('highscore');
        
        if (currentScore > highscore) {
            this.game.uiController.showHighscoreNotification();
            this.saveHighscore(currentScore);
        }
    }
    
    
    /**
     * Check game over conditions
     */
    checkGameOverConditions() {
        if (!this.game.physics || !this.game.physics.engine) return;
        
        const bodies = this.game.physics.engine.world.bodies;
        const scaledLoseHeight = this.game.scalingSystem.getScaledConstant('loseHeight');
        
        for (const body of bodies) {
            // Skip static bodies (walls) and preview balls
            if (body.isStatic || body === this.game.elements.previewBall) continue;
            
            // Skip if body doesn't have a sizeIndex (not a fruit)
            if (body.sizeIndex === undefined) continue;
            
            // Check if any part of the fruit is above the lose line
            const fruitTop = body.position.y - body.circleRadius;
            
            // Game over: 80% of fruit above the line with upward velocity
            const twentyPercentFromTop = fruitTop + (body.circleRadius * 2 * 0.2);
            if (twentyPercentFromTop < scaledLoseHeight && body.velocity.y < 0) {
                this.loseGame();
                return;
            }
        }
    }
}