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
     */
    #pixelWidth

    /**
     * @type {number}
     */
    #nodeWidth

    /**
     * @type {0 | 1 | 2}
     *
     * 0 - very little; 1 - some; 2 - full
     */
    levelOfDetail

    /**
     * @type {number}
     */
    nodePixelWidth

    set nodeWidth(v) {
        this.#nodeWidth = v
        this.nodePixelWidth = this.#pixelWidth / this.#nodeWidth
        if(this.nodePixelWidth >= 10) {
            this.levelOfDetail = 2
        } else if(this.nodePixelWidth >= 3) {
            this.levelOfDetail = 1
        } else {
            this.levelOfDetail = 0
        }
    }

    get nodeWidth() {
        return this.#nodeWidth
    }

    /**
     *
     * @param {number} pixel_width
     * @param {number} node_width How many nodes to fit
     */
    constructor(pixel_width, node_width) {
        this.#pixelWidth = pixel_width
        this.finish = { x: 0, y: 0 }
        this.nodeWidth = node_width
        this.source = GridMapSource.build(node_width)
        this.start = { x: 0, y: 0 }
    }

    /**
     *
     * @param {CanvasRenderingContext2D} ctx
     */
    display(ctx) {
        switch(this.levelOfDetail) {
            case 2:
                ctx.fillStyle = "white"
                break
            case 1:
                ctx.fillStyle = "#888"
                break
            default:
                ctx.fillStyle = "#444"
        }
        ctx.fillRect(0, 0, this.nodeWidth, this.nodeWidth)
        ctx.beginPath()
        ctx.strokeStyle = "black"
        if (this.levelOfDetail >= 1) {
            for (let x = 0; x <= this.nodeWidth; x++) {
                ctx.moveTo(x, 0)
                ctx.lineTo(x, this.nodeWidth)
            }
            for (let y = 0; y <= this.nodeWidth; y++) {
                ctx.moveTo(0, y)
                ctx.lineTo(this.nodeWidth, y)
            }
            if(this.nodeWidth >= 10) {
                // 2 pixels wide
                ctx.lineWidth = 2 / this.nodePixelWidth
            } else {
                // 1 pixel wide
                ctx.lineWidth = 1 / this.nodePixelWidth
            }
            ctx.stroke()
        }
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
