import { UIComponent } from '../UIComponent.js';

/**
 * Label - Text display UI component
 * 
 * Provides a simple text label with customizable styling.
 */
export class Label extends UIComponent {
    constructor(bounds, text = '') {
        super(bounds);
        
        this.text = text;
        
        // Default label styling
        this.style = {
            ...this.style,
            fontSize: 16,
            fontFamily: "'Azeret Mono', monospace",
            fontWeight: '400',
            textColor: '#333333',
            textAlign: 'left',
            textBaseline: 'top',
            
            // Text shadow
            textShadow: null,
            shadowOffsetX: 0,
            shadowOffsetY: 0,
            shadowBlur: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
        };
    }
    
    /**
     * Set label text
     * @param {string} text - Label text
     */
    setText(text) {
        this.text = text;
    }
    
    /**
     * Set text color
     * @param {string} color - Text color
     */
    setTextColor(color) {
        this.style.textColor = color;
    }
    
    /**
     * Set font size
     * @param {number} size - Font size in pixels
     */
    setFontSize(size) {
        this.style.fontSize = size;
    }
    
    /**
     * Set text alignment
     * @param {string} align - Text alignment (left, center, right)
     */
    setTextAlign(align) {
        this.style.textAlign = align;
    }
    
    /**
     * Set text shadow
     * @param {Object} shadow - Shadow configuration
     */
    setTextShadow(shadow) {
        if (shadow) {
            this.style.textShadow = true;
            this.style.shadowOffsetX = shadow.offsetX || 0;
            this.style.shadowOffsetY = shadow.offsetY || 0;
            this.style.shadowBlur = shadow.blur || 0;
            this.style.shadowColor = shadow.color || 'rgba(0, 0, 0, 0.5)';
        } else {
            this.style.textShadow = null;
        }
    }
    
    /**
     * Render label content
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Renderer} renderer - Renderer instance
     */
    renderContent(ctx, renderer) {
        if (!this.text) return;
        
        // Calculate text position based on alignment
        let textX = this.bounds.x;
        const textY = this.bounds.y;
        
        switch (this.style.textAlign) {
            case 'center':
                textX = this.bounds.x + this.bounds.width / 2;
                break;
            case 'right':
                textX = this.bounds.x + this.bounds.width;
                break;
            case 'left':
            default:
                textX = this.bounds.x;
                break;
        }
        
        // Adjust Y position based on baseline
        let adjustedY = textY;
        if (this.style.textBaseline === 'middle') {
            adjustedY = textY + this.bounds.height / 2;
        } else if (this.style.textBaseline === 'bottom') {
            adjustedY = textY + this.bounds.height;
        }
        
        // Apply text shadow if configured
        if (this.style.textShadow) {
            ctx.save();
            ctx.shadowOffsetX = this.style.shadowOffsetX;
            ctx.shadowOffsetY = this.style.shadowOffsetY;
            ctx.shadowBlur = this.style.shadowBlur;
            ctx.shadowColor = this.style.shadowColor;
        }
        
        // Render text
        renderer.drawText(this.text, textX, adjustedY, {
            font: `${this.style.fontWeight} ${this.style.fontSize}px ${this.style.fontFamily}`,
            fillStyle: this.style.textColor,
            textAlign: this.style.textAlign,
            textBaseline: this.style.textBaseline
        });
        
        if (this.style.textShadow) {
            ctx.restore();
        }
    }
}