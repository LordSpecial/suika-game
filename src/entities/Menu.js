import { GAME_CONFIG } from '../utils/Config.js';
import { Renderer } from '../rendering/Renderer.js';

export class Menu {
    constructor(scalingSystem, settings) {
        this.scalingSystem = scalingSystem;
        this.settings = settings;
        this.menuImages = {};
        this.ballImages = {};  // Separate property for ball images
        this.startButtonBounds = null;
        this.settingsButtonBounds = null;
        this.muteButtonBounds = null;
        this.renderer = null; // Will be set when render is called
    }
    
    /**
     * Render the menu on canvas
     */
    render(ctx, gameWidth, gameHeight) {
        // Create renderer if needed
        if (!this.renderer) {
            this.renderer = new Renderer(ctx.canvas, this.scalingSystem);
        }
        
        const { MENU, BALLS } = GAME_CONFIG;
        const scale = this.scalingSystem.getScale();
        
        // Clear canvas
        this.renderer.clear();
        
        // Draw menu background - adjust position for variable aspect ratios
        const bgSize = MENU.backgroundSize * scale;
        const bgX = gameWidth / 2 - bgSize / 2;
        
        // For very tall screens, position menu higher up
        const aspectRatio = gameWidth / gameHeight;
        const bgYPercent = aspectRatio < 0.5 ? 0.3 : MENU.backgroundY; // Move up on very tall screens
        const bgY = gameHeight * bgYPercent - bgSize / 2;
        
        if (this.menuImages.background && this.menuImages.background.complete) {
            this.renderer.drawImage(this.menuImages.background, bgX, bgY, bgSize, bgSize);
        }
        
        // Draw ball circle
        const circleRadius = MENU.circleRadius * scale;
        const centerX = gameWidth / 2;
        const centerY = gameHeight * bgYPercent; // Use same Y position as background
        const ballRadius = MENU.ballRadius * scale;
        
        BALLS.forEach((ball, index) => {
            const angle = (Math.PI * 2 * index) / BALLS.length;
            const x = centerX + circleRadius * Math.cos(angle);
            const y = centerY + circleRadius * Math.sin(angle);
            
            if (this.ballImages && this.ballImages[index] && this.ballImages[index].complete) {
                const ballSize = ballRadius * 2;
                this.renderer.drawImageCentered(
                    this.ballImages[index],
                    x,
                    y,
                    ballSize,
                    ballSize
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
        
        
        if (this.menuImages.startButton && this.menuImages.startButton.complete) {
            this.renderer.drawImage(this.menuImages.startButton, buttonX, buttonY, buttonWidth, buttonHeight);
        }
        
        // Draw mute and settings buttons (positioned in top-right corner)
        const buttonSize = 80 * scale;
        const buttonSpacing = 20 * scale;
        const margin = 20 * scale;
        
        // Mute button (left of settings button)
        const muteX = gameWidth - (2 * buttonSize) - (2 * buttonSpacing) - margin;
        const muteY = margin;
        
        // Store mute button bounds
        this.muteButtonBounds = {
            x: muteX,
            y: muteY,
            width: buttonSize,
            height: buttonSize
        };
        
        // Draw mute button background
        const isMuted = this.settings && this.settings.isMuted();
        const buttonRadius = 10 * scale;
        this.renderer.fillRoundRect(muteX, muteY, buttonSize, buttonSize, buttonRadius, isMuted ? '#CC6600' : '#FF8800');
        this.renderer.strokeRoundRect(muteX, muteY, buttonSize, buttonSize, buttonRadius, '#FF6E00', 3);
        
        // Draw mute icon
        const muteIcon = isMuted ? '🔇' : '🔊';
        this.renderer.drawText(muteIcon, muteX + buttonSize/2, muteY + buttonSize/2, {
            font: `900 ${34 * scale}px 'Azeret Mono', monospace`,  // Increased from 28
            fillStyle: '#FFFFFF',
            textAlign: 'center',
            textBaseline: 'middle'
        });
        
        // Settings button (right of mute button)
        const settingsX = gameWidth - buttonSize - margin;
        const settingsY = margin;
        
        // Store settings button bounds
        this.settingsButtonBounds = {
            x: settingsX,
            y: settingsY,
            width: buttonSize,
            height: buttonSize
        };
        
        // Draw settings button background
        this.renderer.fillRoundRect(settingsX, settingsY, buttonSize, buttonSize, buttonRadius, '#FF8800');
        this.renderer.strokeRoundRect(settingsX, settingsY, buttonSize, buttonSize, buttonRadius, '#FF6E00', 3);
        
        // Draw settings icon (gear shape)
        this.renderer.drawText('⚙', settingsX + buttonSize/2, settingsY + buttonSize/2, {
            font: `900 ${38 * scale}px 'Azeret Mono', monospace`,  // Increased from 32
            fillStyle: '#FFFFFF',
            textAlign: 'center',
            textBaseline: 'middle'
        });
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
     * Check if a point is within the mute button
     */
    isPointInMuteButton(x, y) {
        if (!this.muteButtonBounds) return false;
        
        const bounds = this.muteButtonBounds;
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
        
        if (this.isPointInMuteButton(x, y)) {
            return 'toggleMute';
        }
        
        return null;
    }
    
    /**
     * Update menu (for animations in the future)
     */
    update(deltaTime) {
        // Future: menu animations, ball rotations, etc.
    }
}