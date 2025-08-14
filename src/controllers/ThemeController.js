import { GAME_CONFIG } from '../utils/Config.js';

/**
 * ThemeController - Manages theme changes and applications
 * 
 * Handles theme switching for balls, backgrounds, and sounds,
 * updating existing game elements and physics settings.
 */
export class ThemeController {
    constructor(game) {
        this.game = game;
    }
    
    /**
     * Apply theme changes from settings
     */
    applyThemeChanges() {
        const currentTheme = this.game.settings.getCurrentTheme();
        
        // Update fruit theme
        if (currentTheme.balls) {
            this.updateFruitTheme(currentTheme.balls);
        }
        
        // Update background theme
        if (currentTheme.background) {
            this.updateBackgroundTheme(currentTheme.background);
        }
        
        // Update sounds theme
        if (currentTheme.sounds) {
            this.updateSoundsTheme(currentTheme.sounds);
        }
        
        // Update menu images
        this.game.resourceController.updateMenuImages();
        
        // Emit theme change event
        this.game.eventSystem.emit('theme:change', currentTheme);
    }
    
    /**
     * Apply physics changes from settings
     */
    applyPhysicsChanges() {
        this.game.physicsController.applyPhysicsChanges();
    }
    
    /**
     * Update fruit theme for existing fruits
     */
    updateFruitTheme(ballTheme) {
        // Update existing fruits in the game
        const bodies = this.game.physics.engine.world.bodies;
        
        bodies.forEach(body => {
            // Skip static bodies (walls)
            if (body.isStatic) return;
            
            // Skip if body doesn't have a sizeIndex (not a fruit)
            if (body.sizeIndex === undefined) return;
            
            // Update the render texture based on new theme
            if (ballTheme && ballTheme.items && body.sizeIndex < ballTheme.items.length) {
                const themeKey = this.game.settings.settings.theme.balls;
                const fruitImage = this.game.resourceManager.getImage(`${themeKey}_${body.sizeIndex}`);
                
                if (fruitImage && body.render) {
                    body.render.sprite.texture = fruitImage.src;
                }
            }
        });
        
        // Update factory's cached fruits
        if (this.game.fruitFactory) {
            this.game.fruitFactory.updateScaledFruits();
        }
    }
    
    /**
     * Update background theme
     */
    updateBackgroundTheme(backgroundTheme) {
        // Update background assets in config (important for physics render)
        GAME_CONFIG.ASSETS.images.background = backgroundTheme.background;
        GAME_CONFIG.ASSETS.images.menuBackground = backgroundTheme.menuBackground;
        
        // Update physics render background
        if (this.game.physics.render && backgroundTheme) {
            const bgKey = this.game.settings.settings.theme.background;
            const bgImage = this.game.resourceManager.getImage(`background_${bgKey}`);
            
            if (bgImage) {
                this.game.physics.updateBackground(bgImage.src);
            } else if (backgroundTheme.background) {
                // Fallback to direct path if not in resource manager
                this.game.physics.updateBackground(backgroundTheme.background);
            }
        }
        
        // Update menu background if needed
        this.game.resourceController.updateMenuImages();
    }
    
    /**
     * Update sounds theme
     */
    updateSoundsTheme(soundTheme) {
        // Re-initialize sounds with new theme
        if (soundTheme && this.game.audioSystem) {
            this.game.audioSystem.initializeSounds();
        }
    }
    
    /**
     * Get current physics overrides
     */
    getCurrentPhysicsOverrides() {
        return this.game.physicsController.getCurrentPhysicsOverrides();
    }
    
    /**
     * Update existing fruits with new theme and physics
     */
    updateExistingFruits() {
        const currentTheme = this.game.settings.getCurrentTheme();
        const physicsOverrides = this.getCurrentPhysicsOverrides();
        
        // Update visual theme
        if (currentTheme.balls) {
            this.updateFruitTheme(currentTheme.balls);
        }
        
        // Update physics properties
        this.game.physicsController.updateExistingFruits(physicsOverrides);
    }
    
    /**
     * Preload theme resources
     */
    async preloadThemeResources(themeType, themeKey) {
        await this.game.resourceController.reloadThemeResources(themeType, themeKey);
    }
    
    /**
     * Get theme display name
     */
    getThemeDisplayName(category, value) {
        const mapping = {
            balls: { 
                realFruits: 'Real Fruits', 
                cartoonFruits: 'Cartoon Fruits', 
                planets: 'Planets',
                buttons: 'Buttons',
                iceCream: 'Ice Cream'
            },
            background: { 
                default: 'Default', 
                space: 'Space',
                chalky: 'Chalky',
                patches: 'Patches',
                paua: 'Paua',
                rainbow: 'Rainbow',
                skelly: 'Skelly',
                stars: 'Stars',
                cottonee: 'Cottonee',
                fishies: 'Fishies',
                whimsigoth: 'Whimsigoth'
            },
            sounds: { 
                default: 'Default' 
            }
        };
        
        return mapping[category] && mapping[category][value] || value;
    }
    
    /**
     * Cycle through theme options
     */
    cycleThemeOption(category) {
        const options = {
            balls: ['realFruits', 'cartoonFruits', 'planets', 'buttons', 'iceCream'],
            background: ['default', 'space', 'chalky', 'patches', 'paua', 'rainbow', 'skelly', 'stars', 'cottonee', 'fishies', 'whimsigoth'],
            sounds: ['default']
        };
        
        const currentValue = this.game.settings.settings.theme[category];
        const currentIndex = options[category].indexOf(currentValue);
        const nextIndex = (currentIndex + 1) % options[category].length;
        const nextValue = options[category][nextIndex];
        
        this.game.settings.setTheme(category, nextValue);
        return nextValue;
    }
}