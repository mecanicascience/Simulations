class PointsPlotter {
    constructor(xDim = 10, yDim = 10, xOffset = 0, yOffset = 0, options = { resolution : 100 }) {
        this.points  = [];
        this.options = options;

        this.setupDimensions(xDim, yDim, xOffset, yOffset);
    }

    setupDimensions(xDim, yDim, xOffset, yOffset) {
        this.dimensions = { xDim, yDim, xOffset, yOffset };
        _pSimulationInstance.config.engine.plotter.offset = { x : xOffset, y : yOffset };
        _pSimulationInstance.config.engine.plotter.scale  = { x : xDim   , y : yDim    };
    }

    /**
    * There are two possible functions
    *  - addPoint(y)
    *  - addPoint(x, y)
    */
    addPoint(y, x = null) {
        // For function addPoint(x, y)
        if (x != null) {
            let tmp = y;
            y = x;
            x = tmp;
        }
        else
            x = this.points.length / this.options.resolution;

        this.points.push({ x, y });
    }

    resize(xDim, yDim, xOffset, yOffset) {
        this.setupDimensions(
            xDim != null ? xDim : this.dimensions.xDim,
            yDim != null ? yDim : this.dimensions.yDim,
            xOffset != null ? xOffset : this.dimensions.xOffset,
            yOffset != null ? yOffset : this.dimensions.yOffset
        );
    }

    draw(drawer) {
        drawer.noFill().stroke(255).strokeWeight(2);

        for (let i = 1; i < this.points.length; i++)
            drawer.line(
                this.points[i - 1].x, this.points[i - 1].y,
                this.points[i    ].x, this.points[i    ].y
            );
    }
}
