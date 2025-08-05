import { GAME_CONFIG, GAME_STATES } from '../utils/Config.js';
import { ScalingSystem } from '../systems/ScalingSystem.js';
import { Physics } from './Physics.js';
import { Menu } from '../entities/Menu.js';

export class Game {
    constructor() {
        this.scalingSystem = new ScalingSystem();
        this.physics = new Physics();
        this.menu = new Menu(this.scalingSystem);
        
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
        
        this.initializeSounds();
        this.initializeFruits();
    }
    
    /**
     * Initialize the game
     */
    init() {
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
     * Initialize sounds
     */
    initializeSounds() {
        const { sounds } = GAME_CONFIG.ASSETS;
        
        this.sounds.click = new Audio(sounds.click);
        
        // Initialize pop sounds
        sounds.pop.forEach((soundPath, index) => {
            this.sounds[`pop${index}`] = new Audio(soundPath);
        });
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
            if (this.state !== GAME_STATES.MENU) return;
            
            console.log('Menu interaction at:', x, y); // Debug log
            
            const action = this.menu.handleClick(x, y);
            console.log('Menu action:', action); // Debug log
            
            if (action === 'startGame') {
                this.startGame();
            }
        };
        
        const getCanvasCoordinates = (event) => {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            
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
        
        // Render menu immediately first
        this.menu.render(ctx, this.gameWidth, this.gameHeight);
        console.log('Initial menu render completed'); // Debug log
        
        const renderMenu = () => {
            if (this.state === GAME_STATES.MENU) {
                this.menu.render(ctx, this.gameWidth, this.gameHeight);
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
        
        console.log('Screen dimensions:', screenWidth, 'x', screenHeight); // Debug log
        
        // Calculate new dimensions
        const dimensions = this.scalingSystem.calculateScale(screenWidth, screenHeight);
        this.gameWidth = dimensions.gameWidth;
        this.gameHeight = dimensions.gameHeight;
        
        console.log('Game dimensions:', this.gameWidth, 'x', this.gameHeight); // Debug log
        console.log('Aspect ratio:', (this.gameWidth / this.gameHeight).toFixed(2)); // Debug log
        
        // Update scaling
        this.scalingSystem.updateScaling(this.gameWidth, this.gameHeight);
        this.scaledFruits = this.scalingSystem.scaleFruits(GAME_CONFIG.FRUITS);
        
        // Update physics dimensions
        if (this.physics.render) {
            this.physics.updateDimensions(this.gameWidth, this.gameHeight);
        }
        
        // Update canvas styling
        if (this.physics.render) {
            this.physics.render.canvas.style.width = `${this.gameWidth}px`;
            this.physics.render.canvas.style.height = `${this.gameHeight}px`;
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
        
        // Ensure body and html take full viewport
        document.documentElement.style.height = '100%';
        document.documentElement.style.margin = '0';
        document.documentElement.style.padding = '0';
        
        document.body.style.display = 'flex';
        document.body.style.justifyContent = 'center';
        document.body.style.alignItems = 'center';
        document.body.style.height = '100vh';
        document.body.style.width = '100vw';
        document.body.style.margin = '0';
        document.body.style.padding = '0';
        document.body.style.overflow = 'hidden'; // Prevent scrollbars
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
     * Start the game
     */
    startGame() {
        this.sounds.click.play();
        
        this.state = GAME_STATES.READY;
        
        // Create game walls
        this.recreateWalls();
        
        // Show UI
        this.calculateScore();
        this.elements.endTitle.innerText = 'Game Over!';
        this.elements.ui.style.display = 'block';
        this.elements.end.style.display = 'none';
        
        // Create preview ball
        this.createPreviewBall();
        
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
            { isStatic: true }
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
            const scaleX = this.physics.render.canvas.width / rect.width;
            const x = (event.clientX - rect.left) * scaleX;
            
            this.elements.previewBall.position.x = x;
        };
        
        // Mouse/touch release for dropping fruit
        const handleMouseUp = (event) => {
            if (this.state !== GAME_STATES.READY) return;
            
            const rect = this.physics.render.canvas.getBoundingClientRect();
            const scaleX = this.physics.render.canvas.width / rect.width;
            const x = (event.clientX - rect.left) * scaleX;
            
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
            const scaleX = this.physics.render.canvas.width / rect.width;
            const x = (touch.clientX - rect.left) * scaleX;
            
            this.elements.previewBall.position.x = x;
        };
        
        const handleTouchEnd = (event) => {
            event.preventDefault();
            if (this.state !== GAME_STATES.READY) return;
            if (event.changedTouches.length === 0) return;
            
            const touch = event.changedTouches[0];
            const rect = this.physics.render.canvas.getBoundingClientRect();
            const scaleX = this.physics.render.canvas.width / rect.width;
            const x = (touch.clientX - rect.left) * scaleX;
            
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
        
        this.sounds.click.play();
        
        this.state = GAME_STATES.DROP;
        const scaledHeight = this.scalingSystem.getScaledConstant('previewBallHeight');
        const fruitData = {
            ...this.scaledFruits[this.gameData.currentFruitSize],
            sizeIndex: this.gameData.currentFruitSize
        };
        
        const latestFruit = this.physics.createFruit(x, scaledHeight, fruitData);
        this.physics.addBodies(latestFruit);
        
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
            }
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
                
                const aY = bodyA.position.y + bodyA.circleRadius;
                const bY = bodyB.position.y + bodyB.circleRadius;
                const scaledLoseHeight = this.scalingSystem.getScaledConstant('loseHeight');
                
                // Check if fruit is too high - game over condition
                if (aY < scaledLoseHeight || bY < scaledLoseHeight) {
                    this.loseGame();
                    return;
                }
                
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
                if (this.sounds[`pop${bodyA.sizeIndex}`]) {
                    this.sounds[`pop${bodyA.sizeIndex}`].play();
                }
                
                // Remove old fruits and add new merged fruit
                this.physics.removeBodies([bodyA, bodyB]);
                
                const newFruitData = {
                    ...this.scaledFruits[newSize],
                    sizeIndex: newSize
                };
                
                const newFruit = this.physics.createFruit(midPosX, midPosY, newFruitData);
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
        this.state = GAME_STATES.LOSE;
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