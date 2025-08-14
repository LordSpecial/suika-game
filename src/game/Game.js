import { GAME_CONFIG } from '../utils/Config.js';
import { ScalingSystem } from '../systems/ScalingSystem.js';
import { Settings } from '../systems/Settings.js';
import { Physics } from './Physics.js';
import { Menu } from '../entities/Menu.js';
import { SettingsMenu } from '../entities/SettingsMenu.js';
import { FruitFactory } from '../entities/FruitFactory.js';
import { eventSystem, GAME_EVENTS } from '../systems/EventSystem.js';
import { ResourceManager } from '../systems/ResourceManager.js';
import { AudioSystem } from '../systems/AudioSystem.js';
import { ScoringSystem } from './ScoringSystem.js';
import { StateMachine } from './StateMachine.js';
import { GameDataStore } from './GameDataStore.js';
import { MenuState } from './states/MenuState.js';
import { ReadyState } from './states/ReadyState.js';
import { DropState } from './states/DropState.js';
import { LoseState } from './states/LoseState.js';
import { SettingsState } from './states/SettingsState.js';

export class Game {
    constructor() {
        this.eventSystem = eventSystem; // Use singleton instance
        this.resourceManager = new ResourceManager(this.eventSystem);
        this.scalingSystem = new ScalingSystem();
        this.settings = new Settings();
        this.physics = new Physics();
        this.menu = new Menu(this.scalingSystem, this.settings);
        this.settingsMenu = new SettingsMenu(this.scalingSystem, this.settings);
        
        // Initialize audio system
        this.audioSystem = new AudioSystem(this.eventSystem, this.settings, this.resourceManager);
        
        // Initialize data store
        this.dataStore = new GameDataStore(this.eventSystem);
        
        // Initialize scoring system
        this.scoringSystem = new ScoringSystem(this.eventSystem, this.dataStore);
        
        // Initialize fruit factory
        this.fruitFactory = new FruitFactory(this.physics, this.scalingSystem, this.resourceManager, this.eventSystem);
        
        // Initialize state machine
        this.stateMachine = new StateMachine(this.eventSystem, [
            new MenuState(this),
            new ReadyState(this),
            new DropState(this),
            new LoseState(this),
            new SettingsState(this)
        ], 'MENU');
        
        this.gameWidth = GAME_CONFIG.BASE_DIMENSIONS.width;
        this.gameHeight = GAME_CONFIG.BASE_DIMENSIONS.height;
        
        this.elements = {
            canvas: document.getElementById('game-canvas'),
            ui: document.getElementById('game-ui'),
            score: document.getElementById('game-score'),
            end: document.getElementById('game-end-container'),
            endTitle: document.getElementById('game-end-title'),
            statusValue: document.getElementById('game-highscore-value'),
            nextFruitImg: document.getElementById('game-next-fruit'),
            previewBall: null,
        };
        
        this.mouseConstraint = null;
        
        // Game update loop
        this.gameUpdateLoop = null;
        
        // Physics update flag
        this.physicsNeedsUpdate = false;
        
        // Don't initialize sounds here anymore - will be loaded via ResourceManager
        this.initializeFruits();
    }
    
    /**
     * Initialize the game
     */
    async init() {
        // Preload all resources first
        await this.preloadResources();
        // Calculate initial dimensions
        this.resize();
        
        // Initialize physics
        const physicsObjects = this.physics.init(
            this.elements.canvas,
            this.gameWidth,
            this.gameHeight,
            this.scalingSystem
        );
        
        // Setup mouse controls
        const mouseControls = this.physics.setupMouseControl();
        this.mouseConstraint = mouseControls.mouseConstraint;
        
        // Start physics
        this.physics.start();
        
        // Apply physics settings immediately after engine start, before creating any objects
        const physicsConfig = this.settings.getCurrentPhysics();
        
        
        // Apply physics settings now, before creating any game objects
        this.applyPhysicsChanges(); // Safe to apply before any bodies exist
        
        // Apply initial theme settings now that engine is initialized
        this.applyThemeChanges();
        
        // Start game update loop for frame-based timing
        this.startGameUpdateLoop();
        
        // Load highscore into data store
        this.loadHighscore();
        
        // Hide UI initially
        this.elements.ui.style.display = 'none';
        
        // Setup "Try Again" button
        this.setupTryAgainButton();
        
        // Subscribe to data changes
        this.setupDataSubscriptions();
        
        // Start menu rendering first to ensure button bounds are calculated
        this.startMenuRendering();
        
        // Then setup menu interaction
        this.setupMenuInteraction();
        
        return this;
    }
    
    /**
     * Start game update loop
     */
    startGameUpdateLoop() {
        const updateGame = () => {
            // Update state machine
            const stateResult = this.stateMachine.update(16); // ~60fps
            
            // Handle state transitions
            if (stateResult && stateResult.transition) {
                this.stateMachine.transition(stateResult.transition, stateResult.data);
            }
            
            // Continue the loop
            this.gameUpdateLoop = requestAnimationFrame(updateGame);
        };
        
        updateGame();
    }
    
    /**
     * Setup data store subscriptions
     */
    setupDataSubscriptions() {
        // Subscribe to score changes
        this.dataStore.subscribe('score', (newScore) => {
            if (this.elements.score) {
                this.elements.score.innerText = newScore;
            }
        });
        
        // Subscribe to highscore changes
        this.dataStore.subscribe('highscore', (newHighscore) => {
            if (this.elements.statusValue) {
                this.elements.statusValue.innerText = newHighscore;
            }
        });
        
        // Subscribe to next fruit changes
        this.dataStore.subscribe('nextFruitSize', (size) => {
            if (this.elements.nextFruitImg && this.fruitFactory) {
                const fruitData = this.fruitFactory.getFruitData(size);
                if (fruitData) {
                    this.elements.nextFruitImg.src = fruitData.img;
                }
            }
        });
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
     * Preload all game resources
     */
    async preloadResources() {
        // Create resource manifest
        const manifest = ResourceManager.createManifestFromConfig(GAME_CONFIG);
        
        // Add listener for loading progress
        const progressHandler = (data) => {
            // Progress handler available if needed
        };
        this.eventSystem.on('resource:load:progress', progressHandler);
        
        try {
            // Load all resources
            await this.resourceManager.loadAll(manifest);
            
            // Setup sounds from loaded resources
            this.audioSystem.initializeSounds();
            
            // Update menu images
            this.updateMenuImages();
            
            // All resources loaded successfully
        } catch (error) {
            console.error('Failed to load resources:', error);
        } finally {
            // Remove progress listener
            this.eventSystem.off('resource:load:progress', progressHandler);
        }
    }
    
    /**
     * Play sound with mute check
     */
    playSound(soundName) {
        this.audioSystem.play(soundName);
    }
    
    /**
     * Update score opacity based on fruit position
     */
    updateScoreOpacity(fruitX) {
        if (!this.elements.score) return;
        
        const tenPercent = this.gameWidth * 0.1;
        const twentyPercent = this.gameWidth * 0.2;
        
        if (fruitX <= tenPercent) {
            // Fruit is at 10% or less - minimum opacity of 5%
            this.elements.score.style.color = 'rgba(255, 238, 219, 0.05)'; // --col-bg-lighter with 5% opacity
            this.elements.score.style.textShadow = '3px 3px 0 rgba(255, 83, 0, 0.05), -3px -3px 0 rgba(255, 83, 0, 0.05), -3px 3px 0 rgba(255, 83, 0, 0.05), 3px -3px 0 rgba(255, 83, 0, 0.05)';
        } else if (fruitX <= twentyPercent) {
            // Fruit is between 10% and 20% - fade from 5% to 100%
            const fadeZone = twentyPercent - tenPercent;
            const positionInFade = fruitX - tenPercent;
            const fadeRatio = positionInFade / fadeZone;
            
            // Linear interpolation from 0.05 (5%) to 1.0 (100%)
            const opacity = 0.05 + (fadeRatio * 0.95);
            this.elements.score.style.color = `rgba(255, 238, 219, ${opacity})`;
            this.elements.score.style.textShadow = `3px 3px 0 rgba(255, 83, 0, ${opacity}), -3px -3px 0 rgba(255, 83, 0, ${opacity}), -3px 3px 0 rgba(255, 83, 0, ${opacity}), 3px -3px 0 rgba(255, 83, 0, ${opacity})`;
        } else {
            // Fruit is beyond 20% - full opacity, restore original colors
            this.elements.score.style.color = 'var(--col-bg-lighter)';
            this.elements.score.style.textShadow = '3px 3px 0 var(--col-primary), -3px -3px 0 var(--col-primary), -3px 3px 0 var(--col-primary), 3px -3px 0 var(--col-primary)';
        }
    }
    
    /**
     * Update menu images from ResourceManager
     */
    updateMenuImages() {
        // Update menu background and button images
        if (this.menu && this.menu.menuImages) {
            const bgImage = this.resourceManager.getImage('menuBackground');
            const btnImage = this.resourceManager.getImage('startButton');
            
            if (bgImage) this.menu.menuImages.background = bgImage;
            if (btnImage) this.menu.menuImages.startButton = btnImage;
            
            // Update fruit images for menu
            this.menu.fruitImages = {};
            const currentTheme = this.settings.getCurrentTheme();
            if (currentTheme && currentTheme.balls) {
                const themeKey = this.settings.settings.theme.balls;
                currentTheme.balls.items.forEach((item, index) => {
                    const img = this.resourceManager.getImage(`${themeKey}_${index}`);
                    if (img) this.menu.fruitImages[index] = img;
                });
            }
        }
        
        // Update settings menu images
        if (this.settingsMenu && this.settingsMenu.menuImages) {
            const bgImage = this.resourceManager.getImage('menuBackground');
            const btnImage = this.resourceManager.getImage('startButton');
            
            if (bgImage) this.settingsMenu.menuImages.background = bgImage;
            if (btnImage) this.settingsMenu.menuImages.button = btnImage;
        }
    }
    
    /**
     * Check for game over conditions continuously
     */
    checkGameOverConditions() {
        if (!this.physics || !this.physics.engine) return;
        
        const bodies = this.physics.engine.world.bodies;
        const scaledLoseHeight = this.scalingSystem.getScaledConstant('loseHeight');
        
        for (const body of bodies) {
            // Skip static bodies (walls) and preview balls
            if (body.isStatic || body === this.elements.previewBall) continue;
            
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
    
    /**
     * Initialize fruits with base sizes
     */
    initializeFruits() {
        // Fruits are now initialized in FruitFactory
    }
    
    /**
     * Setup menu interaction
     */
    setupMenuInteraction() {
        const canvas = this.physics.render.canvas;
        if (!canvas) return;
        
        // Remove existing handlers first to prevent duplicates
        this.removeMenuEventListeners();
        
        const handleInteraction = (x, y) => {
            // Let the state machine handle input
            const result = this.stateMachine.handleInput({ type: 'click', x, y });
            
            // Handle any state transitions
            if (result && result.transition) {
                this.stateMachine.transition(result.transition, result.data);
            }
        };
        
        const getCanvasCoordinates = (event) => {
            const rect = canvas.getBoundingClientRect();
            // Use logical canvas dimensions (not scaled by devicePixelRatio)
            const scaleX = this.gameWidth / rect.width;
            const scaleY = this.gameHeight / rect.height;
            
            return {
                x: (event.clientX - rect.left) * scaleX,
                y: (event.clientY - rect.top) * scaleY
            };
        };
        
        // Mouse events
        const menuMouseDown = (event) => {
            const coords = getCanvasCoordinates(event);
            handleInteraction(coords.x, coords.y);
        };
        
        // Touch events
        const menuTouchStart = (event) => {
            event.preventDefault();
            if (event.touches.length > 0) {
                const touch = event.touches[0];
                const coords = getCanvasCoordinates(touch);
                handleInteraction(coords.x, coords.y);
            }
        };
        
        canvas.addEventListener('mousedown', menuMouseDown);
        canvas.addEventListener('touchstart', menuTouchStart, { passive: false });
        
        // Store event handlers for cleanup
        this.menuEventHandlers = {
            mousedown: menuMouseDown,
            touchstart: menuTouchStart
        };
    }
    
    /**
     * Start menu rendering loop
     */
    startMenuRendering() {
        const canvas = this.physics.render.canvas;
        if (!canvas) {
            console.error('Canvas not available for menu rendering');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('Canvas context not available');
            return;
        }
        
        // Render appropriate menu immediately first
        if (this.stateMachine.isInState('MENU')) {
            this.menu.render(ctx, this.gameWidth, this.gameHeight);
        } else if (this.stateMachine.isInState('SETTINGS')) {
            this.settingsMenu.render(ctx, this.gameWidth, this.gameHeight);
        }
        
        const renderMenu = () => {
            if (this.stateMachine.isInState('MENU')) {
                this.menu.render(ctx, this.gameWidth, this.gameHeight);
                requestAnimationFrame(renderMenu);
            } else if (this.stateMachine.isInState('SETTINGS')) {
                this.settingsMenu.render(ctx, this.gameWidth, this.gameHeight);
                requestAnimationFrame(renderMenu);
            } else if (this.stateMachine.isInState('READY') || this.stateMachine.isInState('DROP')) {
                // Render home button during gameplay
                this.renderHomeButton(ctx);
                requestAnimationFrame(renderMenu);
            }
        };
        
        // Continue with animation loop
        this.menuRenderLoop = renderMenu;
        requestAnimationFrame(renderMenu);
    }
    
    /**
     * Stop menu rendering loop
     */
    stopMenuRendering() {
        // The render loop will stop automatically when state changes
        // since it checks the state in the requestAnimationFrame callback
        this.menuRenderLoop = null;
    }
    
    /**
     * Start settings rendering
     */
    startSettingsRendering() {
        // Settings rendering is handled by the same menu render loop
        // which checks for SETTINGS state
        this.startMenuRendering();
    }
    
    /**
     * Stop settings rendering
     */
    stopSettingsRendering() {
        // Same as stopping menu rendering
        this.stopMenuRendering();
    }
    
    /**
     * Setup settings interaction
     */
    setupSettingsInteraction() {
        // Settings use the same interaction as menu
        // The state machine will route clicks to the correct handler
    }
    
    /**
     * Remove settings event listeners
     */
    removeSettingsEventListeners() {
        // Settings use the same event listeners as menu
        // They will be removed when transitioning states
    }
    
    /**
     * Remove game event listeners
     */
    removeGameEventListeners() {
        if (this.gameEventHandlers) {
            const canvas = this.physics.render.canvas;
            if (canvas) {
                Object.entries(this.gameEventHandlers).forEach(([event, handler]) => {
                    canvas.removeEventListener(event, handler);
                });
            }
            this.gameEventHandlers = null;
        }
    }
    
    /**
     * Resize the game to fit the screen
     */
    resize() {
        // Use viewport dimensions for full screen coverage
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        
        
        // Calculate new dimensions
        const dimensions = this.scalingSystem.calculateScale(screenWidth, screenHeight);
        this.gameWidth = dimensions.gameWidth;
        this.gameHeight = dimensions.gameHeight;
        
        
        // Update scaling
        this.scalingSystem.updateScaling(this.gameWidth, this.gameHeight);
        
        // Update fruit factory scaling
        if (this.fruitFactory) {
            this.fruitFactory.updateScaledFruits();
        }
        
        // Update physics dimensions
        if (this.physics.render) {
            this.physics.updateDimensions(this.gameWidth, this.gameHeight);
        }
        
        // Update canvas styling with high-DPI support
        if (this.physics.render) {
            const canvas = this.physics.render.canvas;
            const ctx = canvas.getContext('2d');
            const dpr = window.devicePixelRatio || 1;
            
            // Set actual canvas size accounting for device pixel ratio
            canvas.width = this.gameWidth * dpr;
            canvas.height = this.gameHeight * dpr;
            
            // Scale CSS size to maintain visual size
            canvas.style.width = `${this.gameWidth}px`;
            canvas.style.height = `${this.gameHeight}px`;
            
            // Scale context to ensure correct drawing operations
            if (ctx) {
                ctx.scale(dpr, dpr);
                // Re-enable anti-aliasing after scaling
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
            }
            
            // Ensure crisp rendering
            canvas.style.imageRendering = 'auto';
        }
        
        // Center the game container
        this.centerGame();
        
        // Update UI dimensions and scaling
        this.updateUI();
        
        // Recreate walls if physics is initialized and not in menu
        if (this.physics.engine && this.stateMachine && !this.stateMachine.isInState('MENU')) {
            this.recreateWalls();
        }
    }
    
    /**
     * Center the game in the viewport
     */
    centerGame() {
        const container = document.querySelector('.container');
        if (container) {
            container.style.width = `${this.gameWidth}px`;
            container.style.height = `${this.gameHeight}px`;
            container.style.margin = '0 auto';
            container.style.maxWidth = 'none';
        }
        
        // Ensure proper full-screen display (iOS-compatible)
        document.documentElement.style.height = '100%';
        document.documentElement.style.margin = '0';
        document.documentElement.style.padding = '0';
        document.documentElement.style.overflow = 'hidden';
        
        document.body.style.display = 'flex';
        document.body.style.justifyContent = 'center';
        document.body.style.alignItems = 'center';
        // Use the CSS custom property for better iOS support
        document.body.style.height = 'calc(var(--vh, 1vh) * 100)';
        document.body.style.width = '100vw';
        document.body.style.margin = '0';
        document.body.style.padding = '0';
        document.body.style.overflow = 'hidden';
        // Additional iOS-specific styles
        document.body.style.overscrollBehavior = 'none';
        document.body.style.webkitUserSelect = 'none';
        document.body.style.webkitTouchCallout = 'none';
    }
    
    /**
     * Update UI dimensions and scaling
     */
    updateUI() {
        // Update UI overlay to match canvas exactly
        this.elements.ui.style.width = `${this.gameWidth}px`;
        this.elements.ui.style.height = `${this.gameHeight}px`;
        this.elements.ui.style.transform = 'none';
        
        // Apply CSS scaling to UI elements
        this.scalingSystem.scaleUIElements();
    }
    
    /**
     * Render home button during gameplay
     */
    renderHomeButton(ctx) {
        const buttonSize = 32;
        const margin = 16;
        const x = this.gameWidth - buttonSize - margin;
        const y = margin;
        
        // Button background
        ctx.fillStyle = 'rgba(44, 24, 16, 0.8)';
        ctx.beginPath();
        ctx.roundRect(x, y, buttonSize, buttonSize, 8);
        ctx.fill();
        
        // Home icon (simple house shape)
        ctx.fillStyle = '#F4E4BC';
        ctx.strokeStyle = '#F4E4BC';
        ctx.lineWidth = 2;
        
        const iconSize = 16;
        const iconX = x + (buttonSize - iconSize) / 2;
        const iconY = y + (buttonSize - iconSize) / 2;
        
        // House roof
        ctx.beginPath();
        ctx.moveTo(iconX + iconSize / 2, iconY);
        ctx.lineTo(iconX, iconY + iconSize / 3);
        ctx.lineTo(iconX + iconSize, iconY + iconSize / 3);
        ctx.closePath();
        ctx.fill();
        
        // House body
        ctx.fillRect(iconX + 2, iconY + iconSize / 3, iconSize - 4, iconSize * 2 / 3);
        
        // Store button bounds for click detection
        this.homeButtonBounds = { x, y, width: buttonSize, height: buttonSize };
    }
    
    /**
     * Recreate walls with current dimensions
     */
    recreateWalls() {
        // Clear existing walls
        this.physics.clearWorld();
        
        // Create new walls
        const walls = this.physics.createWalls(this.gameWidth, this.gameHeight);
        this.physics.addBodies(walls);
    }
    
    /**
     * Open settings menu
     */
    openSettings() {
        this.playSound('click');
        this.stateMachine.transition('SETTINGS');
    }
    
    /**
     * Toggle mute state
     */
    toggleMute() {
        return this.audioSystem.toggleMute();
    }
    
    /**
     * Return to main menu from game
     */
    goToMenu() {
        // Transition to menu state - the state will handle cleanup
        this.stateMachine.transition('MENU');
    }
    
    /**
     * Clear game elements
     */
    clearGame() {
        // Clear physics world
        this.physics.clearWorld();
        
        // Recreate walls
        const walls = this.physics.createWalls(this.gameWidth, this.gameHeight);
        this.physics.addBodies(walls);
        
        // Reset game elements
        this.elements.previewBall = null;
        
        // Hide UI
        this.elements.ui.style.display = 'none';
    }
    
    /**
     * Close settings menu and return to main menu
     */
    closeSettings() {
        this.playSound('click');
        this.stateMachine.transition('MENU');
    }
    
    /**
     * Apply theme changes from settings
     */
    applyThemeChanges() {
        const theme = this.settings.getCurrentTheme();
        
        // Update fruit images based on selected theme
        this.updateFruitTheme(theme.balls);
        
        // Update cached fruit images in scaling system
        this.scalingSystem.updateThemeImages(GAME_CONFIG.FRUITS);
        
        // Update background images
        this.updateBackgroundTheme(theme.background);
        
        // Update sound theme
        this.updateSoundsTheme(theme.sounds);
        
        // Re-initialize scaled fruits with new theme
        this.initializeFruits();
        
        // Update existing fruits in the game with new theme
        this.updateExistingFruits();
        
        // Update menu to show new theme
        this.updateMenuImages();
    }
    
    /**
     * Update existing fruits in the game with new theme
     */
    updateExistingFruits() {
        if (!this.physics || !this.physics.engine) return;
        
        // Get all bodies from the physics engine
        const bodies = this.physics.engine.world.bodies;
        
        // Update fruit bodies with new theme images
        bodies.forEach(body => {
            // Check if this is a fruit body (has sizeIndex and is not static)
            if (body.sizeIndex !== undefined && !body.isStatic && body.render && body.render.sprite) {
                const newFruitConfig = this.fruitFactory.getFruitData(body.sizeIndex);
                if (newFruitConfig) {
                    body.render.sprite.texture = newFruitConfig.img;
                }
            }
        });
        
        // Update preview ball if it exists
        if (this.elements.previewBall && this.elements.previewBall.sizeIndex !== undefined) {
            const newFruitConfig = this.fruitFactory.getFruitData(this.elements.previewBall.sizeIndex);
            if (newFruitConfig && this.elements.previewBall.render && this.elements.previewBall.render.sprite) {
                this.elements.previewBall.render.sprite.texture = newFruitConfig.img;
            }
        }
    }
    
    /**
     * Apply physics changes from settings
     */
    applyPhysicsChanges() {
        try {
            console.log('🎯 Current game state when applying physics:', this.state);
            
            const physicsConfig = this.settings.getCurrentPhysics();
            console.log('🔄 Applying physics changes with config:', physicsConfig);
            
            if (!physicsConfig) {
                console.error('No physics config returned');
                return;
            }
            
            // Update physics engine with new settings (engine-level only)
            if (this.physics && this.physics.engine && this.physics.engine.world) {
                // Update gravity
                if (physicsConfig.gravity && typeof physicsConfig.gravity.scale === 'number') {
                    const oldGravity = this.physics.engine.world.gravity.scale;
                    console.log(`🌍 Changing gravity scale from ${oldGravity} to: ${physicsConfig.gravity.scale}`);
                    
                    // Check if we're in a game state with active bodies
                    const bodies = this.physics.engine.world.bodies;
                    const nonStaticBodies = bodies.filter(body => !body.isStatic);
                    console.log(`🔍 Found ${nonStaticBodies.length} non-static bodies when changing gravity`);
                    
                    // If we're changing gravity while non-static bodies exist, this could cause issues
                    if (nonStaticBodies.length > 0 && !this.stateMachine.isInState('MENU') && !this.stateMachine.isInState('SETTINGS')) {
                        console.warn('⚠️ Changing gravity while game objects exist - this may cause physics issues');
                        
                        // Log the current positions of non-static bodies
                        nonStaticBodies.forEach((body, index) => {
                            console.log(`Body ${index}: pos(${body.position.x.toFixed(1)}, ${body.position.y.toFixed(1)}) vel(${body.velocity.x.toFixed(2)}, ${body.velocity.y.toFixed(2)})`);
                        });
                    }
                    
                    const currentGravity = this.physics.engine.world.gravity.scale;
                    this.physics.engine.world.gravity.scale = physicsConfig.gravity.scale;
                    
                    // Verify the change took effect
                    const newGravity = this.physics.engine.world.gravity.scale;
                    console.log(`🌍 Gravity changed from ${currentGravity} to ${newGravity} (target: ${physicsConfig.gravity.scale})`);
                }
                
                // Store current physics config for new body creation
                // New bodies will inherit these properties through getCurrentPhysicsOverrides()
                console.log('📝 Physics settings stored for new body creation');
                console.log('🏁 Game state after physics update:', this.state);
            }
        } catch (error) {
            console.error('❌ Error applying physics changes:', error);
            console.error('Stack trace:', error.stack);
        }
    }
    
    /**
     * Update fruit theme
     */
    updateFruitTheme(ballTheme) {
        if (!ballTheme || !ballTheme.items) {
            console.error('Invalid ballTheme structure:', ballTheme);
            return;
        }
        
        // Update only the image paths while preserving gameplay mechanics
        ballTheme.items.forEach((themeItem, index) => {
            if (GAME_CONFIG.FRUITS[index]) {
                GAME_CONFIG.FRUITS[index].img = themeItem.img;
                GAME_CONFIG.FRUITS[index].imgSize = themeItem.imgSize;
            }
        });
    }
    
    /**
     * Update background theme
     */
    updateBackgroundTheme(backgroundTheme) {
        // Update background assets
        GAME_CONFIG.ASSETS.images.background = backgroundTheme.background;
        GAME_CONFIG.ASSETS.images.menuBackground = backgroundTheme.menuBackground;
        
        // Update physics render background
        if (this.physics.render) {
            this.physics.render.options.background = backgroundTheme.background;
        }
    }
    
    /**
     * Update sounds theme
     */
    updateSoundsTheme(soundTheme) {
        // Update sound assets
        GAME_CONFIG.ASSETS.sounds.click = soundTheme.click;
        GAME_CONFIG.ASSETS.sounds.pop = soundTheme.pop;
        
        // With ResourceManager, sounds are loaded at startup
        // Theme changes would require reloading resources
        // For now, this is a no-op as we only have one sound theme
    }
    
    /**
     * Get current physics settings for fruit creation
     */
    getCurrentPhysicsOverrides() {
        const physicsConfig = this.settings.getCurrentPhysics();
        return {
            friction: physicsConfig.friction.friction,
            frictionStatic: physicsConfig.friction.frictionStatic,
            restitution: physicsConfig.bounciness.restitution
        };
    }
    
    /**
     * Log fruit velocity for debugging physics issues
     */
    logFruitVelocity(fruit) {
        let logCount = 0;
        const maxLogs = 120; // Log for about 2 seconds at 60fps
        
        const logVelocity = () => {
            if (logCount >= maxLogs || !fruit.position) {
                return; // Stop logging
            }
            
            
            logCount++;
            requestAnimationFrame(logVelocity);
        };
        
        // Start logging on next frame
        requestAnimationFrame(logVelocity);
    }
    
    /**
     * Remove menu event listeners to prevent conflicts with game controls
     */
    removeMenuEventListeners() {
        if (this.menuEventHandlers) {
            const canvas = this.physics.render.canvas;
            Object.entries(this.menuEventHandlers).forEach(([event, handler]) => {
                canvas.removeEventListener(event, handler);
            });
            this.menuEventHandlers = null;
        }
    }
    
    
    
    /**
     * Setup game interaction
     */
    setupGameInteraction() {
        if (!this.mouseConstraint) return;
        
        // Mouse/touch movement for preview ball
        const handleMouseMove = (event) => {
            if (!this.stateMachine.isInState('READY')) return;
            if (!this.elements.previewBall) return;
            
            const rect = this.physics.render.canvas.getBoundingClientRect();
            const scaleX = this.gameWidth / rect.width;
            const x = (event.clientX - rect.left) * scaleX;
            
            this.elements.previewBall.position.x = x;
            
            // Update score opacity based on fruit position
            this.updateScoreOpacity(x);
        };
        
        // Mouse/touch release for dropping fruit or home button
        const handleMouseUp = (event) => {
            const rect = this.physics.render.canvas.getBoundingClientRect();
            // Use logical canvas dimensions (not scaled by devicePixelRatio)
            const scaleX = this.gameWidth / rect.width;
            const scaleY = this.gameHeight / rect.height;
            const x = (event.clientX - rect.left) * scaleX;
            const y = (event.clientY - rect.top) * scaleY;
            
            // Check home button click
            if (this.homeButtonBounds && 
                x >= this.homeButtonBounds.x && 
                x <= this.homeButtonBounds.x + this.homeButtonBounds.width &&
                y >= this.homeButtonBounds.y && 
                y <= this.homeButtonBounds.y + this.homeButtonBounds.height) {
                this.goToMenu();
                return;
            }
            
            // Drop fruit if in ready state
            if (!this.stateMachine.isInState('READY')) return;
            this.addFruit(x);
        };
        
        // Touch handling
        const handleTouchMove = (event) => {
            event.preventDefault();
            if (!this.stateMachine.isInState('READY')) return;
            if (!this.elements.previewBall) return;
            if (event.touches.length === 0) return;
            
            const touch = event.touches[0];
            const rect = this.physics.render.canvas.getBoundingClientRect();
            const scaleX = this.gameWidth / rect.width;
            const x = (touch.clientX - rect.left) * scaleX;
            
            this.elements.previewBall.position.x = x;
            
            // Update score opacity based on fruit position
            this.updateScoreOpacity(x);
        };
        
        const handleTouchEnd = (event) => {
            event.preventDefault();
            if (event.changedTouches.length === 0) return;
            
            const touch = event.changedTouches[0];
            const rect = this.physics.render.canvas.getBoundingClientRect();
            const scaleX = this.gameWidth / rect.width;
            const scaleY = this.gameHeight / rect.height;
            const x = (touch.clientX - rect.left) * scaleX;
            const y = (touch.clientY - rect.top) * scaleY;
            
            // Check home button click
            if (this.homeButtonBounds && 
                x >= this.homeButtonBounds.x && 
                x <= this.homeButtonBounds.x + this.homeButtonBounds.width &&
                y >= this.homeButtonBounds.y && 
                y <= this.homeButtonBounds.y + this.homeButtonBounds.height) {
                this.goToMenu();
                return;
            }
            
            // Drop fruit if in ready state
            if (!this.stateMachine.isInState('READY')) return;
            this.addFruit(x);
        };
        
        const canvas = this.physics.render.canvas;
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
        
        // Setup collision detection
        this.setupCollisionDetection();
        
        // Store handlers for cleanup
        this.gameEventHandlers = {
            mousemove: handleMouseMove,
            mouseup: handleMouseUp,
            touchmove: handleTouchMove,
            touchend: handleTouchEnd
        };
    }
    
    /**
     * Add fruit to the game
     */
    addFruit(x) {
        if (!this.stateMachine.isInState('READY')) return;
        
        // Let the state handle the drop
        const result = this.stateMachine.handleInput({ type: 'drop', x });
        
        // Handle state transition
        if (result && result.transition) {
            this.stateMachine.transition(result.transition, result.data);
        }
    }
    
    /**
     * Setup collision detection
     */
    setupCollisionDetection() {
        const engine = this.physics.engine;
        if (!engine) return;
        
        Matter.Events.on(engine, 'collisionStart', (event) => {
            for (let i = 0; i < event.pairs.length; i++) {
                const { bodyA, bodyB } = event.pairs[i];
                
                // Skip if collision is with wall
                if (bodyA.isStatic || bodyB.isStatic) continue;
                
                // Old collision-based game over logic removed
                // Now using continuous velocity-based checking
                
                // Skip if different sizes
                if (bodyA.sizeIndex !== bodyB.sizeIndex) continue;
                
                // Skip if already popped
                if (bodyA.popped || bodyB.popped) continue;
                
                let newSize = bodyA.sizeIndex + 1;
                
                // Check if it's the largest fruit - wrap to smallest
                if (bodyA.circleRadius >= GAME_CONFIG.FRUITS[GAME_CONFIG.FRUITS.length - 1].radius * this.scalingSystem.getScale()) {
                    newSize = 0;
                }
                
                // Merge fruits
                const midPosX = (bodyA.position.x + bodyB.position.x) / 2;
                const midPosY = (bodyA.position.y + bodyB.position.y) / 2;
                
                bodyA.popped = true;
                bodyB.popped = true;
                
                // Play pop sound
                this.playSound(`pop${bodyA.sizeIndex}`);
                
                // Remove old fruits
                this.physics.removeBodies([bodyA, bodyB]);
                
                // Create merged fruit
                const newFruit = this.fruitFactory.createMergedFruit(
                    bodyA,
                    bodyB,
                    newSize,
                    this.getCurrentPhysicsOverrides()
                );
                this.physics.addBodies(newFruit);
                
                // Add pop effect
                this.fruitFactory.createMergeEffect(midPosX, midPosY, bodyA.circleRadius);
                
                // Record the merge and update score
                this.scoringSystem.recordMerge(newSize);
            }
        });
    }
    
    /**
     * Lose game
     */
    loseGame() {
        // State transition is now handled by the state machine
        this.stateMachine.transition('LOSE');
    }
    
    /**
     * Set next fruit size
     */
    setNextFruitSize() {
        const nextSize = Math.floor(Math.random() * GAME_CONFIG.GAMEPLAY.maxDropableSize);
        this.dataStore.set('nextFruitSize', nextSize);
        const nextFruitData = this.fruitFactory.getFruitData(nextSize);
        if (nextFruitData) {
            this.elements.nextFruitImg.src = nextFruitData.img;
        }
    }
    
    /**
     * Calculate and update score
     */
    calculateScore() {
        return this.scoringSystem.calculateScore();
    }
    
    /**
     * Load highscore from localStorage
     */
    loadHighscore() {
        const gameCache = localStorage.getItem('suika-game-cache');
        if (gameCache === null) {
            this.saveHighscore();
            return;
        }
        
        const data = JSON.parse(gameCache);
        this.dataStore.loadData(data);
        this.showHighscore();
    }
    
    /**
     * Save highscore to localStorage
     */
    saveHighscore() {
        this.calculateScore();
        const score = this.dataStore.get('score');
        const highscore = this.dataStore.get('highscore');
        
        if (score > highscore) {
            this.dataStore.set('highscore', score);
            this.showHighscore();
            this.elements.endTitle.innerText = 'New Highscore!';
        }
        
        const dataToSave = this.dataStore.saveData();
        localStorage.setItem('suika-game-cache', JSON.stringify(dataToSave));
    }
    
    /**
     * Show highscore in UI
     */
    showHighscore() {
        this.elements.statusValue.innerText = this.dataStore.get('highscore');
    }
    
    /**
     * Setup Try Again button functionality
     */
    setupTryAgainButton() {
        const tryAgainButton = document.getElementById('game-end-link');
        if (!tryAgainButton) return;
        
        const handleTryAgain = (event) => {
            event.preventDefault();
            // Use state machine to handle input
            const result = this.stateMachine.handleInput({ type: 'tryAgain' });
            if (result && result.transition) {
                this.stateMachine.transition(result.transition, result.data);
            }
        };
        
        tryAgainButton.addEventListener('click', handleTryAgain);
        tryAgainButton.addEventListener('touchstart', handleTryAgain);
    }
}