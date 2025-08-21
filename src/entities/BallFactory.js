import { GAME_CONFIG } from '../utils/Config.js';

/**
 * BallFactory - Create and manage ball entities
 * 
 * Centralizes ball creation logic, handles theme-specific ball generation,
 * and manages ball-related effects.
 */
export class BallFactory {
    constructor(physics, scalingSystem, resourceManager, eventSystem, settings) {
        this.physics = physics;
        this.scalingSystem = scalingSystem;
        this.resourceManager = resourceManager;
        this.eventSystem = eventSystem;
        this.settings = settings;
        
        // Cache scaled balls for performance
        this.scaledBalls = null;
        this.updateScaledBalls();
        
        // Listen for theme changes to update ball visuals
        this.eventSystem.on('theme:change', () => {
            this.updateScaledBalls();
        });
    }
    
    /**
     * Update cached scaled balls
     */
    updateScaledBalls() {
        // Get current theme from settings
        const currentBallTheme = this.settings.settings.theme.balls;
        const themeData = GAME_CONFIG.THEMES.BALLS[currentBallTheme];
        
        if (themeData && themeData.items) {
            this.scaledBalls = this.scalingSystem.scaleBalls(themeData.items);
        } else {
            // Fallback to default
            this.scaledBalls = this.scalingSystem.scaleBalls(GAME_CONFIG.BALLS);
        }
    }
    
    /**
     * Create a ball with specified type and position
     * @param {number} type - Ball type index
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {Object} options - Additional options
     * @returns {Object} Created ball body
     */
    createBall(type, x, y, options = {}) {
        if (type < 0 || type >= this.scaledBalls.length) {
            throw new Error(`Invalid ball type: ${type}`);
        }
        
        const ballData = this.scaledBalls[type];
        
        const ball = this.physics.createBall(
            x, 
            y, 
            ballData, 
            options.physicsConfig || {},
            options.physicsOverrides || {}
        );
        
        // Emit ball creation event
        this.eventSystem.emit('ball:created', {
            type,
            position: { x, y },
            radius: ballData.radius
        });
        
        return ball;
    }
    
    /**
     * Create a preview ball (static, no collisions)
     * @param {number} type - Ball type index
     * @param {number} x - X position
     * @param {number} y - Y position
     * @returns {Object} Created preview ball
     */
    createPreviewBall(type, x, y) {
        return this.createBall(type, x, y, {
            physicsConfig: {
                isStatic: true,
                collisionFilter: { group: -1 }
            }
        });
    }
    
    /**
     * Create a dropped ball with physics overrides
     * @param {number} type - Ball type index
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {Object} physicsOverrides - Physics settings overrides
     * @returns {Object} Created ball
     */
    createDroppedBall(type, x, y, physicsOverrides = {}) {
        return this.createBall(type, x, y, {
            physicsOverrides
        });
    }
    
    /**
     * Create a merged ball at the midpoint of two balls
     * @param {Object} ballA - First ball
     * @param {Object} ballB - Second ball
     * @param {number} newType - New ball type
     * @param {Object} physicsOverrides - Physics settings
     * @returns {Object} Created merged ball
     */
    createMergedBall(ballA, ballB, newType, physicsOverrides = {}) {
        // Calculate midpoint
        const midX = (ballA.position.x + ballB.position.x) / 2;
        const midY = (ballA.position.y + ballB.position.y) / 2;
        
        // Create the new ball
        const mergedBall = this.createBall(newType, midX, midY, {
            physicsOverrides
        });
        
        // Add some upward velocity for juice effect
        if (mergedBall.velocity) {
            mergedBall.velocity.y = 0;
        }
        
        return mergedBall;
    }
    
    /**
     * Create merge/pop effect
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} radius - Effect radius
     * @returns {Object} Pop effect body
     */
    createMergeEffect(x, y, radius) {
        const effect = this.physics.createPopEffect(x, y, radius);
        
        // Schedule removal
        setTimeout(() => {
            this.physics.removeBodies(effect);
        }, 100);
        
        return effect;
    }
    
    /**
     * Get ball data by type
     * @param {number} type - Ball type index
     * @returns {Object} Ball data
     */
    getBallData(type) {
        return this.scaledBalls[type];
    }
    
    /**
     * Get random droppable ball type
     * @returns {number} Random ball type index
     */
    getRandomDroppableBall() {
        return Math.floor(Math.random() * GAME_CONFIG.GAMEPLAY.maxDropableSize);
    }
    
    /**
     * Check if two balls can merge
     * @param {Object} ballA - First ball
     * @param {Object} ballB - Second ball
     * @returns {boolean} True if balls can merge
     */
    canMerge(ballA, ballB) {
        // Check basic conditions
        if (!ballA || !ballB) return false;
        if (ballA.isStatic || ballB.isStatic) return false;
        if (ballA.popped || ballB.popped) return false;
        
        // Check if same size
        return ballA.sizeIndex === ballB.sizeIndex;
    }
    
    /**
     * Get next ball type after merge
     * @param {number} currentType - Current ball type
     * @returns {number} Next ball type (wraps to 0 for largest ball)
     */
    getNextBallType(currentType) {
        const nextType = currentType + 1;
        
        // Check if it's the largest ball - wrap to smallest
        if (nextType >= this.scaledBalls.length) {
            return 0;
        }
        
        return nextType;
    }
    
    /**
     * Create particle effects for ball merge
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} ballType - Ball type for color
     */
    createMergeParticles(x, y, ballType) {
        // Future enhancement: create particle effects
        this.eventSystem.emit('effect:merge', {
            position: { x, y },
            ballType
        });
    }
}