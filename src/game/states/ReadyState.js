import { GameState } from './GameState.js';
import { GAME_EVENTS } from '../../systems/EventSystem.js';
import { GAME_CONFIG } from '../../utils/Config.js';

/**
 * ReadyState - Ready to drop a fruit
 */
export class ReadyState extends GameState {
    constructor(game) {
        super('READY', game);
        this.transitions = ['DROP', 'LOSE', 'MENU']; // Allowed transitions
    }
    
    enter(data) {
        super.enter(data);
        
        // Check if this is game start or returning from drop
        if (data && data.fromMenu) {
            // Starting new game
            this.setupNewGame();
        } else {
            // Returning from drop state
            this.prepareNextFruit();
        }
        
        // Enable physics if needed
        if (this.game.physics.runner && !this.game.physics.runner.enabled) {
            this.game.physics.runner.enabled = true;
        }
    }
    
    exit() {
        super.exit();
    }
    
    update(deltaTime) {
        // Check for game over conditions
        this.checkGameOverConditions();
        
        // Update preview ball position if it exists
        if (this.game.elements.previewBall && this.game.mouseConstraint) {
            const mouse = this.game.mouseConstraint.mouse;
            const scaledBallHeight = this.game.scalingSystem.getScaledConstant('previewBallHeight');
            
            // Update preview ball position
            Matter.Body.setPosition(
                this.game.elements.previewBall,
                { x: mouse.position.x, y: scaledBallHeight }
            );
            
            // Update score opacity based on position
            this.game.updateScoreOpacity(mouse.position.x);
        }
    }
    
    render(renderer) {
        // Game rendering is handled by Matter.js renderer
        // Additional UI rendering could go here
    }
    
    handleInput(input) {
        if (input.type === 'drop' && this.game.elements.previewBall) {
            // Drop the fruit
            this.dropFruit();
            return { transition: 'DROP' };
        }
    }
    
    setupNewGame() {
        // Clear any existing game elements
        this.game.clearGame();
        
        // Create game walls
        this.game.recreateWalls();
        
        // Start new game in dataStore
        this.game.dataStore.startNewGame();
        
        // Show UI
        this.game.calculateScore();
        this.game.elements.endTitle.innerText = 'Game Over!';
        this.game.elements.ui.style.display = 'block';
        this.game.elements.end.style.display = 'none';
        
        // Reset score colors
        if (this.game.elements.score) {
            this.game.elements.score.style.color = 'var(--col-bg-lighter)';
            this.game.elements.score.style.textShadow = '3px 3px 0 var(--col-primary), -3px -3px 0 var(--col-primary), -3px 3px 0 var(--col-primary), 3px -3px 0 var(--col-primary)';
        }
        
        // Mouse constraint is already set up in Game.init()
        
        // Create first preview ball
        this.createPreviewBall();
        
        // Setup game interaction for dropping fruits
        this.game.setupGameInteraction();
        
        // Emit game start event
        this.emit(GAME_EVENTS.GAME_START);
    }
    
    prepareNextFruit() {
        // Re-add preview ball after drop timeout
        if (this.game.elements.previewBall) {
            this.game.physics.addBodies(this.game.elements.previewBall);
        }
    }
    
    createPreviewBall() {
        // Set next fruit size
        this.game.setNextFruitSize();
        
        // Create preview ball
        const scaledBallHeight = this.game.scalingSystem.getScaledConstant('previewBallHeight');
        const currentFruitSize = this.game.dataStore.get('currentFruitSize');
        
        this.game.elements.previewBall = this.game.fruitFactory.createPreviewFruit(
            currentFruitSize,
            this.game.gameWidth / 2,
            scaledBallHeight
        );
        
        this.game.physics.addBodies(this.game.elements.previewBall);
    }
    
    dropFruit() {
        if (!this.game.elements.previewBall) return;
        
        const ball = this.game.elements.previewBall;
        const currentFruitSize = this.game.dataStore.get('currentFruitSize');
        
        // Create actual fruit at preview position
        const droppedFruit = this.game.fruitFactory.createDroppedFruit(
            currentFruitSize,
            ball.position.x,
            ball.position.y,
            this.game.getCurrentPhysicsOverrides()
        );
        
        // Remove preview ball
        this.game.physics.removeBodies(ball);
        this.game.elements.previewBall = null;
        
        // Add dropped fruit
        this.game.physics.addBodies(droppedFruit);
        
        // Play drop sound
        this.game.playSound('click');
        
        // Emit fruit drop event
        this.emit(GAME_EVENTS.FRUIT_DROP, {
            size: this.game.dataStore.get('currentFruitSize'),
            position: { x: droppedFruit.position.x, y: droppedFruit.position.y }
        });
        
        // Set current fruit to next fruit
        this.game.dataStore.set('currentFruitSize', this.game.dataStore.get('nextFruitSize'));
    }
    
    checkGameOverConditions() {
        if (!this.game.physics || !this.game.physics.engine) return;
        
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
                return { transition: 'LOSE' };
            }
        }
    }
}