class GridWaveTemplate extends Wave {
    constructor(gridPrecision) {
        super();

        this.grids  = [];
        this.radius = this.scale.x / gridPrecision;

        for (let x = -this.scale.x + this.offset.x; x < this.scale.x + this.offset.x; x += this.radius)
            for (let y = -this.scale.y + this.offset.y; y < this.scale.y + this.offset.y; y += this.radius)
                this.grids.push({ pos : new Vector(x, y), value : 0 });
    }

    updateWave(dt, t) {
        for (let i = 0; i < this.grids.length; i++)
            this.grids[i].normalizedValue = this.getNormalizedAmplitude(this.grids[i].pos, t);
    }

    drawWave(drawer) {
        drawer.noStroke();

        for (let i = 0; i < this.grids.length; i++)
            drawer
                .fill(this.getColor(this.grids[i].normalizedValue))
                .rect(this.grids[i].pos.x, this.grids[i].pos.y, this.radius+0.1, this.radius+0.1);
    }


    getColor(val) {
        if (val < 0)
            val = 0;
        if (val > 1)
            val = 1;

        let v = Math.round(val * 127.5 + 127.5);
        return `rgba(${v}, ${v}, ${v}, 1)`;
    }
}
