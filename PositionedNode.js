"use strict"
class PositionedNode {
    /**
     *
     * @param {number} content 0-15
     */
    constructor(content) {
        this.content = content
    }
    /**
     *
     * @param {GridMap} grid_map
     * @param {{x: number, y: number}} position
     * @param {CanvasRenderingContext2D} ctx
     * @param {string} colour
     */
    display(grid_map, position, ctx, colour) {
        if(grid_map.levelOfDetail >= 1) {
            // Large - leave space for grid lines
            GridMap.displayNode(ctx, position, () => {
                ctx.beginPath()
                ctx.fillStyle = colour
                ctx.fillRect(0.125, 0.125, 0.75, 0.75)
            })
        } else {
            // Small - just blocks
            GridMap.displayNode(ctx, position, () => {
                ctx.beginPath()
                ctx.fillStyle = colour
                ctx.fillRect(0, 0, 1, 1)
            })
        }
    }
}
