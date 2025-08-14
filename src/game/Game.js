import { GAME_CONFIG, GAME_STATES } from '../utils/Config.js';
import { ScalingSystem } from '../systems/ScalingSystem.js';
import { Settings } from '../systems/Settings.js';
import { Physics } from './Physics.js';
import { Menu } from '../entities/Menu.js';
import { SettingsMenu } from '../entities/SettingsMenu.js';
import { eventSystem, GAME_EVENTS } from '../systems/EventSystem.js';
import { ResourceManager } from '../systems/ResourceManager.js';

export class Game {
    constructor() {
        this.eventSystem = eventSystem; // Use singleton instance
        this.resourceManager = new ResourceManager(this.eventSystem);
        this.scalingSystem = new ScalingSystem();
        this.settings = new Settings();
        this.physics = new Physics();
        this.menu = new Menu(this.scalingSystem, this.settings);
        this.settingsMenu = new SettingsMenu(this.scalingSystem, this.settings);
        
        this.state = GAME_STATES.MENU;
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
        
        this.gameData = {
            score: 0,
            fruitsMerged: [],
            currentFruitSize: 0,
            nextFruitSize: 0,
            cache: { highscore: 0 }
        };
        
        this.scaledFruits = [];
        this.sounds = {};
        this.mouseConstraint = null;
        
        // Frame-based timing
        this.dropTimeoutCounter = 0;
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
        
        // Load highscore
        this.loadHighscore();
        
        // Hide UI initially
        this.elements.ui.style.display = 'none';
        
        // Setup "Try Again" button
        this.setupTryAgainButton();
        
        // Initialize fruits merged counter
        this.gameData.fruitsMerged = Array(GAME_CONFIG.FRUITS.length).fill(0);
        
        // Start menu rendering first to ensure button bounds are calculated
        this.startMenuRendering();
        
        // Then setup menu interaction
        this.setupMenuInteraction();
        
        return this;
    }
    
    /**
     * Start game update loop for frame-based timing
     */
    startGameUpdateLoop() {
        const updateGame = () => {
            // Update frame-based timers
            if (this.state === GAME_STATES.DROP && this.dropTimeoutCounter > 0) {
                this.dropTimeoutCounter--;
                if (this.dropTimeoutCounter <= 0) {
                    // Re-add preview ball and switch to ready state
                    if (this.elements.previewBall) {
                        this.physics.addBodies(this.elements.previewBall);
                    }
                    this.state = GAME_STATES.READY;
                }
            }
            
            // Check for game over conditions during active gameplay
            if (this.state === GAME_STATES.READY || this.state === GAME_STATES.DROP) {
                this.checkGameOverConditions();
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
     * Preload all game resources
     */
    async preloadResources() {
        // Create resource manifest
        const manifest = ResourceManager.createManifestFromConfig(GAME_CONFIG);
        
        // Add listener for loading progress
        const progressHandler = (data) => {
            console.log(`Loading resources: ${data.percentage.toFixed(0)}%`);
        };
        this.eventSystem.on('resource:load:progress', progressHandler);
        
        try {
            // Load all resources
            await this.resourceManager.loadAll(manifest);
            
            // Setup sounds from loaded resources
            this.setupSoundsFromResources();
            
            // Update menu images
            this.updateMenuImages();
            
            console.log('All resources loaded successfully');
        } catch (error) {
            console.error('Failed to load resources:', error);
        } finally {
            // Remove progress listener
            this.eventSystem.off('resource:load:progress', progressHandler);
        }
    }
    
    /**
     * Setup sounds from loaded resources
     */
    setupSoundsFromResources() {
        // Get sounds from ResourceManager
        this.sounds.click = this.resourceManager.getSound('click');
        
        // Get pop sounds
        for (let i = 0; i < 11; i++) {
            this.sounds[`pop${i}`] = this.resourceManager.getSound(`pop${i}`);
        }
        
        // Audio is already configured for iOS in ResourceManager
    }
    
    /**
     * Play sound with mute check
     */
    playSound(soundName) {
        if (!this.settings.isMuted() && this.sounds[soundName]) {
            try {
                // Reset current time to allow rapid successive plays
                this.sounds[soundName].currentTime = 0;
                this.sounds[soundName].play();
            } catch (error) {
                console.warn(`Failed to play sound ${soundName}:`, error);
            }
        }
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
                console.log(`🎯 Game over: 80% of fruit above line with upward velocity (${body.velocity.y.toFixed(2)})`);
                this.loseGame();
                return;
            }
        }
    }
    
    /**
     * Initialize fruits with base sizes
     */
    initializeFruits() {
        this.scaledFruits = this.scalingSystem.scaleFruits(GAME_CONFIG.FRUITS);
    }
    
    /**
     * Setup menu interaction
     */
    setupMenuInteraction() {
        const canvas = this.physics.render.canvas;
        if (!canvas) return;
        
        const handleInteraction = (x, y) => {
            if (this.state === GAME_STATES.MENU) {
                const action = this.menu.handleClick(x, y);
                
                if (action === 'startGame') {
                    this.startGame();
                } else if (action === 'openSettings') {
                    this.openSettings();
                } else if (action === 'toggleMute') {
                    this.toggleMute();
                }
            } else if (this.state === GAME_STATES.SETTINGS) {
                const action = this.settingsMenu.handleClick(x, y);
                
                if (action === 'back_to_menu') {
                    this.closeSettings();
                } else if (action === 'theme_changed') {
                    this.applyThemeChanges();
                } else if (action === 'physics_changed') {
                    // Store that physics settings changed, don't apply during active gameplay
                    console.log('📝 Physics settings changed - will apply on next game start');
                    this.physicsNeedsUpdate = true;
                } else if (action === 'refresh') {
                    // Settings menu will re-render automatically
                }
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
        if (this.state === GAME_STATES.MENU) {
            this.menu.render(ctx, this.gameWidth, this.gameHeight);
        } else if (this.state === GAME_STATES.SETTINGS) {
            this.settingsMenu.render(ctx, this.gameWidth, this.gameHeight);
        }
        
        const renderMenu = () => {
            if (this.state === GAME_STATES.MENU) {
                this.menu.render(ctx, this.gameWidth, this.gameHeight);
                requestAnimationFrame(renderMenu);
            } else if (this.state === GAME_STATES.SETTINGS) {
                this.settingsMenu.render(ctx, this.gameWidth, this.gameHeight);
                requestAnimationFrame(renderMenu);
            } else if (this.state === GAME_STATES.READY || this.state === GAME_STATES.DROP) {
                // Render home button during gameplay
                this.renderHomeButton(ctx);
                requestAnimationFrame(renderMenu);
            }
        };
        
        // Continue with animation loop
        requestAnimationFrame(renderMenu);
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
        this.scaledFruits = this.scalingSystem.scaleFruits(GAME_CONFIG.FRUITS);
        
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
        
        // Recreate walls if in game
        if (this.state !== GAME_STATES.MENU) {
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
        this.state = GAME_STATES.SETTINGS;
        this.settingsMenu.resetView();
        this.startMenuRendering();
    }
    
    /**
     * Toggle mute state
     */
    toggleMute() {
        const isMuted = this.settings.toggleMute();
        console.log(`🔊 Audio ${isMuted ? 'muted' : 'unmuted'}`);
        
        // Play a click sound to confirm the action (only if unmuting)
        if (!isMuted) {
            this.playSound('click');
        }
    }
    
    /**
     * Return to main menu from game
     */
    goToMenu() {
        // Clear game state
        this.state = GAME_STATES.MENU;
        
        // Clear physics world
        this.physics.clearWorld();
        
        // Recreate walls for menu
        const walls = this.physics.createWalls(this.gameWidth, this.gameHeight);
        this.physics.addBodies(walls);
        
        // Reset game elements
        this.elements.fruits = [];
        this.elements.previewBall = null;
        this.score = 0;
        this.homeButtonBounds = null;
        
        // Reset score colors to original
        if (this.elements.score) {
            this.elements.score.style.color = 'var(--col-bg-lighter)';
            this.elements.score.style.textShadow = '3px 3px 0 var(--col-primary), -3px -3px 0 var(--col-primary), -3px 3px 0 var(--col-primary), 3px -3px 0 var(--col-primary)';
        }
        
        // Setup menu interaction
        this.setupMenuInteraction();
        
        // Render menu
        this.startMenuRendering();
    }
    
    /**
     * Close settings menu and return to main menu
     */
    closeSettings() {
        this.playSound('click');
        this.state = GAME_STATES.MENU;
        this.startMenuRendering();
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
                const newFruitConfig = this.scaledFruits[body.sizeIndex];
                if (newFruitConfig) {
                    body.render.sprite.texture = newFruitConfig.img;
                }
            }
        });
        
        // Update preview ball if it exists
        if (this.elements.previewBall && this.elements.previewBall.sizeIndex !== undefined) {
            const newFruitConfig = this.scaledFruits[this.elements.previewBall.sizeIndex];
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
                    if (nonStaticBodies.length > 0 && this.state !== GAME_STATES.MENU && this.state !== GAME_STATES.SETTINGS) {
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
     * Start the game
     */
    startGame() {
        this.playSound('click');
        
        this.state = GAME_STATES.READY;
        this.eventSystem.emit(GAME_EVENTS.GAME_START);
        this.eventSystem.emit(GAME_EVENTS.STATE_CHANGE, { from: GAME_STATES.MENU, to: GAME_STATES.READY });
        
        // Remove menu event listeners to prevent conflicts
        this.removeMenuEventListeners();
        
        // Create game walls
        this.recreateWalls();
        
        // Show UI
        this.calculateScore();
        this.elements.endTitle.innerText = 'Game Over!';
        this.elements.ui.style.display = 'block';
        this.elements.end.style.display = 'none';
        
        // Reset score colors to original when starting game
        if (this.elements.score) {
            this.elements.score.style.color = 'var(--col-bg-lighter)';
            this.elements.score.style.textShadow = '3px 3px 0 var(--col-primary), -3px -3px 0 var(--col-primary), -3px 3px 0 var(--col-primary), 3px -3px 0 var(--col-primary)';
        }
        
        // Create preview ball
        this.createPreviewBall();
        
        // Apply any pending physics changes now that we're in game state
        if (this.physicsNeedsUpdate) {
            this.applyPhysicsChanges();
            this.physicsNeedsUpdate = false;
        }
        
        // Setup game interaction
        this.setupGameInteraction();
        
        // Set next fruit size
        this.setNextFruitSize();
    }
    
    /**
     * Create preview ball
     */
    createPreviewBall() {
        const scaledHeight = this.scalingSystem.getScaledConstant('previewBallHeight');
        this.elements.previewBall = this.physics.createFruit(
            this.gameWidth / 2,
            scaledHeight,
            this.scaledFruits[0],
            { isStatic: true },
            this.getCurrentPhysicsOverrides()
        );
        this.physics.addBodies(this.elements.previewBall);
    }
    
    /**
     * Setup game interaction
     */
    setupGameInteraction() {
        if (!this.mouseConstraint) return;
        
        // Mouse/touch movement for preview ball
        const handleMouseMove = (event) => {
            if (this.state !== GAME_STATES.READY) return;
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
            if (this.state !== GAME_STATES.READY) return;
            this.addFruit(x);
        };
        
        // Touch handling
        const handleTouchMove = (event) => {
            event.preventDefault();
            if (this.state !== GAME_STATES.READY) return;
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
            if (this.state !== GAME_STATES.READY) return;
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
        if (this.state !== GAME_STATES.READY) return;
        
        this.playSound('click');
        
        this.state = GAME_STATES.DROP;
        const scaledHeight = this.scalingSystem.getScaledConstant('previewBallHeight');
        const fruitData = {
            ...this.scaledFruits[this.gameData.currentFruitSize],
            sizeIndex: this.gameData.currentFruitSize
        };
        
        const latestFruit = this.physics.createFruit(x, scaledHeight, fruitData, {}, this.getCurrentPhysicsOverrides());
        this.physics.addBodies(latestFruit);
        
        // Log velocity for debugging
        this.logFruitVelocity(latestFruit);
        
        this.gameData.currentFruitSize = this.gameData.nextFruitSize;
        this.setNextFruitSize();
        this.calculateScore();
        
        // Remove preview ball and create new one
        this.physics.removeBodies(this.elements.previewBall);
        
        const newPreviewData = {
            ...this.scaledFruits[this.gameData.currentFruitSize],
            sizeIndex: this.gameData.currentFruitSize
        };
        
        this.elements.previewBall = this.physics.createFruit(
            x, 
            scaledHeight, 
            newPreviewData,
            { 
                isStatic: true,
                collisionFilter: { mask: 0x0040 }
            },
            this.getCurrentPhysicsOverrides()
        );
        
        // Set frame-based timeout counter
        this.dropTimeoutCounter = GAME_CONFIG.GAMEPLAY.dropTimeoutFrames;
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
                
                this.gameData.fruitsMerged[bodyA.sizeIndex] += 1;
                
                // Merge fruits
                const midPosX = (bodyA.position.x + bodyB.position.x) / 2;
                const midPosY = (bodyA.position.y + bodyB.position.y) / 2;
                
                bodyA.popped = true;
                bodyB.popped = true;
                
                // Play pop sound
                this.playSound(`pop${bodyA.sizeIndex}`);
                
                // Remove old fruits and add new merged fruit
                this.physics.removeBodies([bodyA, bodyB]);
                
                const newFruitData = {
                    ...this.scaledFruits[newSize],
                    sizeIndex: newSize
                };
                
                const newFruit = this.physics.createFruit(midPosX, midPosY, newFruitData, {}, this.getCurrentPhysicsOverrides());
                this.physics.addBodies(newFruit);
                
                // Add pop effect
                this.addPopEffect(midPosX, midPosY, bodyA.circleRadius);
                
                this.calculateScore();
            }
        });
    }
    
    /**
     * Add pop effect
     */
    addPopEffect(x, y, radius) {
        const popEffect = this.physics.createPopEffect(x, y, radius);
        this.physics.addBodies(popEffect);
        
        setTimeout(() => {
            this.physics.removeBodies(popEffect);
        }, 100);
    }
    
    /**
     * Lose game
     */
    loseGame() {
        const prevState = this.state;
        this.state = GAME_STATES.LOSE;
        this.eventSystem.emit(GAME_EVENTS.GAME_OVER, { score: this.gameData.score });
        this.eventSystem.emit(GAME_EVENTS.STATE_CHANGE, { from: prevState, to: GAME_STATES.LOSE });
        this.elements.end.style.display = 'flex';
        this.physics.runner.enabled = false;
        this.saveHighscore();
    }
    
    /**
     * Set next fruit size
     */
    setNextFruitSize() {
        this.gameData.nextFruitSize = Math.floor(Math.random() * GAME_CONFIG.GAMEPLAY.maxDropableSize);
        this.elements.nextFruitImg.src = this.scaledFruits[this.gameData.nextFruitSize].img;
    }
    
    /**
     * Calculate and update score
     */
    calculateScore() {
        const score = this.gameData.fruitsMerged.reduce((total, count, sizeIndex) => {
            const value = GAME_CONFIG.FRUITS[sizeIndex].scoreValue * count;
            return total + value;
        }, 0);
        
        this.gameData.score = score;
        this.elements.score.innerText = this.gameData.score;
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
        
        this.gameData.cache = JSON.parse(gameCache);
        this.showHighscore();
    }
    
    /**
     * Save highscore to localStorage
     */
    saveHighscore() {
        this.calculateScore();
        if (this.gameData.score < this.gameData.cache.highscore) return;
        
        this.gameData.cache.highscore = this.gameData.score;
        this.showHighscore();
        this.elements.endTitle.innerText = 'New Highscore!';
        
        localStorage.setItem('suika-game-cache', JSON.stringify(this.gameData.cache));
    }
    
    /**
     * Show highscore in UI
     */
    showHighscore() {
        this.elements.statusValue.innerText = this.gameData.cache.highscore;
    }
    
    /**
     * Setup Try Again button functionality
     */
    setupTryAgainButton() {
        const tryAgainButton = document.getElementById('game-end-link');
        if (!tryAgainButton) return;
        
        const handleTryAgain = (event) => {
            event.preventDefault();
            this.restartGame();
        };
        
        tryAgainButton.addEventListener('click', handleTryAgain);
        tryAgainButton.addEventListener('touchstart', handleTryAgain);
    }
    
    /**
     * Restart the game
     */
    restartGame() {
        // Reset game state
        this.state = GAME_STATES.MENU;
        
        // Clear physics world
        this.physics.clearWorld();
        
        // Re-enable physics runner
        this.physics.runner.enabled = true;
        
        // Reset game data
        this.gameData.score = 0;
        this.gameData.fruitsMerged = Array(GAME_CONFIG.FRUITS.length).fill(0);
        this.gameData.currentFruitSize = 0;
        this.gameData.nextFruitSize = 0;
        
        // Hide UI
        this.elements.ui.style.display = 'none';
        this.elements.end.style.display = 'none';
        
        // Remove preview ball reference
        this.elements.previewBall = null;
        
        // Reset frame counter
        this.dropTimeoutCounter = 0;
        
        // Restart menu rendering and interaction
        this.startMenuRendering();
        this.setupMenuInteraction();
        
        // Remove game event listeners
        if (this.gameEventHandlers) {
            const canvas = this.physics.render.canvas;
            Object.entries(this.gameEventHandlers).forEach(([event, handler]) => {
                canvas.removeEventListener(event, handler);
            });
            this.gameEventHandlers = null;
        }
        
        // Restart menu
        this.startMenuRendering();
    }
}