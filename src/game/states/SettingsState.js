import { GameState } from './GameState.js';
import { GAME_EVENTS } from '../../systems/EventSystem.js';

/**
 * SettingsState - Settings menu state
 */
export class SettingsState extends GameState {
    constructor(game) {
        super('SETTINGS', game);
        this.transitions = ['MENU']; // Can only go back to menu
        this.settingsRenderer = game.settingsMenu;
    }
    
    enter(data) {
        super.enter(data);
        
        // Start settings rendering
        this.game.startSettingsRendering();
        
        // Setup settings interaction
        this.game.setupSettingsInteraction();
    }
    
    exit() {
        super.exit();
        
        // Stop settings rendering
        this.game.stopSettingsRendering();
        
        // Remove settings event listeners
        this.game.removeSettingsEventListeners();
        
        // Reset settings view
        this.settingsRenderer.resetView();
    }
    
    update(deltaTime) {
        // Settings don't need update logic
    }
    
    render(renderer) {
        // Settings rendering is handled by the settings render loop
    }
    
    handleInput(input) {
        if (input.type === 'click') {
            const action = this.settingsRenderer.handleClick(input.x, input.y);
            
            switch (action) {
                case 'back_to_menu':
                    this.game.playSound('click');
                    return { transition: 'MENU' };
                    
                case 'theme_changed':
                    this.game.applyThemeChanges();
                    this.emit(GAME_EVENTS.THEME_CHANGE, {
                        theme: this.game.settings.settings.theme
                    });
                    return null;
                    
                case 'physics_changed':
                    this.game.applyPhysicsChanges();
                    this.emit(GAME_EVENTS.PHYSICS_CHANGE, {
                        physics: this.game.settings.settings.physics
                    });
                    return null;
                    
                case 'refresh':
                    // Just refresh the view
                    return null;
                    
                default:
                    return null;
            }
        }
        
        return null;
    }
}