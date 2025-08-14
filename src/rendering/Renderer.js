/**
 * Renderer - Abstract rendering interface
 * 
 * Provides a clean abstraction over canvas rendering operations.
 * This allows us to decouple rendering logic from game logic.
 */
export class Renderer {
    constructor(canvas, scalingSystem) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.scalingSystem = scalingSystem;
        
        // Enable high-quality rendering
        this.setupContext();
        
        // Cache for performance
        this.textMeasureCache = new Map();
    }
    
    /**
     * Setup context for high-quality rendering
     * @private
     */
    setupContext() {
        if (!this.ctx) return;
        
        // Enable image smoothing
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        
        // Set default text properties
        this.ctx.textBaseline = 'middle';
        this.ctx.textAlign = 'center';
    }
    
    /**
     * Clear the entire canvas
     */
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    /**
     * Clear a specific rectangle
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Width
     * @param {number} height - Height
     */
    clearRect(x, y, width, height) {
        this.ctx.clearRect(x, y, width, height);
    }
    
    /**
     * Draw an image
     * @param {Image} image - Image to draw
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Width
     * @param {number} height - Height
     */
    drawImage(image, x, y, width, height) {
        if (!image || !image.complete) return;
        
        this.ctx.drawImage(image, x, y, width, height);
    }
    
    /**
     * Draw an image with source rectangle (for sprites)
     * @param {Image} image - Image to draw
     * @param {Object} source - Source rectangle {x, y, width, height}
     * @param {Object} dest - Destination rectangle {x, y, width, height}
     */
    drawImageRect(image, source, dest) {
        if (!image || !image.complete) return;
        
        this.ctx.drawImage(
            image,
            source.x, source.y, source.width, source.height,
            dest.x, dest.y, dest.width, dest.height
        );
    }
    
    /**
     * Draw an image centered at position
     * @param {Image} image - Image to draw
     * @param {number} centerX - Center X position
     * @param {number} centerY - Center Y position
     * @param {number} width - Width
     * @param {number} height - Height
     */
    drawImageCentered(image, centerX, centerY, width, height) {
        this.drawImage(image, centerX - width/2, centerY - height/2, width, height);
    }
    
    /**
     * Draw text
     * @param {string} text - Text to draw
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {Object} style - Text style options
     */
    drawText(text, x, y, style = {}) {
        this.ctx.save();
        
        // Apply style
        if (style.font) this.ctx.font = style.font;
        if (style.fillStyle) this.ctx.fillStyle = style.fillStyle;
        if (style.strokeStyle) this.ctx.strokeStyle = style.strokeStyle;
        if (style.lineWidth) this.ctx.lineWidth = style.lineWidth;
        if (style.textAlign) this.ctx.textAlign = style.textAlign;
        if (style.textBaseline) this.ctx.textBaseline = style.textBaseline;
        if (style.shadowColor) this.ctx.shadowColor = style.shadowColor;
        if (style.shadowBlur) this.ctx.shadowBlur = style.shadowBlur;
        if (style.shadowOffsetX) this.ctx.shadowOffsetX = style.shadowOffsetX;
        if (style.shadowOffsetY) this.ctx.shadowOffsetY = style.shadowOffsetY;
        
        // Draw text
        if (style.stroke) {
            this.ctx.strokeText(text, x, y);
        }
        if (style.fill !== false) { // Default to fill
            this.ctx.fillText(text, x, y);
        }
        
        this.ctx.restore();
    }
    
    /**
     * Draw text with outline
     * @param {string} text - Text to draw
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {Object} style - Text style options
     */
    drawTextWithOutline(text, x, y, style = {}) {
        const outlineStyle = {
            ...style,
            fillStyle: style.outlineColor || '#000',
            fill: true,
            stroke: false
        };
        
        // Draw outline by rendering text multiple times
        const outlineWidth = style.outlineWidth || 2;
        for (let ox = -outlineWidth; ox <= outlineWidth; ox++) {
            for (let oy = -outlineWidth; oy <= outlineWidth; oy++) {
                if (ox !== 0 || oy !== 0) {
                    this.drawText(text, x + ox, y + oy, outlineStyle);
                }
            }
        }
        
        // Draw main text
        this.drawText(text, x, y, style);
    }
    
    /**
     * Draw a filled rectangle
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Width
     * @param {number} height - Height
     * @param {string} fillStyle - Fill color/pattern
     */
    fillRect(x, y, width, height, fillStyle) {
        this.ctx.save();
        this.ctx.fillStyle = fillStyle;
        this.ctx.fillRect(x, y, width, height);
        this.ctx.restore();
    }
    
    /**
     * Draw a stroked rectangle
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Width
     * @param {number} height - Height
     * @param {string} strokeStyle - Stroke color
     * @param {number} lineWidth - Line width
     */
    strokeRect(x, y, width, height, strokeStyle, lineWidth = 1) {
        this.ctx.save();
        this.ctx.strokeStyle = strokeStyle;
        this.ctx.lineWidth = lineWidth;
        this.ctx.strokeRect(x, y, width, height);
        this.ctx.restore();
    }
    
    /**
     * Draw a rounded rectangle
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Width
     * @param {number} height - Height
     * @param {number} radius - Corner radius
     * @param {Object} style - Style options {fillStyle, strokeStyle, lineWidth}
     */
    drawRoundedRect(x, y, width, height, radius, style = {}) {
        this.ctx.save();
        
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
        
        if (style.fillStyle) {
            this.ctx.fillStyle = style.fillStyle;
            this.ctx.fill();
        }
        
        if (style.strokeStyle) {
            this.ctx.strokeStyle = style.strokeStyle;
            this.ctx.lineWidth = style.lineWidth || 1;
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }
    
    /**
     * Draw a circle
     * @param {number} x - Center X position
     * @param {number} y - Center Y position
     * @param {number} radius - Radius
     * @param {Object} style - Style options {fillStyle, strokeStyle, lineWidth}
     */
    drawCircle(x, y, radius, style = {}) {
        this.ctx.save();
        
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        
        if (style.fillStyle) {
            this.ctx.fillStyle = style.fillStyle;
            this.ctx.fill();
        }
        
        if (style.strokeStyle) {
            this.ctx.strokeStyle = style.strokeStyle;
            this.ctx.lineWidth = style.lineWidth || 1;
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }
    
    /**
     * Draw a line
     * @param {number} x1 - Start X
     * @param {number} y1 - Start Y
     * @param {number} x2 - End X
     * @param {number} y2 - End Y
     * @param {string} strokeStyle - Stroke color
     * @param {number} lineWidth - Line width
     */
    drawLine(x1, y1, x2, y2, strokeStyle, lineWidth = 1) {
        this.ctx.save();
        this.ctx.strokeStyle = strokeStyle;
        this.ctx.lineWidth = lineWidth;
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
        this.ctx.restore();
    }
    
    /**
     * Draw a dashed line
     * @param {number} x1 - Start X
     * @param {number} y1 - Start Y
     * @param {number} x2 - End X
     * @param {number} y2 - End Y
     * @param {string} strokeStyle - Stroke color
     * @param {number} lineWidth - Line width
     * @param {Array} dashPattern - Dash pattern [dash, gap]
     */
    drawDashedLine(x1, y1, x2, y2, strokeStyle, lineWidth = 1, dashPattern = [5, 5]) {
        this.ctx.save();
        this.ctx.strokeStyle = strokeStyle;
        this.ctx.lineWidth = lineWidth;
        this.ctx.setLineDash(dashPattern);
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
        this.ctx.restore();
    }
    
    /**
     * Measure text dimensions
     * @param {string} text - Text to measure
     * @param {string} font - Font style
     * @returns {Object} Text metrics {width, height}
     */
    measureText(text, font) {
        const cacheKey = `${text}_${font}`;
        
        if (this.textMeasureCache.has(cacheKey)) {
            return this.textMeasureCache.get(cacheKey);
        }
        
        this.ctx.save();
        this.ctx.font = font;
        const metrics = this.ctx.measureText(text);
        this.ctx.restore();
        
        const result = {
            width: metrics.width,
            height: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
        };
        
        this.textMeasureCache.set(cacheKey, result);
        return result;
    }
    
    /**
     * Set global alpha
     * @param {number} alpha - Alpha value (0-1)
     */
    setAlpha(alpha) {
        this.ctx.globalAlpha = alpha;
    }
    
    /**
     * Reset global alpha
     */
    resetAlpha() {
        this.ctx.globalAlpha = 1;
    }
    
    /**
     * Save context state
     */
    save() {
        this.ctx.save();
    }
    
    /**
     * Restore context state
     */
    restore() {
        this.ctx.restore();
    }
    
    /**
     * Translate context
     * @param {number} x - X translation
     * @param {number} y - Y translation
     */
    translate(x, y) {
        this.ctx.translate(x, y);
    }
    
    /**
     * Rotate context
     * @param {number} angle - Rotation angle in radians
     */
    rotate(angle) {
        this.ctx.rotate(angle);
    }
    
    /**
     * Scale context
     * @param {number} x - X scale
     * @param {number} y - Y scale
     */
    scale(x, y) {
        this.ctx.scale(x, y);
    }
    
    /**
     * Get canvas dimensions
     * @returns {Object} Canvas dimensions {width, height}
     */
    getDimensions() {
        return {
            width: this.canvas.width,
            height: this.canvas.height
        };
    }
    
    /**
     * Update canvas dimensions
     * @param {number} width - New width
     * @param {number} height - New height
     */
    setDimensions(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.setupContext(); // Re-setup context after resize
    }
    
    /**
     * Create a linear gradient
     * @param {number} x0 - Start X
     * @param {number} y0 - Start Y
     * @param {number} x1 - End X
     * @param {number} y1 - End Y
     * @param {Array} colorStops - Array of {offset, color}
     * @returns {CanvasGradient} Gradient
     */
    createLinearGradient(x0, y0, x1, y1, colorStops) {
        const gradient = this.ctx.createLinearGradient(x0, y0, x1, y1);
        colorStops.forEach(stop => {
            gradient.addColorStop(stop.offset, stop.color);
        });
        return gradient;
    }
    
    /**
     * Clear text measure cache
     */
    clearTextCache() {
        this.textMeasureCache.clear();
    }
    
    /**
     * Fill a rounded rectangle
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Rectangle width
     * @param {number} height - Rectangle height
     * @param {number} radius - Corner radius
     * @param {string} color - Fill color
     */
    fillRoundRect(x, y, width, height, radius, color) {
        this.ctx.save();
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.roundRect(x, y, width, height, radius);
        this.ctx.fill();
        this.ctx.restore();
    }
    
    /**
     * Stroke a rounded rectangle
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Rectangle width
     * @param {number} height - Rectangle height
     * @param {number} radius - Corner radius
     * @param {string} color - Stroke color
     * @param {number} lineWidth - Line width
     */
    strokeRoundRect(x, y, width, height, radius, color, lineWidth = 1) {
        this.ctx.save();
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        this.ctx.beginPath();
        this.ctx.roundRect(x, y, width, height, radius);
        this.ctx.stroke();
        this.ctx.restore();
    }
}