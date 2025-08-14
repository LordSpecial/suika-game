import { UIComponent } from '../UIComponent.js';

/**
 * Button - Clickable UI button component
 * 
 * Provides a clickable button with text or image content,
 * hover effects, and customizable styling.
 */
export class Button extends UIComponent {
    constructor(bounds, text = '', onClick = null) {
        super(bounds);
        
        this.text = text;
        this.onClickCallback = onClick;
        
        // Button states
        this.isHovered = false;
        this.isPressed = false;
        
        // Default button styling
        this.style = {
            ...this.style,
            backgroundColor: '#F5F5DC',
            borderColor: '#8B4513',
            borderWidth: 3,
            borderRadius: 10,
            
            // Text styling
            fontSize: 24,
            fontFamily: "'Azeret Mono', monospace",
            fontWeight: '700',
            textColor: '#2C1810',
            textAlign: 'center',
            
            // State-specific colors
            hoverBackgroundColor: '#FFFACD',
            pressedBackgroundColor: '#F0E68C',
            disabledBackgroundColor: '#D3D3D3',
            disabledTextColor: '#808080'
        };
        
        // Optional image
        this.image = null;
        this.imageScale = 1;
    }
    
    /**
     * Set button text
     * @param {string} text - Button text
     */
    setText(text) {
        this.text = text;
    }
    
    /**
     * Set button image
     * @param {Image} image - Button image
     * @param {number} scale - Image scale
     */
    setImage(image, scale = 1) {
        this.image = image;
        this.imageScale = scale;
    }
    
    /**
     * Set click callback
     * @param {Function} callback - Click callback function
     */
    setOnClick(callback) {
        this.onClickCallback = callback;
    }
    
    /**
     * Update button state
     * @param {number} deltaTime - Time since last update
     */
    update(deltaTime) {
        super.update(deltaTime);
        
        // Additional button-specific updates could go here
        // e.g., animations, hover effects
    }
    
    /**
     * Render button content
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Renderer} renderer - Renderer instance
     */
    renderContent(ctx, renderer) {
        // Determine background color based on state
        let bgColor = this.style.backgroundColor;
        if (!this.enabled) {
            bgColor = this.style.disabledBackgroundColor;
        } else if (this.isPressed) {
            bgColor = this.style.pressedBackgroundColor;
        } else if (this.isHovered) {
            bgColor = this.style.hoverBackgroundColor;
        }
        
        // Override parent's background with state-specific color
        if (bgColor !== this.style.backgroundColor) {
            if (this.style.borderRadius > 0) {
                renderer.fillRoundRect(
                    this.bounds.x,
                    this.bounds.y,
                    this.bounds.width,
                    this.bounds.height,
                    this.style.borderRadius,
                    bgColor
                );
            } else {
                renderer.fillRect(
                    this.bounds.x,
                    this.bounds.y,
                    this.bounds.width,
                    this.bounds.height,
                    bgColor
                );
            }
        }
        
        // Render image if present
        if (this.image) {
            const imgWidth = this.image.width * this.imageScale;
            const imgHeight = this.image.height * this.imageScale;
            const imgX = this.bounds.x + (this.bounds.width - imgWidth) / 2;
            const imgY = this.bounds.y + (this.bounds.height - imgHeight) / 2;
            
            renderer.drawImage(
                this.image,
                imgX,
                imgY,
                imgWidth,
                imgHeight
            );
        }
        
        // Render text
        if (this.text) {
            const textColor = this.enabled ? 
                this.style.textColor : 
                this.style.disabledTextColor;
            
            const textX = this.bounds.x + this.bounds.width / 2;
            const textY = this.bounds.y + this.bounds.height / 2;
            
            renderer.drawText(this.text, textX, textY, {
                font: `${this.style.fontWeight} ${this.style.fontSize}px ${this.style.fontFamily}`,
                fillStyle: textColor,
                textAlign: this.style.textAlign,
                textBaseline: 'middle'
            });
        }
    }
    
    /**
     * Handle mouse move for hover state
     * @param {number} x - Mouse X position
     * @param {number} y - Mouse Y position
     */
    handleMouseMove(x, y) {
        const wasHovered = this.isHovered;
        this.isHovered = this.enabled && this.isPointInside(x, y);
        
        // Return true if hover state changed (for cursor updates)
        return wasHovered !== this.isHovered;
    }
    
    /**
     * Handle mouse down
     * @param {number} x - Mouse X position
     * @param {number} y - Mouse Y position
     * @returns {boolean} True if handled
     */
    handleMouseDown(x, y) {
        if (this.enabled && this.isPointInside(x, y)) {
            this.isPressed = true;
            return true;
        }
        return false;
    }
    
    /**
     * Handle mouse up
     * @param {number} x - Mouse X position
     * @param {number} y - Mouse Y position
     * @returns {boolean} True if handled
     */
    handleMouseUp(x, y) {
        if (this.isPressed) {
            this.isPressed = false;
            
            // Trigger click if mouse is still over button
            if (this.enabled && this.isPointInside(x, y)) {
                this.onClick(x, y);
            }
            
            return true;
        }
        return false;
    }
    
    /**
     * Handle click event
     * @param {number} x - Click X position
     * @param {number} y - Click Y position
     * @returns {boolean} True if handled
     */
    onClick(x, y) {
        if (this.onClickCallback) {
            this.onClickCallback(this);
            return true;
        }
        return false;
    }
}