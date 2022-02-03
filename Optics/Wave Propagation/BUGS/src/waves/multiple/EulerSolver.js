class EulerSolver {
    constructor() {
        this.gridPrecision = 200;

        let unit = _pSimulationInstance.plotter.computeForXYZ(1, 1, 0, false).x;

        this.grids  = [];
        this.ratioX = width  / this.gridPrecision;
        this.ratioY = height / this.gridPrecision;

        for (let x = this.ratioX / 2; x < width + this.ratioX / 2; x += this.ratioX)
            for (let y = this.ratioY / 2 - height/2; y < height + this.ratioY / 2 - height/2; y += this.ratioY)
                this.grids.push({
                    pos : new Vector(x / unit, y / unit),
                    u : { last : 0, current : 0, new : 0 }
                });

        let c = Math.floor(this.gridPrecision / 2);
        let d = 5;
        for (let i = -d; i < d; i++) {
            for (let j = -d; j < d; j++) {
                let dr  = (i-0) * (i-0) + (j-0) * (j-0);
				let val = 1 * Math.exp(-Math.abs(dr / 20));
                this.grids[c + c * this.gridPrecision + i + j * this.gridPrecision].u = { last : 0, current : val, new : 0 };
            }
        }

        this.coverPlan = new Vector(
            Math.floor(this.ratioX/2 + 1/2),
            Math.floor(this.ratioY/2 + 1/2)
        );

        this.c = 10;
    }

    update(dt) {
        let gridPrecision = this.gridPrecision;
        let grids = this.grids;
        function u(x, y) {
            // Boundary Conditions
            if (x > gridPrecision || x < 0 || y > gridPrecision || y < 0)
                return { new : 0, current : 0, last : 0 };
            if (x + y * gridPrecision >= grids.length || x + y * gridPrecision < 0)
                return { new : 0, current : 0, last : 0 };

            return grids[x + y * gridPrecision].u;
        }

        for (let i = 0; i < this.grids.length; i++) {
            let x = i % this.gridPrecision;
            let y = (i - x) / this.gridPrecision;

            let laplacian =   1 / (this.ratioX**2) * (u(x+1, y).current - 2*u(x, y).current + u(x-1, y).current)
                            + 1 / (this.ratioY**2) * (u(x, y+1).current - 2*u(x, y).current + u(x, y-1).current);
            this.grids[i].u.new = laplacian * this.c**2 * dt**2 + 2*u(x, y).current - u(x, y).last;
        }

        for (let i = 0; i < this.grids.length; i++) {
            this.grids[i].u.last    = this.grids[i].u.current;
            this.grids[i].u.current = this.grids[i].u.new;
            this.grids[i].u.new     = 0;
        }
    }

    draw(drawer) {
        drawer.noStroke();

        let w = Math.floor(width);

        loadPixels();
        for (let i = 0; i < this.grids.length; i++) {
            let col = this.getColor(this.grids[i].u.current);
            let pos = _pSimulationInstance.plotter.computeForXYZ(this.grids[i].pos.x, this.grids[i].pos.y);
            if (pos.x + this.coverPlan.x + 1 > width)
                continue;

            let p0 = (Math.floor(pos.x) + Math.floor(pos.y) * w) * 4;

            // Complete "holes"
            for (let jx = -this.coverPlan.x; jx < this.coverPlan.x + 1; jx++) {
                for (let jy = -this.coverPlan.y; jy < this.coverPlan.y + 1; jy++) {
                    pixels[p0 + 0 + jx*4 + jy*w*4] = col.x;
                    pixels[p0 + 1 + jx*4 + jy*w*4] = col.y;
                    pixels[p0 + 2 + jx*4 + jy*w*4] = col.z;
                    pixels[p0 + 3 + jx*4 + jy*w*4] = 1 * 255;
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

        let v = Math.round(val * 255);
        return new Vector(v, v, v);
    }
}
