/**
 * UIComponent - Base class for all UI components
 * 
 * Provides common functionality for UI elements including
 * rendering, click handling, and bounds checking.
 */
export class UIComponent {
    constructor(bounds = {}) {
        this.bounds = {
            x: bounds.x || 0,
            y: bounds.y || 0,
            width: bounds.width || 0,
            height: bounds.height || 0
        };
        
        this.visible = true;
        this.enabled = true;
        this.children = [];
        this.parent = null;
        
        // Style properties
        this.style = {
            backgroundColor: null,
            borderColor: null,
            borderWidth: 0,
            borderRadius: 0,
            opacity: 1
        };
    }
    
    /**
     * Set bounds of the component
     * @param {Object} bounds - New bounds {x, y, width, height}
     */
    setBounds(bounds) {
        Object.assign(this.bounds, bounds);
    }
    
    /**
     * Add a child component
     * @param {UIComponent} child - Child component to add
     */
    addChild(child) {
        if (child.parent) {
            child.parent.removeChild(child);
        }
        
        this.children.push(child);
        child.parent = this;
    }
    
    /**
     * Remove a child component
     * @param {UIComponent} child - Child component to remove
     */
    removeChild(child) {
        const index = this.children.indexOf(child);
        if (index !== -1) {
            this.children.splice(index, 1);
            child.parent = null;
        }
    }
    
    /**
     * Update component state
     * @param {number} deltaTime - Time since last update
     */
    update(deltaTime) {
        // Update children
        for (const child of this.children) {
            if (child.visible) {
                child.update(deltaTime);
            }
        }
    }
    
    /**
     * Render the component
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Renderer} renderer - Renderer instance
     */
    render(ctx, renderer) {
        if (!this.visible) return;
        
        ctx.save();
        
        // Apply opacity
        if (this.style.opacity < 1) {
            ctx.globalAlpha = this.style.opacity;
        }
        
        // Render background
        if (this.style.backgroundColor) {
            if (this.style.borderRadius > 0) {
                renderer.fillRoundRect(
                    this.bounds.x,
                    this.bounds.y,
                    this.bounds.width,
                    this.bounds.height,
                    this.style.borderRadius,
                    this.style.backgroundColor
                );
            } else {
                renderer.fillRect(
                    this.bounds.x,
                    this.bounds.y,
                    this.bounds.width,
                    this.bounds.height,
                    this.style.backgroundColor
                );
            }
        }
        
        // Render border
        if (this.style.borderWidth > 0 && this.style.borderColor) {
            if (this.style.borderRadius > 0) {
                renderer.strokeRoundRect(
                    this.bounds.x,
                    this.bounds.y,
                    this.bounds.width,
                    this.bounds.height,
                    this.style.borderRadius,
                    this.style.borderColor,
                    this.style.borderWidth
                );
            } else {
                renderer.strokeRect(
                    this.bounds.x,
                    this.bounds.y,
                    this.bounds.width,
                    this.bounds.height,
                    this.style.borderColor,
                    this.style.borderWidth
                );
            }
        }
        
        // Render component-specific content
        this.renderContent(ctx, renderer);
        
        // Render children
        for (const child of this.children) {
            child.render(ctx, renderer);
        }
        
        ctx.restore();
    }
    
    /**
     * Render component-specific content
     * Override in subclasses
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Renderer} renderer - Renderer instance
     */
    renderContent(ctx, renderer) {
        // Override in subclasses
    }
    
    /**
     * Handle click event
     * @param {number} x - Click X position
     * @param {number} y - Click Y position
     * @returns {boolean} True if click was handled
     */
    handleClick(x, y) {
        if (!this.enabled || !this.visible) return false;
        
        // Check children first (top to bottom)
        for (let i = this.children.length - 1; i >= 0; i--) {
            const child = this.children[i];
            if (child.handleClick(x, y)) {
                return true;
            }
        }
        
        // Check this component
        if (this.isPointInside(x, y)) {
            return this.onClick(x, y);
        }
        
        return false;
    }
    
    /**
     * Called when component is clicked
     * Override in subclasses
     * @param {number} x - Click X position
     * @param {number} y - Click Y position
     * @returns {boolean} True if click was handled
     */
    onClick(x, y) {
        return false;
    }
    
    /**
     * Check if point is inside component bounds
     * @param {number} x - X position
     * @param {number} y - Y position
     * @returns {boolean} True if point is inside
     */
    isPointInside(x, y) {
        return x >= this.bounds.x && 
               x <= this.bounds.x + this.bounds.width &&
               y >= this.bounds.y && 
               y <= this.bounds.y + this.bounds.height;
    }
    
    /**
     * Get absolute position (accounting for parent positions)
     * @returns {Object} Absolute position {x, y}
     */
    getAbsolutePosition() {
        let x = this.bounds.x;
        let y = this.bounds.y;
        
        let parent = this.parent;
        while (parent) {
            x += parent.bounds.x;
            y += parent.bounds.y;
            parent = parent.parent;
        }
        
        return { x, y };
    }
    
    /**
     * Show the component
     */
    show() {
        this.visible = true;
    }
    
    /**
     * Hide the component
     */
    hide() {
        this.visible = false;
    }
    
    /**
     * Enable the component
     */
    enable() {
        this.enabled = true;
    }
    
    /**
     * Disable the component
     */
    disable() {
        this.enabled = false;
    }
}