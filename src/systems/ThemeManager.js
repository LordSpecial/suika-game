import { GAME_CONFIG } from '../utils/Config.js';

/**
 * ThemeManager - Handle all theme-related logic
 * 
 * Manages theme loading, switching, and application.
 * Supports both ball themes and background themes.
 */
export class ThemeManager {
    constructor(settings, resourceManager, eventSystem) {
        this.settings = settings;
        this.resourceManager = resourceManager;
        this.eventSystem = eventSystem;
        
        // Theme registries
        this.ballThemes = new Map();
        this.backgroundThemes = new Map();
        
        // Current theme data
        this.currentBallTheme = null;
        this.currentBackgroundTheme = null;
        
        // Custom theme support
        this.customThemes = {
            balls: new Map(),
            backgrounds: new Map()
        };
        
        // Initialize with default themes
        this.initializeDefaultThemes();
        
        // Load current theme from settings
        this.loadCurrentTheme();
        
        // Listen for theme change events
        this.setupEventListeners();
    }
    
    /**
     * Initialize default themes from config
     */
    initializeDefaultThemes() {
        // Register ball themes
        if (GAME_CONFIG.THEMES?.BALLS) {
            Object.entries(GAME_CONFIG.THEMES.BALLS).forEach(([key, theme]) => {
                this.registerBallTheme(key, theme);
            });
        }
        
        // Register background themes
        if (GAME_CONFIG.THEMES?.BACKGROUNDS) {
            Object.entries(GAME_CONFIG.THEMES.BACKGROUNDS).forEach(([key, theme]) => {
                this.registerBackgroundTheme(key, theme);
            });
        }
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for theme change requests
        this.eventSystem.on('theme:change:request', (data) => {
            if (data.type === 'balls') {
                this.applyBallTheme(data.key);
            } else if (data.type === 'background') {
                this.applyBackgroundTheme(data.key);
            }
        });
    }
    
    /**
     * Load current theme from settings
     */
    loadCurrentTheme() {
        const currentSettings = this.settings.getCurrentTheme();
        
        // Apply ball theme
        if (currentSettings.balls) {
            this.applyBallTheme(currentSettings.balls, false);
        }
        
        // Apply background theme
        if (currentSettings.background) {
            this.applyBackgroundTheme(currentSettings.background, false);
        }
    }
    
    /**
     * Register a ball theme
     * @param {string} key - Theme key
     * @param {Object} theme - Theme data
     */
    registerBallTheme(key, theme) {
        this.ballThemes.set(key, {
            key,
            name: theme.name || key,
            items: theme.items || [],
            metadata: theme.metadata || {}
        });
    }
    
    /**
     * Register a background theme
     * @param {string} key - Theme key
     * @param {Object} theme - Theme data
     */
    registerBackgroundTheme(key, theme) {
        this.backgroundThemes.set(key, {
            key,
            name: theme.name || key,
            background: theme.background,
            lineColor: theme.lineColor || '#666666',
            backgroundColor: theme.backgroundColor || '#F5F5DC',
            metadata: theme.metadata || {}
        });
    }
    
    /**
     * Register a custom theme
     * @param {string} type - Theme type ('balls' or 'background')
     * @param {string} key - Theme key
     * @param {Object} theme - Theme data
     */
    registerCustomTheme(type, key, theme) {
        if (type === 'balls') {
            this.customThemes.balls.set(key, theme);
            this.registerBallTheme(key, theme);
        } else if (type === 'background') {
            this.customThemes.backgrounds.set(key, theme);
            this.registerBackgroundTheme(key, theme);
        }
    }
    
    /**
     * Get current theme
     * @returns {Object} Current theme configuration
     */
    getCurrentTheme() {
        return {
            balls: this.currentBallTheme,
            background: this.currentBackgroundTheme
        };
    }
    
    /**
     * Get all available ball themes
     * @returns {Array} Array of theme info
     */
    getAvailableBallThemes() {
        return Array.from(this.ballThemes.values()).map(theme => ({
            key: theme.key,
            name: theme.name,
            preview: theme.items[0]?.img || null
        }));
    }
    
    /**
     * Get all available background themes
     * @returns {Array} Array of theme info
     */
    getAvailableBackgroundThemes() {
        return Array.from(this.backgroundThemes.values()).map(theme => ({
            key: theme.key,
            name: theme.name,
            preview: theme.background
        }));
    }
    
    /**
     * Apply a ball theme
     * @param {string} key - Theme key
     * @param {boolean} save - Whether to save to settings
     */
    applyBallTheme(key, save = true) {
        const theme = this.ballThemes.get(key);
        if (!theme) {
            console.error(`Ball theme not found: ${key}`);
            return false;
        }
        
        this.currentBallTheme = theme;
        
        // Update fruit images in config
        if (GAME_CONFIG.FRUITS && theme.items) {
            theme.items.forEach((item, index) => {
                if (GAME_CONFIG.FRUITS[index]) {
                    GAME_CONFIG.FRUITS[index].img = item.img;
                }
            });
        }
        
        // Save to settings
        if (save) {
            this.settings.setTheme('balls', key);
        }
        
        // Emit theme change event
        this.eventSystem.emit('theme:change', {
            type: 'balls',
            key,
            theme
        });
        
        return true;
    }
    
    /**
     * Apply a background theme
     * @param {string} key - Theme key
     * @param {boolean} save - Whether to save to settings
     */
    applyBackgroundTheme(key, save = true) {
        const theme = this.backgroundThemes.get(key);
        if (!theme) {
            console.error(`Background theme not found: ${key}`);
            return false;
        }
        
        this.currentBackgroundTheme = theme;
        
        // Update background in physics renderer if available
        if (theme.background) {
            // This will be handled by the physics system when it receives the event
        }
        
        // Update CSS variables for UI elements
        if (theme.backgroundColor) {
            document.documentElement.style.setProperty('--theme-bg-color', theme.backgroundColor);
        }
        if (theme.lineColor) {
            document.documentElement.style.setProperty('--theme-line-color', theme.lineColor);
        }
        
        // Save to settings
        if (save) {
            this.settings.setTheme('background', key);
        }
        
        // Emit theme change event
        this.eventSystem.emit('theme:change', {
            type: 'background',
            key,
            theme
        });
        
        return true;
    }
    
    /**
     * Get theme data by key
     * @param {string} type - Theme type ('balls' or 'background')
     * @param {string} key - Theme key
     * @returns {Object|null} Theme data or null
     */
    getTheme(type, key) {
        if (type === 'balls') {
            return this.ballThemes.get(key) || null;
        } else if (type === 'background') {
            return this.backgroundThemes.get(key) || null;
        }
        return null;
    }
    
    /**
     * Export custom themes
     * @returns {Object} Custom theme data
     */
    exportCustomThemes() {
        return {
            balls: Array.from(this.customThemes.balls.entries()),
            backgrounds: Array.from(this.customThemes.backgrounds.entries())
        };
    }
    
    /**
     * Import custom themes
     * @param {Object} themeData - Theme data to import
     */
    importCustomThemes(themeData) {
        if (themeData.balls) {
            themeData.balls.forEach(([key, theme]) => {
                this.registerCustomTheme('balls', key, theme);
            });
        }
        
        if (themeData.backgrounds) {
            themeData.backgrounds.forEach(([key, theme]) => {
                this.registerCustomTheme('background', key, theme);
            });
        }
    }
    
    /**
     * Reset to default theme
     * @param {string} type - Theme type to reset ('balls', 'background', or 'all')
     */
    resetToDefault(type = 'all') {
        if (type === 'balls' || type === 'all') {
            this.applyBallTheme('realFruits');
        }
        
        if (type === 'background' || type === 'all') {
            this.applyBackgroundTheme('default');
        }
    }
}