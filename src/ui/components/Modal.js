import { UIComponent } from '../UIComponent.js';

/**
 * Modal - Popup dialog component
 * 
 * Provides a modal dialog with overlay, title, content area,
 * and customizable buttons.
 */
export class Modal extends UIComponent {
    constructor(bounds) {
        super(bounds);
        
        // Modal properties
        this.title = '';
        this.isOpen = false;
        
        // Overlay properties
        this.showOverlay = true;
        this.overlayColor = 'rgba(0, 0, 0, 0.5)';
        this.overlayClickClose = true;
        
        // Animation properties
        this.animationDuration = 300; // milliseconds
        this.animationProgress = 0;
        this.isAnimating = false;
        this.animationType = 'fade'; // 'fade', 'slide', 'scale'
        
        // Modal styling
        this.style = {
            ...this.style,
            backgroundColor: '#FFFACD',
            borderColor: '#8B4513',
            borderWidth: 4,
            borderRadius: 20,
            
            // Shadow
            shadowColor: 'rgba(0, 0, 0, 0.3)',
            shadowBlur: 20,
            shadowOffsetX: 0,
            shadowOffsetY: 5,
            
            // Title styling
            titleFontSize: 32,
            titleFontWeight: '900',
            titleColor: '#2C1810',
            titleHeight: 60,
            titleBackgroundColor: null,
            titleBorderColor: '#8B4513',
            titleBorderWidth: 2,
            
            // Content padding
            contentPadding: 20
        };
        
        // Title component
        this.titleBounds = {
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            height: this.style.titleHeight
        };
        
        // Content area bounds
        this.contentBounds = {
            x: bounds.x + this.style.contentPadding,
            y: bounds.y + this.style.titleHeight + this.style.contentPadding,
            width: bounds.width - (2 * this.style.contentPadding),
            height: bounds.height - this.style.titleHeight - (2 * this.style.contentPadding)
        };
        
        // Close callback
        this.onCloseCallback = null;
    }
    
    /**
     * Open the modal
     * @param {string} title - Modal title
     */
    open(title = '') {
        if (this.isOpen) return;
        
        this.title = title;
        this.isOpen = true;
        this.visible = true;
        this.isAnimating = true;
        this.animationProgress = 0;
    }
    
    /**
     * Close the modal
     */
    close() {
        if (!this.isOpen) return;
        
        this.isOpen = false;
        this.isAnimating = true;
        this.animationProgress = 1;
        
        if (this.onCloseCallback) {
            this.onCloseCallback();
        }
    }
    
    /**
     * Set close callback
     * @param {Function} callback - Close callback function
     */
    setOnClose(callback) {
        this.onCloseCallback = callback;
    }
    
    /**
     * Update modal animation
     * @param {number} deltaTime - Time since last update
     */
    update(deltaTime) {
        super.update(deltaTime);
        
        if (this.isAnimating) {
            const speed = deltaTime / this.animationDuration;
            
            if (this.isOpen) {
                // Opening animation
                this.animationProgress += speed;
                if (this.animationProgress >= 1) {
                    this.animationProgress = 1;
                    this.isAnimating = false;
                }
            } else {
                // Closing animation
                this.animationProgress -= speed;
                if (this.animationProgress <= 0) {
                    this.animationProgress = 0;
                    this.isAnimating = false;
                    this.visible = false;
                }
            }
        }
    }
    
    /**
     * Render the modal
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Renderer} renderer - Renderer instance
     */
    render(ctx, renderer) {
        if (!this.visible) return;
        
        ctx.save();
        
        // Apply animation
        const progress = this.easeInOutCubic(this.animationProgress);
        
        // Render overlay
        if (this.showOverlay) {
            ctx.save();
            ctx.globalAlpha = progress * 0.5;
            ctx.fillStyle = this.overlayColor;
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.restore();
        }
        
        // Apply animation transform
        this.applyAnimation(ctx, progress);
        
        // Set up shadow
        ctx.shadowColor = this.style.shadowColor;
        ctx.shadowBlur = this.style.shadowBlur;
        ctx.shadowOffsetX = this.style.shadowOffsetX;
        ctx.shadowOffsetY = this.style.shadowOffsetY;
        
        // Render modal background
        renderer.fillRoundRect(
            this.bounds.x,
            this.bounds.y,
            this.bounds.width,
            this.bounds.height,
            this.style.borderRadius,
            this.style.backgroundColor
        );
        
        // Clear shadow for border
        ctx.shadowColor = 'transparent';
        
        // Render modal border
        renderer.strokeRoundRect(
            this.bounds.x,
            this.bounds.y,
            this.bounds.width,
            this.bounds.height,
            this.style.borderRadius,
            this.style.borderColor,
            this.style.borderWidth
        );
        
        // Render title area
        this.renderTitle(ctx, renderer);
        
        // Render content
        this.renderContent(ctx, renderer);
        
        // Render children (buttons, etc.)
        for (const child of this.children) {
            child.render(ctx, renderer);
        }
        
        ctx.restore();
    }
    
    /**
     * Render modal title
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Renderer} renderer - Renderer instance
     */
    renderTitle(ctx, renderer) {
        if (!this.title) return;
        
        // Title background
        if (this.style.titleBackgroundColor) {
            ctx.fillStyle = this.style.titleBackgroundColor;
            ctx.fillRect(
                this.titleBounds.x,
                this.titleBounds.y,
                this.titleBounds.width,
                this.titleBounds.height
            );
        }
        
        // Title border
        if (this.style.titleBorderWidth > 0) {
            ctx.strokeStyle = this.style.titleBorderColor;
            ctx.lineWidth = this.style.titleBorderWidth;
            ctx.beginPath();
            ctx.moveTo(this.bounds.x, this.bounds.y + this.style.titleHeight);
            ctx.lineTo(this.bounds.x + this.bounds.width, this.bounds.y + this.style.titleHeight);
            ctx.stroke();
        }
        
        // Title text
        renderer.drawText(
            this.title,
            this.bounds.x + this.bounds.width / 2,
            this.bounds.y + this.style.titleHeight / 2,
            {
                font: `${this.style.titleFontWeight} ${this.style.titleFontSize}px 'Azeret Mono', monospace`,
                fillStyle: this.style.titleColor,
                textAlign: 'center',
                textBaseline: 'middle'
            }
        );
    }
    
    /**
     * Apply animation transform
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} progress - Animation progress (0-1)
     */
    applyAnimation(ctx, progress) {
        const centerX = this.bounds.x + this.bounds.width / 2;
        const centerY = this.bounds.y + this.bounds.height / 2;
        
        switch (this.animationType) {
            case 'scale':
                ctx.translate(centerX, centerY);
                ctx.scale(progress, progress);
                ctx.translate(-centerX, -centerY);
                break;
                
            case 'slide':
                const slideOffset = (1 - progress) * 100;
                ctx.translate(0, slideOffset);
                break;
                
            case 'fade':
            default:
                ctx.globalAlpha = progress;
                break;
        }
    }
    
    /**
     * Handle click event
     * @param {number} x - Click X position
     * @param {number} y - Click Y position
     * @returns {boolean} True if handled
     */
    handleClick(x, y) {
        if (!this.visible || !this.isOpen || this.isAnimating) return false;
        
        // Check children first
        if (super.handleClick(x, y)) {
            return true;
        }
        
        // Check overlay click
        if (this.showOverlay && this.overlayClickClose && !this.isPointInside(x, y)) {
            this.close();
            return true;
        }
        
        return false;
    }
    
    /**
     * Easing function for animations
     * @param {number} t - Progress (0-1)
     * @returns {number} Eased progress
     */
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
}