class GridWaveTemplate extends Wave {
    constructor(gridPrecision) {
        super();

        let unit = _pSimulationInstance.plotter.computeForXYZ(1, 1, 0, false).x;

        this.grids  = [];
        this.ratioX = width  / gridPrecision;
        this.ratioY = height / gridPrecision;

        for (let x = this.ratioX / 2; x < width + this.ratioX / 2; x += this.ratioX)
            for (let y = this.ratioY / 2 - height/2; y < height + this.ratioY / 2 - height/2; y += this.ratioY)
                this.grids.push({ pos : new Vector(x / unit, y / unit), value : 0 });

        this.coverPlan = new Vector(
            Math.floor(this.ratioX/2 + 1/2),
            Math.floor(this.ratioY/2 + 1/2)
        );
    }

    updateWave(dt, t) {
        for (let i = 0; i < this.grids.length; i++)
            this.grids[i].normalizedValue = this.getNormalizedAmplitude(this.grids[i].pos, t);
    }

    drawWave(drawer) {
        drawer.noStroke();

        let w = Math.floor(width);

        loadPixels();
        for (let i = 0; i < this.grids.length; i++) {
            let pos = _pSimulationInstance.plotter.computeForXYZ(this.grids[i].pos.x, this.grids[i].pos.y);
            if (pos.x + this.coverPlan.x + 1 > width)
                continue;

            let col = this.getColor(this.grids[i].normalizedValue);
            let p0 = (Math.floor(pos.x) + Math.floor(pos.y) * w) * 4;

            // Complete "holes"
            for (let jx = -this.coverPlan.x; jx < this.coverPlan.x + 1; jx++) {
                for (let jy = -this.coverPlan.y; jy < this.coverPlan.y + 1; jy++) {
                    pixels[p0 + 0 + jx*4 + jy*w*4] = col[0];
                    pixels[p0 + 1 + jx*4 + jy*w*4] = col[1];
                    pixels[p0 + 2 + jx*4 + jy*w*4] = col[2];
                    pixels[p0 + 3 + jx*4 + jy*w*4] = col[3] * 255;
                }
            }
        }
        updatePixels();
    }


    getColor(val) {
        if (val < 0)
            val = 0;
        if (val > 1)
            val = 1;

        let v = Math.round(val * 127.5 + 127.5);
        return [255-v, 255-v, 255-v, 1];
    }
}
