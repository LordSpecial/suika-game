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
                friction: 1,   // 0 = low, 1 = medium, 2 = high
                ballSize: 1,   // 0 = small (0.5x), 1 = medium (1x), 2 = large (1.5x)
                ballWeight: 0, // 0 = default, 1 = reversed, 2 = random, 3 = super random
                ballWeightRange: 1 // 0 = narrow, 1 = default, 2 = wide
            },
            audio: {
                muted: false // Whether all audio is muted
            }
        };
        
        this.loadSettings();
    }
    
    /**
     * Load settings from localStorage
     */
    loadSettings() {
        const saved = localStorage.getItem('suika-game-settings');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Deep merge to preserve new settings that might not be in saved data
                this.settings = this.deepMerge(this.settings, parsed);
            } catch (e) {
                // Silently fail and use defaults
            }
        }
    }
    
    /**
     * Deep merge two objects
     */
    deepMerge(target, source) {
        const output = { ...target };
        if (isObject(target) && isObject(source)) {
            Object.keys(source).forEach(key => {
                if (isObject(source[key])) {
                    if (!(key in target))
                        Object.assign(output, { [key]: source[key] });
                    else
                        output[key] = this.deepMerge(target[key], source[key]);
                } else {
                    Object.assign(output, { [key]: source[key] });
                }
            });
        }
        return output;
        
        function isObject(obj) {
            return obj && typeof obj === 'object' && !Array.isArray(obj);
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
        if (this.settings.physics[category] !== undefined && value >= 0) {
            // Different categories have different ranges
            const maxValue = category === 'ballWeight' ? 3 : 2;
            if (value <= maxValue) {
                this.settings.physics[category] = value;
                this.saveSettings();
                return true;
            }
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
     * Toggle mute state
     */
    toggleMute() {
        this.settings.audio.muted = !this.settings.audio.muted;
        this.saveSettings();
        return this.settings.audio.muted;
    }
    
    /**
     * Get current mute state
     */
    isMuted() {
        return this.settings.audio.muted;
    }
    
    /**
     * Set mute state
     */
    setMuted(muted) {
        this.settings.audio.muted = muted;
        this.saveSettings();
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
                friction: 1,
                ballSize: 1,
                ballWeight: 0,
                ballWeightRange: 1
            },
            audio: {
                muted: false
            }
        };
        this.saveSettings();
    }
    
    /**
     * Get ball size multiplier
     */
    getBallSizeMultiplier() {
        const multipliers = [0.75, 1.2, 1.75];
        return multipliers[this.settings.physics.ballSize] || 1.2;
    }
    
    /**
     * Get physics preset names for UI
     */
    getPhysicsPresetNames() {
        return {
            bounciness: ['Low', 'Medium', 'High'],
            gravity: ['Low', 'Medium', 'High'],
            friction: ['Low', 'Medium', 'High'],
            ballSize: ['Small', 'Medium', 'Large'],
            ballWeight: ['Default', 'Reversed', 'Random', 'Super Random'],
            ballWeightRange: ['Narrow', 'Default', 'Wide']
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