import { ResourceManager } from '../systems/ResourceManager.js';
import { GAME_CONFIG } from '../utils/Config.js';

/**
 * ResourceController - Manages resource loading and updates
 * 
 * Handles preloading assets, updating menu images, and
 * coordinating with ResourceManager.
 */
export class ResourceController {
    constructor(game) {
        this.game = game;
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
            // Could emit to UI for loading bar
        };
        this.game.eventSystem.on('resource:load:progress', progressHandler);
        
        try {
            // Load all resources
            await this.game.resourceManager.loadAll(manifest);
            
            // Setup sounds from loaded resources
            this.game.audioSystem.initializeSounds();
            
            // Update menu images
            this.updateMenuImages();
            
            // All resources loaded successfully
            console.log('All resources loaded successfully');
            
        } catch (error) {
            console.error('Failed to load resources:', error);
            // Could show error UI here
        } finally {
            // Remove progress listener
            this.game.eventSystem.off('resource:load:progress', progressHandler);
        }
    }
    
    /**
     * Update menu images from ResourceManager
     */
    updateMenuImages() {
        // Update menu background and button images
        if (this.game.menu && this.game.menu.menuImages) {
            const bgImage = this.game.resourceManager.getImage('menuBackground');
            const btnImage = this.game.resourceManager.getImage('startButton');
            
            if (bgImage) this.game.menu.menuImages.background = bgImage;
            if (btnImage) this.game.menu.menuImages.startButton = btnImage;
            
            // Update ball images for menu
            this.updateMenuBallImages();
        }
        
        // Update settings menu images
        if (this.game.settingsMenu && this.game.settingsMenu.menuImages) {
            const bgImage = this.game.resourceManager.getImage('menuBackground');
            const btnImage = this.game.resourceManager.getImage('startButton');
            
            if (bgImage) this.game.settingsMenu.menuImages.background = bgImage;
            if (btnImage) this.game.settingsMenu.menuImages.button = btnImage;
        }
    }
    
    /**
     * Update menu ball images based on current theme
     */
    updateMenuBallImages() {
        if (!this.game.menu) return;
        
        this.game.menu.ballImages = {};
        const currentTheme = this.game.settings.getCurrentTheme();
        
        if (currentTheme && currentTheme.balls) {
            const themeKey = this.game.settings.settings.theme.balls;
            currentTheme.balls.items.forEach((item, index) => {
                const img = this.game.resourceManager.getImage(`${themeKey}_${index}`);
                if (img) this.game.menu.ballImages[index] = img;
            });
        }
    }
    
    /**
     * Reload specific theme resources
     */
    async reloadThemeResources(themeType, themeKey) {
        const theme = GAME_CONFIG.THEMES[themeType.toUpperCase()][themeKey];
        if (!theme) return;
        
        const manifest = { images: {} };
        
        if (themeType === 'balls' && theme.items) {
            // Load ball theme images
            theme.items.forEach((item, index) => {
                manifest.images[`${themeKey}_${index}`] = item.img;
            });
        } else if (themeType === 'background') {
            // Load background images
            if (theme.background) {
                manifest.images[`background_${themeKey}`] = theme.background;
            }
            if (theme.menuBackground) {
                manifest.images[`menuBackground_${themeKey}`] = theme.menuBackground;
            }
        }
        
        try {
            await this.game.resourceManager.loadImages(manifest.images);
            
            // Update relevant images after loading
            if (themeType === 'balls') {
                this.updateMenuBallImages();
            }
        } catch (error) {
            console.error(`Failed to load ${themeType} theme resources:`, error);
        }
    }
    
    /**
     * Get resource loading statistics
     */
    getLoadingStats() {
        return this.game.resourceManager.getStats();
    }
    
    /**
     * Clear unused resources from cache
     */
    clearUnusedResources() {
        // Future enhancement: implement resource cleanup
        // based on current theme and game state
    }
    
    /**
     * Preload resources for a specific state
     */
    async preloadStateResources(stateName) {
        // Future enhancement: load resources specific to a game state
        // For example, load end screen assets only when needed
    }
}