import { GAME_CONFIG } from '../utils/Config.js';

/**
 * RenderingController - Manages all rendering operations
 * 
 * Handles menu rendering, game UI rendering, canvas setup,
 * and visual updates like score opacity.
 */
export class RenderingController {
    constructor(game) {
        this.game = game;
        this.menuRenderLoop = null;
        this.homeButtonBounds = null;
    }
    
    /**
     * Start menu rendering loop
     */
    startMenuRendering() {
        const canvas = this.game.physics.render.canvas;
        if (!canvas) {
            console.error('Canvas not available for menu rendering');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('Canvas context not available');
            return;
        }
        
        // Render appropriate menu immediately first
        if (this.game.stateMachine.isInState('MENU')) {
            this.game.menu.render(ctx, this.game.gameWidth, this.game.gameHeight);
        } else if (this.game.stateMachine.isInState('SETTINGS')) {
            this.game.settingsMenu.render(ctx, this.game.gameWidth, this.game.gameHeight);
        }
        
        const renderMenu = () => {
            if (this.game.stateMachine.isInState('MENU')) {
                this.game.menu.render(ctx, this.game.gameWidth, this.game.gameHeight);
                requestAnimationFrame(renderMenu);
            } else if (this.game.stateMachine.isInState('SETTINGS')) {
                this.game.settingsMenu.updateScroll();
                this.game.settingsMenu.render(ctx, this.game.gameWidth, this.game.gameHeight);
                requestAnimationFrame(renderMenu);
            } else if (this.game.stateMachine.isInState('READY') || this.game.stateMachine.isInState('DROP')) {
                // Render home button during gameplay
                this.renderHomeButton(ctx);
                requestAnimationFrame(renderMenu);
            }
        };
        
        // Continue with animation loop
        this.menuRenderLoop = renderMenu;
        requestAnimationFrame(renderMenu);
    }
    
    /**
     * Stop menu rendering loop
     */
    stopMenuRendering() {
        // The render loop will stop automatically when state changes
        // since it checks the state in the requestAnimationFrame callback
        this.menuRenderLoop = null;
    }
    
    /**
     * Start settings rendering
     */
    startSettingsRendering() {
        // Settings rendering is handled by the same menu render loop
        // which checks for SETTINGS state
        this.startMenuRendering();
    }
    
    /**
     * Stop settings rendering
     */
    stopSettingsRendering() {
        // Same as stopping menu rendering
        this.stopMenuRendering();
    }
    
    /**
     * Render home button during gameplay
     */
    renderHomeButton(ctx) {
        if (!ctx) return;
        
        const scale = this.game.scalingSystem.getScale();
        const buttonSize = 64 * scale;
        const margin = 20 * scale;
        const x = this.game.gameWidth - buttonSize - margin;
        const y = margin;
        
        // Store button bounds for click detection
        this.game.homeButtonBounds = this.homeButtonBounds = {
            x: x,
            y: y,
            width: buttonSize,
            height: buttonSize
        };
        
        // Draw button background with rounded corners
        const radius = 10 * scale;
        ctx.fillStyle = '#FF8800';
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + buttonSize - radius, y);
        ctx.quadraticCurveTo(x + buttonSize, y, x + buttonSize, y + radius);
        ctx.lineTo(x + buttonSize, y + buttonSize - radius);
        ctx.quadraticCurveTo(x + buttonSize, y + buttonSize, x + buttonSize - radius, y + buttonSize);
        ctx.lineTo(x + radius, y + buttonSize);
        ctx.quadraticCurveTo(x, y + buttonSize, x, y + buttonSize - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
        
        // Draw button border
        ctx.strokeStyle = '#FF6E00';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Draw home icon
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `900 ${32 * scale}px 'Azeret Mono', monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🏠', x + buttonSize/2, y + buttonSize/2);
    }
    
    /**
     * Update score opacity based on fruit position
     */
    updateScoreOpacity(fruitX) {
        if (!this.game.elements.score) return;
        
        const tenPercent = this.game.gameWidth * 0.1;
        const twentyPercent = this.game.gameWidth * 0.2;
        
        if (fruitX <= tenPercent) {
            // Fruit is at 10% or less - minimum opacity of 5%
            this.game.elements.score.style.color = 'rgba(255, 238, 219, 0.05)'; // --col-bg-lighter with 5% opacity
            this.game.elements.score.style.textShadow = '3px 3px 0 rgba(255, 83, 0, 0.05), -3px -3px 0 rgba(255, 83, 0, 0.05), -3px 3px 0 rgba(255, 83, 0, 0.05), 3px -3px 0 rgba(255, 83, 0, 0.05)';
        } else if (fruitX <= twentyPercent) {
            // Fruit is between 10% and 20% - fade from 5% to 100%
            const fadeZone = twentyPercent - tenPercent;
            const positionInFade = fruitX - tenPercent;
            const fadeRatio = positionInFade / fadeZone;
            
            // Linear interpolation from 0.05 (5%) to 1.0 (100%)
            const opacity = 0.05 + (fadeRatio * 0.95);
            this.game.elements.score.style.color = `rgba(255, 238, 219, ${opacity})`;
            this.game.elements.score.style.textShadow = `3px 3px 0 rgba(255, 83, 0, ${opacity}), -3px -3px 0 rgba(255, 83, 0, ${opacity}), -3px 3px 0 rgba(255, 83, 0, ${opacity}), 3px -3px 0 rgba(255, 83, 0, ${opacity})`;
        } else {
            // Fruit is beyond 20% - full opacity, restore original colors
            this.game.elements.score.style.color = 'var(--col-bg-lighter)';
            this.game.elements.score.style.textShadow = '3px 3px 0 var(--col-primary), -3px -3px 0 var(--col-primary), -3px 3px 0 var(--col-primary), 3px -3px 0 var(--col-primary)';
        }
    }
    
    /**
     * Get home button bounds for click detection
     */
    getHomeButtonBounds() {
        return this.homeButtonBounds;
    }
    
    /**
     * Setup canvas for high-DPI rendering
     */
    setupCanvasScaling() {
        if (!this.game.physics.render) return;
        
        const canvas = this.game.physics.render.canvas;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        
        // Set actual canvas size accounting for device pixel ratio
        canvas.width = this.game.gameWidth * dpr;
        canvas.height = this.game.gameHeight * dpr;
        
        // Scale CSS size to maintain visual size
        canvas.style.width = `${this.game.gameWidth}px`;
        canvas.style.height = `${this.game.gameHeight}px`;
        
        // Scale context to ensure correct drawing operations
        if (ctx) {
            ctx.scale(dpr, dpr);
            // Re-enable anti-aliasing after scaling
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
        }
        
        // Ensure crisp rendering
        canvas.style.imageRendering = 'auto';
    }
}