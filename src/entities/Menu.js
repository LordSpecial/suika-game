import { GAME_CONFIG } from '../utils/Config.js';

export class Menu {
    constructor(scalingSystem) {
        this.scalingSystem = scalingSystem;
        this.menuImages = {};
        this.startButtonBounds = null;
        this.settingsButtonBounds = null;
        this.loadImages();
    }
    
    /**
     * Load all menu-related images
     */
    loadImages() {
        const { images } = GAME_CONFIG.ASSETS;
        const { FRUITS } = GAME_CONFIG;
        
        // Load menu background
        this.menuImages.background = new Image();
        this.menuImages.background.src = images.menuBackground;
        
        // Load start button
        this.menuImages.startButton = new Image();
        this.menuImages.startButton.src = images.startButton;
        
        // Load fruit images
        this.menuImages.fruits = [];
        FRUITS.forEach((fruit, index) => {
            const img = new Image();
            img.src = fruit.img;
            this.menuImages.fruits[index] = img;
        });
    }
    
    /**
     * Render the menu on canvas
     */
    render(ctx, gameWidth, gameHeight) {
        const { MENU, FRUITS } = GAME_CONFIG;
        const scale = this.scalingSystem.getScale();
        
        
        // Clear canvas
        ctx.clearRect(0, 0, gameWidth, gameHeight);
        
        // Draw menu background - adjust position for variable aspect ratios
        const bgSize = MENU.backgroundSize * scale;
        const bgX = gameWidth / 2 - bgSize / 2;
        
        // For very tall screens, position menu higher up
        const aspectRatio = gameWidth / gameHeight;
        const bgYPercent = aspectRatio < 0.5 ? 0.3 : MENU.backgroundY; // Move up on very tall screens
        const bgY = gameHeight * bgYPercent - bgSize / 2;
        
        if (this.menuImages.background.complete) {
            ctx.drawImage(this.menuImages.background, bgX, bgY, bgSize, bgSize);
        }
        
        // Draw fruit circle
        const circleRadius = MENU.circleRadius * scale;
        const centerX = gameWidth / 2;
        const centerY = gameHeight * bgYPercent; // Use same Y position as background
        const fruitRadius = MENU.fruitRadius * scale;
        
        FRUITS.forEach((fruit, index) => {
            const angle = (Math.PI * 2 * index) / FRUITS.length;
            const x = centerX + circleRadius * Math.cos(angle);
            const y = centerY + circleRadius * Math.sin(angle);
            
            if (this.menuImages.fruits[index] && this.menuImages.fruits[index].complete) {
                const fruitSize = fruitRadius * 2;
                ctx.drawImage(
                    this.menuImages.fruits[index],
                    x - fruitRadius,
                    y - fruitRadius,
                    fruitSize,
                    fruitSize
                );
            }
        });
        
        // Draw start button - adjust position for variable aspect ratios
        const buttonWidth = MENU.startButtonWidth * scale;
        const buttonHeight = MENU.startButtonHeight * scale;
        const buttonX = gameWidth / 2 - buttonWidth / 2;
        
        // Position start button lower on tall screens, but not too close to bottom
        const buttonYPercent = aspectRatio < 0.5 ? 
            Math.min(0.8, bgYPercent + 0.35) : // On very tall screens, position relative to menu but not too low
            MENU.startButtonY; // Normal positioning
        const buttonY = gameHeight * buttonYPercent - buttonHeight / 2;
        
        // Store button bounds for click detection
        this.startButtonBounds = {
            x: buttonX,
            y: buttonY,
            width: buttonWidth,
            height: buttonHeight
        };
        
        
        if (this.menuImages.startButton.complete) {
            ctx.drawImage(this.menuImages.startButton, buttonX, buttonY, buttonWidth, buttonHeight);
        }
        
        // Draw settings button (smaller, positioned in corner)
        const settingsButtonSize = 80 * scale;
        const settingsX = gameWidth - settingsButtonSize - (20 * scale);
        const settingsY = 20 * scale;
        
        // Store settings button bounds
        this.settingsButtonBounds = {
            x: settingsX,
            y: settingsY,
            width: settingsButtonSize,
            height: settingsButtonSize
        };
        
        // Draw settings button background
        ctx.fillStyle = '#F5F5DC';
        ctx.fillRect(settingsX, settingsY, settingsButtonSize, settingsButtonSize);
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 3;
        ctx.strokeRect(settingsX, settingsY, settingsButtonSize, settingsButtonSize);
        
        // Draw settings icon (gear shape)
        ctx.fillStyle = '#2C1810';
        ctx.font = `bold ${32 * scale}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('⚙', settingsX + settingsButtonSize/2, settingsY + settingsButtonSize/2 + 8 * scale);
    }
    
    /**
     * Check if a point is within the start button
     */
    isPointInStartButton(x, y) {
        if (!this.startButtonBounds) {
            return false;
        }
        
        const bounds = this.startButtonBounds;
        const isInside = x >= bounds.x && 
                        x <= bounds.x + bounds.width && 
                        y >= bounds.y && 
                        y <= bounds.y + bounds.height;
        
        
        return isInside;
    }
    
    /**
     * Check if a point is within the settings button
     */
    isPointInSettingsButton(x, y) {
        if (!this.settingsButtonBounds) return false;
        
        const bounds = this.settingsButtonBounds;
        return x >= bounds.x && 
               x <= bounds.x + bounds.width && 
               y >= bounds.y && 
               y <= bounds.y + bounds.height;
    }
    
    /**
     * Handle click events on the menu
     */
    handleClick(x, y) {
        
        if (this.isPointInStartButton(x, y)) {
            return 'startGame';
        }
        
        if (this.isPointInSettingsButton(x, y)) {
            return 'openSettings';
        }
        
        return null;
    }
    
    /**
     * Update menu (for animations in the future)
     */
    update(deltaTime) {
        // Future: menu animations, fruit rotations, etc.
    }
}