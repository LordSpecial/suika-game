import { GAME_CONFIG } from '../utils/Config.js';

export class Physics {
    constructor() {
        this.engine = null;
        this.render = null;
        this.runner = null;
        this.gameStatics = [];
        this.scalingSystem = null;
    }
    
    /**
     * Initialize the physics engine
     */
    init(canvasElement, gameWidth, gameHeight, scalingSystem) {
        this.scalingSystem = scalingSystem;
        
        // Create Matter.js engine
        this.engine = Matter.Engine.create();
        
        
        // Create runner with fixed timestep configuration
        this.runner = Matter.Runner.create();
        const timestepConfig = GAME_CONFIG.PHYSICS.timestep;
        
        // Configure runner for framerate independence
        this.runner.delta = timestepConfig.delta;
        this.runner.deltaMin = timestepConfig.deltaMin;
        this.runner.deltaMax = timestepConfig.deltaMax;
        this.runner.isFixed = timestepConfig.isFixed;
        
        
        // Create renderer
        this.render = Matter.Render.create({
            element: canvasElement,
            engine: this.engine,
            options: {
                width: gameWidth,
                height: gameHeight,
                wireframes: false,
                background: GAME_CONFIG.ASSETS.images.background,
                // Enable high-quality rendering
                pixelRatio: window.devicePixelRatio || 1,
                // Ensure smooth scaling
                showVelocity: false,
                showAngleIndicator: false,
                showIds: false
            }
        });
        
        // Configure canvas for maximum anti-aliasing
        const canvas = this.render.canvas;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            // Enable maximum image smoothing/anti-aliasing
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            // Set additional anti-aliasing properties
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'center';
        }
        
        // Set CSS for crisp rendering
        canvas.style.imageRendering = 'auto';
        canvas.style.imageRendering = '-webkit-optimize-contrast';
        canvas.style.imageRendering = 'crisp-edges';
        canvas.style.imageRendering = 'pixelated';
        // Override the pixelated setting for smooth rendering
        canvas.style.imageRendering = 'auto';
        
        return {
            engine: this.engine,
            render: this.render,
            runner: this.runner
        };
    }
    
    /**
     * Start the physics engine
     */
    start() {
        if (this.render && this.runner && this.engine) {
            Matter.Render.run(this.render);
            Matter.Runner.run(this.runner, this.engine);
        }
    }
    
    /**
     * Update physics world dimensions
     */
    updateDimensions(gameWidth, gameHeight) {
        if (this.render) {
            this.render.options.width = gameWidth;
            this.render.options.height = gameHeight;
            this.render.canvas.width = gameWidth;
            this.render.canvas.height = gameHeight;
        }
    }
    
    /**
     * Update background image
     */
    updateBackground(backgroundPath) {
        if (this.render) {
            this.render.options.background = backgroundPath;
        }
    }
    
    /**
     * Create game walls
     */
    createWalls(gameWidth, gameHeight) {
        const { PHYSICS } = GAME_CONFIG;
        const scaledWallPad = this.scalingSystem.getScaledConstant('wallPad');
        const scaledStatusBarHeight = this.scalingSystem.getScaledConstant('statusBarHeight');
        
        const wallProps = {
            isStatic: true,
            render: { fillStyle: '#FFEEDB' },
            friction: PHYSICS.friction,
            frictionStatic: PHYSICS.frictionStatic,
            frictionAir: PHYSICS.frictionAir,
            restitution: PHYSICS.restitution
        };
        
        const walls = [
            // Left wall
            Matter.Bodies.rectangle(
                -(scaledWallPad / 2), 
                gameHeight / 2, 
                scaledWallPad, 
                gameHeight, 
                wallProps
            ),
            // Right wall  
            Matter.Bodies.rectangle(
                gameWidth + (scaledWallPad / 2), 
                gameHeight / 2, 
                scaledWallPad, 
                gameHeight, 
                wallProps
            ),
            // Bottom wall
            Matter.Bodies.rectangle(
                gameWidth / 2, 
                gameHeight + (scaledWallPad / 2) - scaledStatusBarHeight, 
                gameWidth, 
                scaledWallPad, 
                wallProps
            )
        ];
        
        return walls;
    }
    
    /**
     * Update gravity scale
     */
    updateGravity(gravityScale) {
        if (this.engine) {
            this.engine.world.gravity.scale = gravityScale;
        }
    }
    
    /**
     * Create a ball physics body
     */
    createBall(x, y, ballData, extraConfig = {}, physicsOverrides = {}) {
        const { PHYSICS } = GAME_CONFIG;
        
        const circle = Matter.Bodies.circle(x, y, ballData.radius, {
            friction: physicsOverrides.friction || PHYSICS.friction,
            frictionStatic: physicsOverrides.frictionStatic || PHYSICS.frictionStatic,
            frictionAir: PHYSICS.frictionAir,
            restitution: physicsOverrides.restitution || PHYSICS.restitution,
            density: physicsOverrides.density || 0.001, // Default Matter.js density
            ...extraConfig,
            render: { 
                sprite: { 
                    texture: ballData.img, 
                    xScale: ballData.scale, 
                    yScale: ballData.scale 
                } 
            }
        });
        
        // Add custom properties
        circle.sizeIndex = ballData.sizeIndex || 0;
        circle.popped = false;
        
        return circle;
    }
    
    /**
     * Create pop effect
     */
    createPopEffect(x, y, radius) {
        const circle = Matter.Bodies.circle(x, y, radius, {
            isStatic: true,
            collisionFilter: { mask: 0x0040 },
            angle: Math.random() * (Math.PI * 2),
            render: {
                sprite: {
                    texture: GAME_CONFIG.ASSETS.images.popEffect,
                    xScale: radius / 384,
                    yScale: radius / 384,
                }
            },
        });
        
        return circle;
    }
    
    /**
     * Add bodies to the world
     */
    addBodies(bodies) {
        if (this.engine) {
            Matter.Composite.add(this.engine.world, Array.isArray(bodies) ? bodies : [bodies]);
        }
    }
    
    /**
     * Remove bodies from the world
     */
    removeBodies(bodies) {
        if (this.engine) {
            Matter.Composite.remove(this.engine.world, Array.isArray(bodies) ? bodies : [bodies]);
        }
    }
    
    /**
     * Clear all bodies from the world
     */
    clearWorld() {
        if (this.engine) {
            Matter.Composite.clear(this.engine.world, false);
        }
    }
    
    /**
     * Setup mouse/touch controls
     */
    setupMouseControl() {
        if (!this.render || !this.engine) return null;
        
        const mouse = Matter.Mouse.create(this.render.canvas);
        const mouseConstraint = Matter.MouseConstraint.create(this.engine, {
            mouse: mouse,
            constraint: {
                stiffness: 0.2,
                render: {
                    visible: false,
                },
            },
        });
        
        this.render.mouse = mouse;
        return { mouse, mouseConstraint };
    }
}