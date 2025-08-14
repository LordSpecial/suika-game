import { GAME_CONFIG } from '../utils/Config.js';
import { Renderer } from '../rendering/Renderer.js';

export class SettingsMenu {
    constructor(scalingSystem, settings) {
        this.scalingSystem = scalingSystem;
        this.settings = settings;
        this.menuImages = {};
        this.currentView = 'main'; // main, themes
        this.currentThemeCategory = null; // balls, background, sounds
        this.clickableElements = [];
        this.renderer = null; // Will be set when render is called
    }
    
    /**
     * Render the settings menu
     */
    render(ctx, gameWidth, gameHeight) {
        // Create renderer if needed
        if (!this.renderer) {
            this.renderer = new Renderer(ctx.canvas, this.scalingSystem);
        }
        
        const scale = this.scalingSystem.getScale();
        this.clickableElements = [];
        
        // Clear canvas
        this.renderer.clear();
        
        // No background image in settings
        
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
        let currentY = gameHeight * 0.2;
        const buttonHeight = 64 * scale;
        const buttonWidth = Math.min(400 * scale, gameWidth * 0.8);  // Responsive width
        const spacing = 20 * scale;
        
        // Title with outline
        this.renderer.drawTextWithOutline('Settings', centerX, currentY, {
            font: `900 ${38 * scale}px 'Azeret Mono', monospace`,  // Increased from 32
            fillStyle: '#FFFFFF',
            textAlign: 'center',
            textBaseline: 'middle',
            outlineColor: '#000000',
            outlineWidth: 3
        });
        
        currentY += 60 * scale;
        
        // Themes button
        this.drawButton(ctx, centerX - buttonWidth/2, currentY, buttonWidth, buttonHeight, 'Themes', 'themes');
        currentY += buttonHeight + spacing + (30 * scale);  // Extra spacing before Physics section
        
        // Physics settings title with outline
        this.renderer.drawTextWithOutline('Physics', centerX, currentY + 20 * scale, {
            font: `700 ${29 * scale}px 'Azeret Mono', monospace`,  // Increased from 24
            fillStyle: '#FFFFFF',
            textAlign: 'center',
            textBaseline: 'middle',
            outlineColor: '#000000',
            outlineWidth: 2
        });
        currentY += 50 * scale;
        
        // Physics controls
        this.renderPhysicsControls(ctx, centerX, currentY, scale, gameWidth);
        
        // Back button
        currentY = gameHeight * 0.85;
        this.drawButton(ctx, centerX - buttonWidth/2, currentY, buttonWidth, buttonHeight, 'Back to Menu', 'back');
    }
    
    /**
     * Render physics controls
     */
    renderPhysicsControls(ctx, centerX, startY, scale, gameWidth) {
        const physics = this.settings.settings.physics;
        const presetNames = this.settings.getPhysicsPresetNames();
        const controlSpacing = 110 * scale;  // Extra vertical spacing
        const buttonSize = 60 * scale;  // Increased from 40
        const buttonSpacing = Math.min(90 * scale, gameWidth / 5);  // Responsive spacing, increased
        
        let currentY = startY;
        
        ['bounciness', 'gravity', 'friction'].forEach(type => {
            // Label with outline
            this.renderer.drawTextWithOutline(type.charAt(0).toUpperCase() + type.slice(1), centerX, currentY, {
                font: `700 ${22 * scale}px 'Azeret Mono', monospace`,  // Increased from 18
                fillStyle: '#FFFFFF',
                textAlign: 'center',
                textBaseline: 'middle',
                outlineColor: '#000000',
                outlineWidth: 2
            });
            
            // Three option buttons
            for (let i = 0; i < 3; i++) {
                const x = centerX - buttonSpacing + (i * buttonSpacing);
                const y = currentY + 15 * scale;
                const isSelected = physics[type] === i;
                
                // Button background with rounded corners
                const smallRadius = 5 * scale;
                this.renderer.fillRoundRect(x - buttonSize/2, y, buttonSize, buttonSize, smallRadius, isSelected ? '#FF8800' : '#E0E0E0');
                
                // Button border with rounded corners
                this.renderer.strokeRoundRect(x - buttonSize/2, y, buttonSize, buttonSize, smallRadius, isSelected ? '#FF6E00' : '#CCC', 2);
                
                // Button text
                this.renderer.drawText(presetNames[type][i], x, y + buttonSize/2, {
                    font: `700 ${14 * scale}px 'Azeret Mono', monospace`,  // Increased from 12
                    fillStyle: isSelected ? '#FFFFFF' : '#333',
                    textAlign: 'center',
                    textBaseline: 'middle'
                });
                
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
            
            // Add extra spacing between different physics settings
            if (type !== 'friction') {
                currentY += 20 * scale;
            }
        });
    }
    
    /**
     * Render theme settings view
     */
    renderThemeSettings(ctx, gameWidth, gameHeight, scale) {
        const centerX = gameWidth / 2;
        let currentY = gameHeight * 0.15;
        const buttonHeight = 64 * scale;
        const buttonWidth = gameWidth * 0.8;  // Use 80% of window width
        const spacing = 20 * scale;
        
        // Title with outline
        this.renderer.drawTextWithOutline('Themes', centerX, currentY, {
            font: `900 ${38 * scale}px 'Azeret Mono', monospace`,  // Increased from 32
            fillStyle: '#FFFFFF',
            textAlign: 'center',
            textBaseline: 'middle',
            outlineColor: '#000000',
            outlineWidth: 3
        });
        
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
        const borderRadius = 10 * this.scalingSystem.getScale();
        
        // Button background with rounded corners
        this.renderer.fillRoundRect(x, y, width, height, borderRadius, '#FF8800');
        
        // Button border with rounded corners
        this.renderer.strokeRoundRect(x, y, width, height, borderRadius, '#FF6E00', 3);
        
        // Button text
        this.renderer.drawText(text, x + width/2, y + height/2, {
            font: `700 ${22 * this.scalingSystem.getScale()}px 'Azeret Mono', monospace`,  // Increased from 18
            fillStyle: '#FFFFFF',
            textAlign: 'center',
            textBaseline: 'middle'
        });
        
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
            balls: { 
                realFruits: 'Real Fruits', 
                cartoonFruits: 'Cartoon Fruits', 
                planets: 'Planets',
                buttons: 'Buttons',
                iceCream: 'Ice Cream'
            },
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
            balls: ['realFruits', 'cartoonFruits', 'planets', 'buttons', 'iceCream'],
            background: ['default', 'space', 'chalky', 'patches', 'paua', 'rainbow', 'skelly', 'stars', 'cottonee', 'fishies', 'whimsigoth'],
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