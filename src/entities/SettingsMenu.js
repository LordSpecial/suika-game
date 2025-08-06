import { GAME_CONFIG } from '../utils/Config.js';

export class SettingsMenu {
    constructor(scalingSystem, settings) {
        this.scalingSystem = scalingSystem;
        this.settings = settings;
        this.menuImages = {};
        this.currentView = 'main'; // main, themes
        this.currentThemeCategory = null; // balls, background, sounds
        this.clickableElements = [];
        
        this.loadImages();
    }
    
    /**
     * Load menu images
     */
    loadImages() {
        // Load basic UI elements
        this.menuImages.background = new Image();
        this.menuImages.background.src = GAME_CONFIG.ASSETS.images.menuBackground;
        
        this.menuImages.button = new Image();
        this.menuImages.button.src = GAME_CONFIG.ASSETS.images.startButton;
    }
    
    /**
     * Render the settings menu
     */
    render(ctx, gameWidth, gameHeight) {
        const scale = this.scalingSystem.getScale();
        this.clickableElements = [];
        
        // Clear canvas
        ctx.clearRect(0, 0, gameWidth, gameHeight);
        
        // Draw background
        const bgSize = GAME_CONFIG.MENU.backgroundSize * scale;
        const bgX = gameWidth / 2 - bgSize / 2;
        const bgY = gameHeight * 0.1;
        
        if (this.menuImages.background.complete) {
            ctx.drawImage(this.menuImages.background, bgX, bgY, bgSize, bgSize);
        }
        
        if (this.currentView === 'main') {
            this.renderMainSettings(ctx, gameWidth, gameHeight, scale);
        } else if (this.currentView === 'themes') {
            this.renderThemeSettings(ctx, gameWidth, gameHeight, scale);
        }
    }
    
    /**
     * Render main settings view
     */
    renderMainSettings(ctx, gameWidth, gameHeight, scale) {
        const centerX = gameWidth / 2;
        let currentY = gameHeight * 0.35;
        const buttonHeight = 64 * scale;
        const buttonWidth = 400 * scale;
        const spacing = 20 * scale;
        
        // Title
        ctx.fillStyle = '#2C1810';
        ctx.font = `900 ${32 * scale}px 'Azeret Mono', monospace`;
        ctx.textAlign = 'center';
        ctx.fillText('Settings', centerX, currentY);
        
        currentY += 60 * scale;
        
        // Themes button
        this.drawButton(ctx, centerX - buttonWidth/2, currentY, buttonWidth, buttonHeight, 'Themes', 'themes');
        currentY += buttonHeight + spacing;
        
        // Physics settings title
        ctx.font = `700 ${24 * scale}px 'Azeret Mono', monospace`;
        ctx.fillText('Physics', centerX, currentY + 20 * scale);
        currentY += 50 * scale;
        
        // Physics controls
        this.renderPhysicsControls(ctx, centerX, currentY, scale);
        
        // Back button
        currentY = gameHeight * 0.85;
        this.drawButton(ctx, centerX - buttonWidth/2, currentY, buttonWidth, buttonHeight, 'Back to Menu', 'back');
    }
    
    /**
     * Render physics controls
     */
    renderPhysicsControls(ctx, centerX, startY, scale) {
        const physics = this.settings.settings.physics;
        const presetNames = this.settings.getPhysicsPresetNames();
        const controlSpacing = 80 * scale;
        const buttonSize = 40 * scale;
        const buttonSpacing = 60 * scale;
        
        let currentY = startY;
        
        ['bounciness', 'gravity', 'friction'].forEach(type => {
            // Label
            ctx.fillStyle = '#2C1810';
            ctx.font = `700 ${18 * scale}px 'Azeret Mono', monospace`;
            ctx.textAlign = 'center';
            ctx.fillText(type.charAt(0).toUpperCase() + type.slice(1), centerX, currentY);
            
            // Three option buttons
            for (let i = 0; i < 3; i++) {
                const x = centerX - buttonSpacing + (i * buttonSpacing);
                const y = currentY + 15 * scale;
                const isSelected = physics[type] === i;
                
                // Button background
                ctx.fillStyle = isSelected ? '#4CAF50' : '#E0E0E0';
                ctx.fillRect(x - buttonSize/2, y, buttonSize, buttonSize);
                
                // Button border
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 2;
                ctx.strokeRect(x - buttonSize/2, y, buttonSize, buttonSize);
                
                // Button text
                ctx.fillStyle = isSelected ? '#FFF' : '#333';
                ctx.font = `700 ${12 * scale}px 'Azeret Mono', monospace`;
                ctx.textAlign = 'center';
                ctx.fillText(presetNames[type][i], x, y + buttonSize/2 + 4 * scale);
                
                // Store clickable area
                this.clickableElements.push({
                    x: x - buttonSize/2,
                    y: y,
                    width: buttonSize,
                    height: buttonSize,
                    action: 'physics',
                    type: type,
                    value: i
                });
            }
            
            currentY += controlSpacing;
        });
    }
    
    /**
     * Render theme settings view
     */
    renderThemeSettings(ctx, gameWidth, gameHeight, scale) {
        const centerX = gameWidth / 2;
        let currentY = gameHeight * 0.3;
        const buttonHeight = 64 * scale;
        const buttonWidth = 300 * scale;
        const spacing = 20 * scale;
        
        // Title
        ctx.fillStyle = '#2C1810';
        ctx.font = `900 ${32 * scale}px 'Azeret Mono', monospace`;
        ctx.textAlign = 'center';
        ctx.fillText('Themes', centerX, currentY);
        
        currentY += 60 * scale;
        
        // Ball theme selector
        const currentBallSelection = this.settings.settings.theme.balls;
        const ballDisplayName = this.getThemeDisplayName('balls', currentBallSelection);
        
        this.drawButton(
            ctx, 
            centerX - buttonWidth/2, 
            currentY, 
            buttonWidth, 
            buttonHeight, 
            `Ball Theme: ${ballDisplayName}`,
            'theme_category',
            'balls'
        );
        currentY += buttonHeight + spacing;
        
        // Background theme selector
        const currentBgSelection = this.settings.settings.theme.background;
        const bgDisplayName = this.getThemeDisplayName('background', currentBgSelection);
        
        this.drawButton(
            ctx, 
            centerX - buttonWidth/2, 
            currentY, 
            buttonWidth, 
            buttonHeight, 
            `Background: ${bgDisplayName}`,
            'theme_category',
            'background'
        );
        currentY += buttonHeight + spacing;
        
        // Back button
        currentY = gameHeight * 0.8;
        this.drawButton(ctx, centerX - buttonWidth/2, currentY, buttonWidth, buttonHeight, 'Back', 'back_to_main');
    }
    
    /**
     * Draw a clickable button
     */
    drawButton(ctx, x, y, width, height, text, action, data = null) {
        // Button background
        ctx.fillStyle = '#F5F5DC';
        ctx.fillRect(x, y, width, height);
        
        // Button border
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);
        
        // Button text
        ctx.fillStyle = '#2C1810';
        ctx.font = `700 ${18 * this.scalingSystem.getScale()}px 'Azeret Mono', monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(text, x + width/2, y + height/2 + 6);
        
        // Store clickable area
        this.clickableElements.push({
            x: x,
            y: y,
            width: width,
            height: height,
            action: action,
            data: data
        });
    }
    
    /**
     * Get display name for theme option
     */
    getThemeDisplayName(category, value) {
        const mapping = {
            balls: { realFruits: 'Real Fruits', cartoonFruits: 'Cartoon Fruits', planets: 'Planets' },
            background: { default: 'Default', space: 'Space' },
            sounds: { default: 'Default' }
        };
        
        return mapping[category][value] || value;
    }
    
    /**
     * Handle click events
     */
    handleClick(x, y) {
        for (const element of this.clickableElements) {
            if (x >= element.x && x <= element.x + element.width &&
                y >= element.y && y <= element.y + element.height) {
                
                return this.processAction(element);
            }
        }
        return null;
    }
    
    /**
     * Process button actions
     */
    processAction(element) {
        switch (element.action) {
            case 'themes':
                this.currentView = 'themes';
                return 'refresh';
                
            case 'theme_category':
                return this.cycleThemeOption(element.data);
                
            case 'physics':
                this.settings.setPhysics(element.type, element.value);
                return 'physics_changed';
                
            case 'back':
                return 'back_to_menu';
                
            case 'back_to_main':
                this.currentView = 'main';
                return 'refresh';
                
            default:
                return null;
        }
    }
    
    /**
     * Cycle through theme options
     */
    cycleThemeOption(category) {
        const options = {
            balls: ['realFruits', 'cartoonFruits', 'planets'],
            background: ['default', 'space'],
            sounds: ['default']
        };
        
        const currentValue = this.settings.settings.theme[category];
        const currentIndex = options[category].indexOf(currentValue);
        const nextIndex = (currentIndex + 1) % options[category].length;
        const nextValue = options[category][nextIndex];
        
        this.settings.setTheme(category, nextValue);
        return 'theme_changed';
    }
    
    /**
     * Reset to main view
     */
    resetView() {
        this.currentView = 'main';
        this.currentThemeCategory = null;
    }
}