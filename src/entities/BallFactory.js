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
     * Calculate density based on ball weight setting
     * @param {number} ballType - Ball type index (0-10)
     * @returns {number} Density value
     */
    calculateDensity(ballType) {
        const ballWeight = this.settings.getSetting('physics', 'ballWeight');
        const defaultDensity = 0.001; // Default Matter.js density
        
        switch (ballWeight) {
            case 0: // Default - all balls same density
                return defaultDensity;
                
            case 1: // Reversed - smaller balls heavier, larger balls lighter (balanced symmetric)
                // Pre-calculated balanced densities: 4x heavier to 4x lighter, symmetric around 1.0x
                const reversedDensities = [0.004000, 0.003400, 0.002800, 0.002200, 0.001600, 0.001000, 0.000850, 0.000700, 0.000550, 0.000400, 0.000250];
                return reversedDensities[ballType] || defaultDensity;
                
            case 2: // Random - fixed random density per size (consistent across game session)
                if (!this.randomDensities) {
                    // Generate random densities for each ball type (0-10)
                    // Use same balanced range as reversed mode: 0.000250 to 0.004000
                    const minDensity = 0.000250;
                    const maxDensity = 0.004000;
                    this.randomDensities = [];
                    for (let i = 0; i < 11; i++) {
                        this.randomDensities[i] = minDensity + Math.random() * (maxDensity - minDensity);
                    }
                }
                return this.randomDensities[ballType];
                
            case 3: // Super Random - completely random density for each ball
                // Use same balanced range as reversed mode: 0.000250 to 0.004000
                const minDensity = 0.000250;
                const maxDensity = 0.004000;
                return minDensity + Math.random() * (maxDensity - minDensity);
                
            default:
                return defaultDensity;
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
        
        // Calculate density based on weight mode unless overridden
        const physicsOverrides = { ...options.physicsOverrides };
        if (physicsOverrides.density === undefined) {
            physicsOverrides.density = this.calculateDensity(type);
        }
        
        const ball = this.physics.createBall(
            x, 
            y, 
            ballData, 
            options.physicsConfig || {},
            physicsOverrides
        );
        
        // Debug logging for ball weight
        const weightMode = this.settings.getSetting('physics', 'ballWeight');
        const weightModeNames = ['Default', 'Reversed', 'Random', 'Super Random'];
        console.log(`Ball spawned - Type: ${type}, Density: ${physicsOverrides.density.toFixed(6)}, Weight Mode: ${weightModeNames[weightMode]}`);
        
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