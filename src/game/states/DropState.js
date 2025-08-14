import { GameState } from './GameState.js';
import { GAME_CONFIG } from '../../utils/Config.js';

/**
 * DropState - Fruit has been dropped, waiting for timeout
 */
export class DropState extends GameState {
    constructor(game) {
        super('DROP', game);
        this.transitions = ['READY', 'LOSE']; // Allowed transitions
        this.dropTimeoutCounter = 0;
    }
    
    enter(data) {
        super.enter(data);
        
        // Set drop timeout
        this.dropTimeoutCounter = GAME_CONFIG.GAMEPLAY.dropTimeoutFrames;
        
        // Create next preview ball
        this.createNextPreviewBall();
    }
    
    exit() {
        super.exit();
        this.dropTimeoutCounter = 0;
    }
    
    update(deltaTime) {
        // Update frame-based timer
        if (this.dropTimeoutCounter > 0) {
            this.dropTimeoutCounter--;
            
            if (this.dropTimeoutCounter <= 0) {
                // Timeout complete, transition back to ready
                return { transition: 'READY' };
            }
        }
        
        // Check for game over conditions
        const gameOverResult = this.checkGameOverConditions();
        if (gameOverResult) {
            return gameOverResult;
        }
    }
    
    render(renderer) {
        // Game rendering is handled by Matter.js renderer
    }
    
    handleInput(input) {
        // No input during drop state
        return null;
    }
    
    createNextPreviewBall() {
        // Set next fruit size
        this.game.setNextFruitSize();
        
        // Create preview ball but don't add it to physics yet
        const scaledBallHeight = this.game.scalingSystem.getScaledConstant('previewBallHeight');
        const currentFruit = this.game.scaledFruits[this.game.dataStore.get('currentFruitSize')];
        
        this.game.elements.previewBall = this.game.physics.createFruit(
            this.game.gameWidth / 2,
            scaledBallHeight,
            currentFruit,
            {
                isStatic: true,
                collisionFilter: { group: -1 }
            }
        );
        
        // Don't add to physics world yet - will be added when transitioning to READY
    }
    
    checkGameOverConditions() {
        if (!this.game.physics || !this.game.physics.engine) return null;
        
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
                console.log(`🎯 Game over: 80% of fruit above line with upward velocity (${body.velocity.y.toFixed(2)})`);
                return { transition: 'LOSE' };
            }
        }
        
        return null;
    }
}