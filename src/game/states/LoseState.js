import { GameState } from './GameState.js';
import { GAME_EVENTS } from '../../systems/EventSystem.js';

/**
 * LoseState - Game over state
 */
export class LoseState extends GameState {
    constructor(game) {
        super('LOSE', game);
        this.transitions = ['MENU', 'READY']; // Can go to menu or restart
    }
    
    enter(data) {
        super.enter(data);
        
        // Show game over UI
        this.game.elements.end.style.display = 'flex';
        
        // Disable physics
        if (this.game.physics.runner) {
            this.game.physics.runner.enabled = false;
        }
        
        // Save highscore
        this.game.saveHighscore();
        
        // End the game in dataStore
        this.game.dataStore.endGame();
        
        // Emit game over event
        this.emit(GAME_EVENTS.GAME_OVER, { 
            score: this.game.dataStore.get('score'),
            highscore: this.game.dataStore.get('highscore')
        });
    }
    
    exit() {
        super.exit();
        
        // Hide game over UI
        this.game.elements.end.style.display = 'none';
    }
    
    update(deltaTime) {
        // No update needed in lose state
    }
    
    render(renderer) {
        // UI is handled by DOM elements
    }
    
    handleInput(input) {
        if (input.type === 'tryAgain') {
            // Start new game
            return { transition: 'READY', data: { fromMenu: true } };
        } else if (input.type === 'backToMenu') {
            // Go back to menu
            return { transition: 'MENU' };
        }
        
        return null;
    }
}