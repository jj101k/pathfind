"use strict"
class Route {
    /**
     *
     * @param {?{x: number, y: number}} left
     * @param {?{x: number, y: number}} right
     */
    constructor(left = null, right = null) {
        this.left = left
        this.right = right
    }
    /**
     *
     * @param {GridMap} grid_map
     * @param {CanvasRenderingContext2D} ctx
     */
    display(grid_map, ctx) {
        for(const n of this.getNodes(grid_map)) {
            const m = grid_map.nodeAt(n.x, n.y)
            if (!this.left)
                throw new Error("this.left is null")
            if (!this.right)
                throw new Error("this.right is null")
            if (!m)
                throw new Error("node is null")
            if (n.x == this.left.x && n.y == this.left.y) {
                m.display(grid_map, n, ctx, "pink")
            } else if (n.x == this.right.x && n.y == this.right.y) {
                m.display(grid_map, n, ctx, "yellow")
            } else {
                m.display(grid_map, n, ctx, "orange")
            }
        }
    }
    /**
     *
     * @param {GridMap} grid_map
     * @returns {number}
     */
    getCost(grid_map) {
        if (!this.left)
            return Infinity
        if (!this.right)
            throw new Error("this.right is null")
        let cost = 0
        if (this.left.x == this.right.x || this.left.y == this.right.y) {
            cost += 4
        } else {
            cost += 6
        }
        for(const n of this.getNodes(grid_map)) {
            const m = grid_map.source.contentAt(n.x, n.y)
            const mf = PathNode.getFromPosition(n.x, n.y, m)
            if (mf.x == n.x || mf.y == n.y) {
                cost += 4
            } else {
                cost += 6
            }
        }
        return cost
    }
    /**
     *
     * @param {GridMap} grid_map
     * @return {{x: number, y: number}[]}
     */
    getNodes(grid_map) {
        if (!this.left)
            throw new Error("this.left is null")
        if (!this.right)
            throw new Error("this.right is null")
        let [a, b] = [this.left, this.right]
        /** @type {{x: number, y: number}[]} */
        const nodes = []
        let ac = grid_map.source.contentAt(a.x, a.y)
        while (PathNode.isPath(ac)) {
            nodes.push(a)
            a = PathNode.getFromPosition(a.x, a.y, ac)
            ac = grid_map.source.contentAt(a.x, a.y)
        }
        let bc = grid_map.source.contentAt(b.x, b.y)
        while (PathNode.isPath(bc)) {
            nodes.unshift(b)
            b = PathNode.getFromPosition(b.x, b.y, bc)
            bc = grid_map.source.contentAt(b.x, b.y)
        }
        return nodes
    }
}
