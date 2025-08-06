import { GAME_CONFIG } from '../utils/Config.js';

export class Settings {
    constructor() {
        this.settings = {
            theme: {
                balls: 'realFruits', // realFruits, cartoonFruits, planets
                background: 'default', // default, space
                sounds: 'default' // default only
            },
            physics: {
                bounciness: 1, // 0 = low, 1 = medium, 2 = high
                gravity: 1,    // 0 = low, 1 = medium, 2 = high
                friction: 1    // 0 = low, 1 = medium, 2 = high
            }
        };
        
        this.loadSettings();
        console.log('🎮 Default physics settings on initialization:', this.settings.physics);
    }
    
    /**
     * Load settings from localStorage
     */
    loadSettings() {
        const saved = localStorage.getItem('suika-game-settings');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                this.settings = { ...this.settings, ...parsed };
            } catch (e) {
                console.warn('Failed to load settings:', e);
            }
        }
    }
    
    /**
     * Save settings to localStorage
     */
    saveSettings() {
        localStorage.setItem('suika-game-settings', JSON.stringify(this.settings));
    }
    
    /**
     * Get current theme configuration
     */
    getCurrentTheme() {
        const themes = GAME_CONFIG.THEMES;
        return {
            balls: themes.BALLS[this.settings.theme.balls] || themes.BALLS.realFruits,
            background: themes.BACKGROUNDS[this.settings.theme.background] || themes.BACKGROUNDS.default,
            sounds: themes.SOUNDS[this.settings.theme.sounds] || themes.SOUNDS.default
        };
    }
    
    /**
     * Get current physics configuration
     */
    getCurrentPhysics() {
        const physics = GAME_CONFIG.PHYSICS_PRESETS;
        return {
            bounciness: physics.BOUNCINESS[this.settings.physics.bounciness] || physics.BOUNCINESS[1],
            gravity: physics.GRAVITY[this.settings.physics.gravity] || physics.GRAVITY[1],
            friction: physics.FRICTION[this.settings.physics.friction] || physics.FRICTION[1]
        };
    }
    
    /**
     * Update theme setting
     */
    setTheme(category, value) {
        if (this.settings.theme[category] !== undefined) {
            this.settings.theme[category] = value;
            this.saveSettings();
            return true;
        }
        return false;
    }
    
    /**
     * Update physics setting
     */
    setPhysics(category, value) {
        if (this.settings.physics[category] !== undefined && value >= 0 && value <= 2) {
            console.log(`⚙️ Physics setting changed: ${category} from ${this.settings.physics[category]} to ${value}`);
            this.settings.physics[category] = value;
            this.saveSettings();
            console.log('📊 All physics settings after change:', this.settings.physics);
            return true;
        }
        return false;
    }
    
    /**
     * Get setting value
     */
    getSetting(category, subcategory) {
        return this.settings[category]?.[subcategory];
    }
    
    /**
     * Reset to defaults
     */
    resetToDefaults() {
        this.settings = {
            theme: {
                balls: 'realFruits',
                background: 'default',
                sounds: 'default'
            },
            physics: {
                bounciness: 1,
                gravity: 1,
                friction: 1
            }
        };
        this.saveSettings();
    }
    
    /**
     * Get physics preset names for UI
     */
    getPhysicsPresetNames() {
        return {
            bounciness: ['Low', 'Medium', 'High'],
            gravity: ['Low', 'Medium', 'High'],
            friction: ['Low', 'Medium', 'High']
        };
    }
    
    /**
     * Get theme option names for UI
     */
    getThemeOptions() {
        return {
            balls: ['Real Fruits', 'Cartoon Fruits', 'Planets'],
            background: ['Default', 'Space'],
            sounds: ['Default']
        };
    }
}