class EulerSolver {
    constructor() {
        this.gridPrecision = 200;
        this.ratioX = width  / this.gridPrecision;
        this.ratioY = height / this.gridPrecision;
        this.w      = Math.floor(width);

        let unit = _pSimulationInstance.plotter.computeForXYZ(1, 1, 0, false);
        let it = Math.floor(this.gridPrecision);

        this.grids = [];
        for (let i = 0; i < it; i++) {
            this.grids.push([]);
            for (let j = 0; j < it; j++) {
                this.grids[this.grids.length - 1].push({
                    u : { last : 0, current : 0, new : 0 },
                    pos : new Vector(i / unit.x * this.ratioX, (j - it / 2) / unit.y * this.ratioY)
                });
            }
        }
        this.grids[Math.round(it / 2)][Math.round(it / 2)].u.last = 1;

        this.coverPlan = new Vector(
            Math.floor(this.ratioX),
            Math.floor(this.ratioY)
        );
    }

    update(dt) {
        function isBounds(x, y, grids) {
            return (x < 0 || y < 0 || x > grids.length-1 || y > grids[0].length-1 || x-1 < 0 || y-1 < 0 || x+1 > grids.length-1 || y+1 > grids[0].length-1);
        }

        this.dampening = 0.999;
        this.c = 10;
        this.alpha = 0;
        for (let x = 0; x < this.grids.length; x++) {
            for (let y = 0; y < this.grids[0].length; y++) {
                if (isBounds(x, y, this.grids))
                    continue;
                // let laplacian =   1 / (this.ratioX**2) * (this.grids[x+1][y].u.current - 2*this.grids[x][y].u.current + this.grids[x-1][y].u.current)
                //                 + 1 / (this.ratioY**2) * (this.grids[x][y+1].u.current - 2*this.grids[x][y].u.current + this.grids[x][y-1].u.current);
                // this.grids[x][y].u.new = (laplacian * this.c**2 + this.alpha * (this.grids[x][y].u.last - this.grids[x][y].u.current) / dt) * dt**2
                //     + 2*this.grids[x][y].u.current - this.grids[x][y].u.last;
                // let laplacian =   1 / (this.ratioX**2) * (this.grids[x+1][y].u.current - 2*this.grids[x][y].u.current + this.grids[x-1][y].u.current)
                //                 + 1 / (this.ratioY**2) * (this.grids[x][y+1].u.current - 2*this.grids[x][y].u.current + this.grids[x][y-1].u.current);
                // this.grids[x][y].u.new = (laplacian * this.c**2 + this.alpha * (this.grids[x][y].u.last - this.grids[x][y].u.current) / dt) * dt**2
                //     + 2*this.grids[x][y].u.current - this.grids[x][y].u.last;

                this.grids[x][y].u.new =
                    (this.grids[x-1][y].u.last +
                     this.grids[x+1][y].u.last +
                     this.grids[x][y-1].u.last +
                     this.grids[x][y+1].u.last) /
                     2 - this.grids[x][y].u.current;
                this.grids[x][y].u.new = this.grids[x][y].u.new * this.dampening;
            }
        }

        for (let x = 0; x < this.grids.length; x++) {
            for (let y = 0; y < this.grids[0].length; y++) {
                let temp = this.grids[x][y].u.last;
                this.grids[x][y].u.last = this.grids[x][y].u.new;
                this.grids[x][y].u.current = temp;
            }
        }
    }



    draw(drawer) {
        drawer.noStroke();

        loadPixels();
        for (let x = 0; x < this.grids.length; x++) {
            for (let y = 0; y < this.grids[0].length; y++) {
                let col = this.getColor(this.grids[x][y].u.current);
                let pos = _pSimulationInstance.plotter.computeForXYZ(this.grids[x][y].pos.x, this.grids[x][y].pos.y);
                let p0 = (Math.floor(pos.x) + Math.floor(pos.y) * this.w) * 4;

                // Complete "holes"
                for (let jx = -this.coverPlan.x; jx < this.coverPlan.x + 1; jx++) {
                    for (let jy = -this.coverPlan.y; jy < this.coverPlan.y + 1; jy++) {
                        let it = p0 + jx*4 + jy*this.w*4;
                        pixels[it + 0] = col.x;
                        pixels[it + 1] = col.y;
                        pixels[it + 2] = col.z;
                        pixels[it + 3] = 1 * 255;
                    }
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

        let v = Math.round(val*255);
        return new Vector(v, v, v);
    }
}
