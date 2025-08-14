import { GAME_CONFIG } from '../utils/Config.js';

/**
 * FruitFactory - Create and manage fruit entities
 * 
 * Centralizes fruit creation logic, handles theme-specific fruit generation,
 * and manages fruit-related effects.
 */
export class FruitFactory {
    constructor(physics, scalingSystem, resourceManager, eventSystem, settings) {
        this.physics = physics;
        this.scalingSystem = scalingSystem;
        this.resourceManager = resourceManager;
        this.eventSystem = eventSystem;
        this.settings = settings;
        
        // Cache scaled fruits for performance
        this.scaledFruits = null;
        this.updateScaledFruits();
        
        // Listen for theme changes to update fruit visuals
        this.eventSystem.on('theme:change', () => {
            this.updateScaledFruits();
        });
    }
    
    /**
     * Update cached scaled fruits
     */
    updateScaledFruits() {
        // Get current theme from settings
        const currentBallTheme = this.settings.settings.theme.balls;
        const themeData = GAME_CONFIG.THEMES.BALLS[currentBallTheme];
        
        if (themeData && themeData.items) {
            this.scaledFruits = this.scalingSystem.scaleFruits(themeData.items);
        } else {
            // Fallback to default
            this.scaledFruits = this.scalingSystem.scaleFruits(GAME_CONFIG.FRUITS);
        }
    }
    
    /**
     * Create a fruit with specified type and position
     * @param {number} type - Fruit type index
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {Object} options - Additional options
     * @returns {Object} Created fruit body
     */
    createFruit(type, x, y, options = {}) {
        if (type < 0 || type >= this.scaledFruits.length) {
            throw new Error(`Invalid fruit type: ${type}`);
        }
        
        const fruitData = this.scaledFruits[type];
        
        const fruit = this.physics.createFruit(
            x, 
            y, 
            fruitData, 
            options.physicsConfig || {},
            options.physicsOverrides || {}
        );
        
        // Emit fruit creation event
        this.eventSystem.emit('fruit:created', {
            type,
            position: { x, y },
            radius: fruitData.radius
        });
        
        return fruit;
    }
    
    /**
     * Create a preview fruit (static, no collisions)
     * @param {number} type - Fruit type index
     * @param {number} x - X position
     * @param {number} y - Y position
     * @returns {Object} Created preview fruit
     */
    createPreviewFruit(type, x, y) {
        return this.createFruit(type, x, y, {
            physicsConfig: {
                isStatic: true,
                collisionFilter: { group: -1 }
            }
        });
    }
    
    /**
     * Create a dropped fruit with physics overrides
     * @param {number} type - Fruit type index
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {Object} physicsOverrides - Physics settings overrides
     * @returns {Object} Created fruit
     */
    createDroppedFruit(type, x, y, physicsOverrides = {}) {
        return this.createFruit(type, x, y, {
            physicsOverrides
        });
    }
    
    /**
     * Create a merged fruit at the midpoint of two fruits
     * @param {Object} fruitA - First fruit
     * @param {Object} fruitB - Second fruit
     * @param {number} newType - New fruit type
     * @param {Object} physicsOverrides - Physics settings
     * @returns {Object} Created merged fruit
     */
    createMergedFruit(fruitA, fruitB, newType, physicsOverrides = {}) {
        // Calculate midpoint
        const midX = (fruitA.position.x + fruitB.position.x) / 2;
        const midY = (fruitA.position.y + fruitB.position.y) / 2;
        
        // Create the new fruit
        const mergedFruit = this.createFruit(newType, midX, midY, {
            physicsOverrides
        });
        
        // Add some upward velocity for juice effect
        if (mergedFruit.velocity) {
            mergedFruit.velocity.y = 0;
        }
        
        return mergedFruit;
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
     * Get fruit data by type
     * @param {number} type - Fruit type index
     * @returns {Object} Fruit data
     */
    getFruitData(type) {
        return this.scaledFruits[type];
    }
    
    /**
     * Get random droppable fruit type
     * @returns {number} Random fruit type index
     */
    getRandomDroppableFruit() {
        return Math.floor(Math.random() * GAME_CONFIG.GAMEPLAY.maxDropableSize);
    }
    
    /**
     * Check if two fruits can merge
     * @param {Object} fruitA - First fruit
     * @param {Object} fruitB - Second fruit
     * @returns {boolean} True if fruits can merge
     */
    canMerge(fruitA, fruitB) {
        // Check basic conditions
        if (!fruitA || !fruitB) return false;
        if (fruitA.isStatic || fruitB.isStatic) return false;
        if (fruitA.popped || fruitB.popped) return false;
        
        // Check if same size
        return fruitA.sizeIndex === fruitB.sizeIndex;
    }
    
    /**
     * Get next fruit type after merge
     * @param {number} currentType - Current fruit type
     * @returns {number} Next fruit type (wraps to 0 for watermelon)
     */
    getNextFruitType(currentType) {
        const nextType = currentType + 1;
        
        // Check if it's the largest fruit - wrap to smallest
        if (nextType >= this.scaledFruits.length) {
            return 0;
        }
        
        return nextType;
    }
    
    /**
     * Create particle effects for fruit merge
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} fruitType - Fruit type for color
     */
    createMergeParticles(x, y, fruitType) {
        // Future enhancement: create particle effects
        this.eventSystem.emit('effect:merge', {
            position: { x, y },
            fruitType
        });
    }
}