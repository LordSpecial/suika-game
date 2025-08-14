import { GameState } from './GameState.js';
import { GAME_EVENTS } from '../../systems/EventSystem.js';

/**
 * MenuState - Handles the main menu
 */
export class MenuState extends GameState {
    constructor(game) {
        super('MENU', game);
        this.menuRenderer = game.menu;
        this.transitions = ['READY', 'SETTINGS']; // Allowed transitions
    }
    
    enter(data) {
        super.enter(data);
        
        // Remove any game event listeners
        this.game.removeGameEventListeners();
        
        // Start menu rendering
        this.game.startMenuRendering();
        
        // Setup menu interaction
        this.game.setupMenuInteraction();
        
        // Emit menu open event
        this.emit(GAME_EVENTS.MENU_OPEN);
    }
    
    exit() {
        super.exit();
        
        // Stop menu rendering
        this.game.stopMenuRendering();
        
        // Don't remove menu event listeners here - let the next state decide
        // SettingsState uses the same listeners, game states will remove them
        
        // Emit menu close event
        this.emit(GAME_EVENTS.MENU_CLOSE);
    }
    
    update(deltaTime) {
        // Menu doesn't need update logic as it's handled by render loop
    }
    
    render(renderer) {
        // Menu rendering is handled by the menu render loop
        // This is here for consistency with the state pattern
    }
    
    handleInput(input) {
        if (input.type === 'click') {
            if (!this.menuRenderer) {
                console.error('MenuState.handleInput: menuRenderer is undefined');
                return null;
            }
            
            const action = this.menuRenderer.handleClick(input.x, input.y);
            
            switch (action) {
                case 'startGame':
                    this.game.playSound('click');
                    return { transition: 'READY', data: { fromMenu: true } };
                    
                case 'openSettings':
                    this.game.playSound('click');
                    return { transition: 'SETTINGS' };
                    
                case 'toggleMute':
                    this.game.toggleMute();
                    return null;
                    
                default:
                    return null;
            }
        }
    }
    
    canTransitionTo(fromState) {
        // Can enter menu from any state except during active gameplay
        return fromState !== 'DROP';
    }
}