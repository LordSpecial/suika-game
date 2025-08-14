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

// Import controllers
import { RenderingController } from '../controllers/RenderingController.js';
import { InputController } from '../controllers/InputController.js';
import { PhysicsController } from '../controllers/PhysicsController.js';
import { UIController } from '../controllers/UIController.js';
import { ResourceController } from '../controllers/ResourceController.js';
import { GameFlowController } from '../controllers/GameFlowController.js';
import { ThemeController } from '../controllers/ThemeController.js';

export class Game {
    constructor() {
        // Core systems
        this.eventSystem = eventSystem; // Use singleton instance
        this.resourceManager = new ResourceManager(this.eventSystem);
        this.settings = new Settings();
        this.scalingSystem = new ScalingSystem(this.settings);
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
        this.fruitFactory = new FruitFactory(this.physics, this.scalingSystem, this.resourceManager, this.eventSystem, this.settings);
        
        // Initialize controllers
        this.renderingController = new RenderingController(this);
        this.inputController = new InputController(this);
        this.physicsController = new PhysicsController(this);
        this.uiController = new UIController(this);
        this.resourceController = new ResourceController(this);
        this.gameFlowController = new GameFlowController(this);
        this.themeController = new ThemeController(this);
        
        // Initialize state machine (but don't transition yet)
        this.stateMachine = null;
        
        this.gameWidth = GAME_CONFIG.BASE_DIMENSIONS.width;
        this.gameHeight = GAME_CONFIG.BASE_DIMENSIONS.height;
        
        // Initialize essential elements that physics needs
        this.elements = {
            canvas: document.getElementById('game-canvas'), // The container div
            ui: document.getElementById('game-ui'),
            score: document.getElementById('game-score'),
            end: document.getElementById('game-end-container'),
            endTitle: document.getElementById('game-end-title'),
            statusValue: document.getElementById('game-highscore-value'),
            nextFruitImg: document.getElementById('game-next-fruit'),
            previewBall: null,
        };
        
        this.mouseConstraint = null;
    }
    
    /**
     * Initialize the game
     */
    async init() {
        // Initialize UI controller first to get element references
        this.uiController.initialize();
        
        // Preload all resources
        await this.resourceController.preloadResources();
        
        // Calculate initial dimensions
        this.resize();
        
        // Initialize physics through controller
        this.physicsController.initialize();
        
        // Apply initial settings
        this.themeController.applyPhysicsChanges();
        this.themeController.applyThemeChanges();
        
        // Initialize state machine now that physics is ready
        this.stateMachine = new StateMachine(this.eventSystem, [
            new MenuState(this),
            new ReadyState(this),
            new DropState(this),
            new LoseState(this),
            new SettingsState(this)
        ], 'MENU');
        
        // Start game update loop
        this.gameFlowController.startGameUpdateLoop();
        
        // Start the state machine
        this.stateMachine.start();
        
        // Load highscore
        this.gameFlowController.loadHighscore();
        
        // Setup UI
        this.uiController.hideGameUI();
        this.uiController.setupTryAgainButton();
        
        // Subscribe to data changes
        this.gameFlowController.setupDataSubscriptions();
        
        return this;
    }
    
    // Delegate to controllers for backward compatibility
    startGameUpdateLoop() { return this.gameFlowController.startGameUpdateLoop(); }
    stopGameUpdateLoop() { return this.gameFlowController.stopGameUpdateLoop(); }
    setupDataSubscriptions() { return this.gameFlowController.setupDataSubscriptions(); }
    startMenuRendering() { return this.renderingController.startMenuRendering(); }
    stopMenuRendering() { return this.renderingController.stopMenuRendering(); }
    startSettingsRendering() { return this.renderingController.startSettingsRendering(); }
    stopSettingsRendering() { return this.renderingController.stopSettingsRendering(); }
    renderHomeButton(ctx) { return this.renderingController.renderHomeButton(ctx); }
    updateScoreOpacity(fruitX) { return this.renderingController.updateScoreOpacity(fruitX); }
    setupMenuInteraction() { return this.inputController.setupMenuInteraction(); }
    setupGameInteraction() { return this.inputController.setupGameInteraction(); }
    removeMenuEventListeners() { return this.inputController.removeMenuEventListeners(); }
    removeGameEventListeners() { return this.inputController.removeGameEventListeners(); }
    setupSettingsInteraction() { return this.inputController.setupSettingsInteraction(); }
    removeSettingsEventListeners() { return this.inputController.removeSettingsEventListeners(); }
    recreateWalls() { return this.physicsController.recreateWalls(); }
    setupCollisionDetection() { return this.physicsController.setupCollisionDetection(); }
    getCurrentPhysicsOverrides() { return this.physicsController.getCurrentPhysicsOverrides(); }
    updateExistingFruits() { return this.themeController.updateExistingFruits(); }
    logFruitVelocity(fruit) { return this.physicsController.logFruitVelocity(fruit); }
    updateUI() { return this.uiController.updateUI(); }
    centerGame() { return this.uiController.centerGame(); }
    setupTryAgainButton() { return this.uiController.setupTryAgainButton(); }
    preloadResources() { return this.resourceController.preloadResources(); }
    updateMenuImages() { return this.resourceController.updateMenuImages(); }
    clearGame() { return this.gameFlowController.clearGame(); }
    goToMenu() { return this.gameFlowController.goToMenu(); }
    openSettings() { return this.gameFlowController.openSettings(); }
    closeSettings() { return this.gameFlowController.closeSettings(); }
    toggleMute() { return this.gameFlowController.toggleMute(); }
    addFruit(x) { return this.gameFlowController.addFruit(x); }
    loseGame() { return this.gameFlowController.loseGame(); }
    setNextFruitSize() { return this.gameFlowController.setNextFruitSize(); }
    calculateScore() { return this.gameFlowController.calculateScore(); }
    loadHighscore() { return this.gameFlowController.loadHighscore(); }
    saveHighscore(score) { return this.gameFlowController.saveHighscore(score); }
    showHighscore() { return this.gameFlowController.showHighscore(); }
    checkGameOverConditions() { return this.gameFlowController.checkGameOverConditions(); }
    applyThemeChanges() { return this.themeController.applyThemeChanges(); }
    applyPhysicsChanges() { return this.themeController.applyPhysicsChanges(); }
    updateFruitTheme(ballTheme) { return this.themeController.updateFruitTheme(ballTheme); }
    updateBackgroundTheme(backgroundTheme) { return this.themeController.updateBackgroundTheme(backgroundTheme); }
    updateSoundsTheme(soundTheme) { return this.themeController.updateSoundsTheme(soundTheme); }
    
    /**
     * Play sound helper
     */
    playSound(soundName) {
        this.audioSystem.play(soundName);
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
            this.physicsController.updateDimensions(this.gameWidth, this.gameHeight);
        }
        
        // Update canvas scaling
        if (this.physics.render) {
            this.renderingController.setupCanvasScaling();
        }
        
        // Update UI
        this.uiController.updateUI();
        
        // Center the game
        this.uiController.centerGame();
        
        // Recreate walls with new dimensions
        if (this.physics.engine) {
            this.physicsController.recreateWalls();
        }
    }
}