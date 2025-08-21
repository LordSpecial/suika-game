import { GAME_CONFIG } from '../utils/Config.js';

/**
 * PhysicsController - Manages physics-related operations
 * 
 * Handles physics initialization, wall creation, collision detection,
 * and physics configuration updates.
 */
export class PhysicsController {
    constructor(game) {
        this.game = game;
        this.gameStatics = [];
    }
    
    /**
     * Initialize physics engine
     */
    initialize() {
        // Physics dimensions are already set in Game constructor
        const result = this.game.physics.init(
            this.game.elements.canvas, // Use the elements reference
            this.game.gameWidth,
            this.game.gameHeight,
            this.game.scalingSystem
        );
        
        // Setup mouse control using physics method
        const mouseControls = this.game.physics.setupMouseControl();
        if (mouseControls) {
            this.game.mouseConstraint = mouseControls.mouseConstraint;
            
            // Disable mouse constraint by default
            this.game.mouseConstraint.mouse.element.removeEventListener("mousewheel", this.game.mouseConstraint.mouse.mousewheel);
            this.game.mouseConstraint.mouse.element.removeEventListener("DOMMouseScroll", this.game.mouseConstraint.mouse.mousewheel);
        }
        
        // Create game walls
        this.recreateWalls();
        
        // Start physics engine
        this.game.physics.start();
    }
    
    /**
     * Create/recreate game walls
     */
    recreateWalls() {
        // Remove existing walls
        if (this.gameStatics.length > 0) {
            Matter.World.remove(this.game.physics.engine.world, this.gameStatics);
            this.gameStatics = [];
        }
        
        const wallPad = this.game.scalingSystem.getScaledConstant('wallPad');
        const wallThickness = 100;
        const statusBarHeight = this.game.scalingSystem.getScaledConstant('statusBarHeight');
        
        // Create wall properties with invisible rendering
        const wallOptions = {
            isStatic: true,
            render: { visible: false }
        };
        
        // Create new walls - account for status bar at bottom
        const floor = Matter.Bodies.rectangle(
            this.game.gameWidth / 2,
            this.game.gameHeight - statusBarHeight + wallThickness / 2,
            this.game.gameWidth + wallThickness * 2,
            wallThickness,
            { ...wallOptions, label: 'floor' }
        );
        
        const leftWall = Matter.Bodies.rectangle(
            -(wallPad / 2),
            this.game.gameHeight / 2,
            wallPad,
            this.game.gameHeight,
            { ...wallOptions, label: 'leftWall' }
        );
        
        const rightWall = Matter.Bodies.rectangle(
            this.game.gameWidth + (wallPad / 2),
            this.game.gameHeight / 2,
            wallPad,
            this.game.gameHeight,
            { ...wallOptions, label: 'rightWall' }
        );
        
        // Store references
        this.gameStatics = [floor, leftWall, rightWall];
        
        // Add to physics world
        Matter.World.add(this.game.physics.engine.world, this.gameStatics);
    }
    
    /**
     * Setup collision detection
     */
    setupCollisionDetection() {
        const engine = this.game.physics.engine;
        if (!engine) return;
        
        Matter.Events.on(engine, 'collisionStart', (event) => {
            for (let i = 0; i < event.pairs.length; i++) {
                const { bodyA, bodyB } = event.pairs[i];
                
                // Skip if collision is with wall
                if (bodyA.isStatic || bodyB.isStatic) continue;
                
                // Skip if different sizes
                if (bodyA.sizeIndex !== bodyB.sizeIndex) continue;
                
                // Skip if already popped
                if (bodyA.popped || bodyB.popped) continue;
                
                // Skip the largest ball if (bodyA.sizeIndex >= this.game.ballFactory.scaledBalls.length - 1) continue;
                
                // Mark as popped to prevent double processing
                bodyA.popped = true;
                bodyB.popped = true;
                
                // Calculate merge position
                const midX = (bodyA.position.x + bodyB.position.x) / 2;
                const midY = (bodyA.position.y + bodyB.position.y) / 2;
                
                // Create merged ball through BallFactory
                const mergedBall = this.game.ballFactory.createMergedBall(
                    bodyA, 
                    bodyB, 
                    bodyA.sizeIndex + 1,
                    this.getCurrentPhysicsOverrides()
                );
                
                // Remove the old balls from physics world
                this.game.physics.removeBodies([bodyA, bodyB]);
                
                // Add the merged ball to physics world
                this.game.physics.addBodies(mergedBall);
                
                // Add pop effect at the merged position  
                this.game.ballFactory.createMergeEffect(midX, midY, mergedBall.circleRadius);
                
                // Play merge sound
                this.game.audioSystem.play(`pop${bodyA.sizeIndex}`);
                
                // Record the merge in scoring system
                this.game.scoringSystem.recordMerge(bodyA.sizeIndex + 1);
                
                // Log for debugging
                this.logBallVelocity(mergedBall);
            }
        });
    }
    
    /**
     * Update physics dimensions
     */
    updateDimensions(gameWidth, gameHeight) {
        if (this.game.physics.render) {
            this.game.physics.updateDimensions(gameWidth, gameHeight);
        }
    }
    
    /**
     * Apply physics changes from settings
     */
    applyPhysicsChanges() {
        const currentSettings = this.game.settings.getCurrentPhysics();
        
        // Update gravity
        this.game.physics.updateGravity(currentSettings.gravity.scale);
        
        // Get current physics overrides  
        const overrides = this.getCurrentPhysicsOverrides();
        
        // Update existing balls
        this.updateExistingBalls(overrides);
        
        // Update ball factory's scaled balls if ball size changed
        if (this.game.ballFactory) {
            this.game.ballFactory.updateScaledBalls();
        }
        
        // Recreate walls to ensure they're properly positioned
        this.recreateWalls();
    }
    
    /**
     * Update existing balls with new physics settings
     */
    updateExistingBalls(physicsOverrides) {
        const bodies = this.game.physics.engine.world.bodies;
        const ballSizeMultiplier = this.game.settings.getBallSizeMultiplier();
        
        bodies.forEach(body => {
            // Skip static bodies (walls)
            if (body.isStatic) return;
            
            // Skip preview ball
            if (body === this.game.elements.previewBall) return;
            
            // Update physics properties
            if (physicsOverrides.restitution !== undefined) {
                body.restitution = physicsOverrides.restitution;
            }
            if (physicsOverrides.friction !== undefined) {
                body.friction = physicsOverrides.friction;
            }
            if (physicsOverrides.frictionStatic !== undefined) {
                body.frictionStatic = physicsOverrides.frictionStatic;
            }
            
            // Update size if it's a ball (has sizeIndex)
            if (body.sizeIndex !== undefined && this.game.ballFactory) {
                const ballData = this.game.ballFactory.getBallData(body.sizeIndex);
                if (ballData) {
                    // Update the body's scale for rendering
                    Matter.Body.scale(body, ballData.radius / body.circleRadius, ballData.radius / body.circleRadius);
                    
                    // Update render sprite scale
                    if (body.render && body.render.sprite) {
                        body.render.sprite.xScale = ballData.scale;
                        body.render.sprite.yScale = ballData.scale;
                    }
                }
            }
        });
    }
    
    /**
     * Get current physics overrides from settings
     */
    getCurrentPhysicsOverrides() {
        const physics = this.game.settings.getCurrentPhysics();
        return {
            restitution: physics.bounciness.restitution,
            friction: physics.friction.friction,
            frictionStatic: physics.friction.frictionStatic
        };
    }
    
    /**
     * Log ball velocity for debugging
     */
    logBallVelocity(ball) {
        const velocity = ball.velocity;
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        // Debug logging disabled in production
    }
    
    /**
     * Clear all physics bodies except walls
     */
    clearBodies() {
        const bodies = this.game.physics.engine.world.bodies;
        const bodiesToRemove = bodies.filter(body => !body.isStatic);
        
        if (bodiesToRemove.length > 0) {
            Matter.World.remove(this.game.physics.engine.world, bodiesToRemove);
        }
    }
    
    /**
     * Pause physics simulation
     */
    pause() {
        if (this.game.physics.runner) {
            this.game.physics.runner.enabled = false;
        }
    }
    
    /**
     * Resume physics simulation
     */
    resume() {
        if (this.game.physics.runner) {
            this.game.physics.runner.enabled = true;
        }
    }
}