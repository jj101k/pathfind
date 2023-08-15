"use strict"
class GridMap {
    /**
     *
     * @param {CanvasRenderingContext2D} ctx
     * @param {{x: number, y: number}} position
     * @param {function(): void} action
     */
    static displayNode(ctx, position, action) {
        ctx.save()
        ctx.translate(position.x, position.y)
        action()
        ctx.restore()
    }
    /**
     *
     * @param {number} pixel_width
     * @param {number} node_width How many nodes to fit
     */
    constructor(pixel_width, node_width) {
        this.finish = { x: 0, y: 0 }
        this.nodeWidth = node_width
        this.source = GridMapSource.build(node_width)
        this.start = { x: 0, y: 0 }
        this.pixelWidth = pixel_width
    }

    /**
     *
     */
    get nodePixelWidth() {
        return this.pixelWidth / this.nodeWidth
    }

    /**
     *
     * @param {CanvasRenderingContext2D} ctx
     */
    display(ctx) {
        ctx.fillStyle = this.nodePixelWidth > 10 ? "white" : "#888"
        ctx.fillRect(0, 0, this.nodeWidth, this.nodeWidth)
        ctx.beginPath()
        ctx.strokeStyle = "black"
        if (this.nodePixelWidth >= 3) {
            for (let x = 0; x <= this.nodeWidth; x++) {
                ctx.moveTo(x, 0)
                ctx.lineTo(x, this.nodeWidth)
            }
            for (let y = 0; y <= this.nodeWidth; y++) {
                ctx.moveTo(0, y)
                ctx.lineTo(this.nodeWidth, y)
            }
            ctx.lineWidth = 2 / this.nodePixelWidth
            ctx.stroke()
        }
        // Note: without this, the path appears to remain open, which puts a
        // drain on rendering time for each frame
        ctx.beginPath()
    }

    /**
     *
     * @param {number} x
     * @param {number} y
     * @returns {?PositionedNode}
     */
    nodeAt(x, y) {
        const content = this.source.contentAt(x, y)
        switch (content) {
            case EMPTY_NODE:
                return null
            case OBSTRUCTION_NODE:
                return new PositionedNode(content)
            default:
                return new PathNode(content)
        }
    }
    /**
     *
     * @param {number} x
     * @param {number} y
     * @returns {?boolean}
     */
    validAddress(x, y) {
        return x >= 0 && y >= 0 && x < this.nodeWidth && y < this.nodeWidth
    }
}
