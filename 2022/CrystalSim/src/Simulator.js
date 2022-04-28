class Simulator {
    constructor() {
        this.crystalSize = new Vector(100, 20); // Crystal number of atoms on each direction
        this.a = 2.510e-10; // latice constant = distance between each atom ~ 2.5 A

        // Change simulation plotter size to see every particles (+ delta)
        _pSimulationInstance.config.engine.plotter.scale.x = this.crystalSize.x / 2 * this.a * width / height * 1.11;
        _pSimulationInstance.config.engine.plotter.scale.y = this.crystalSize.x / 2 * this.a * width / height * 1.11;


        // Create particles centered at origin
        this.particles = new Array(this.crystalSize.x)
            .fill().map((el, i) => new Array(this.crystalSize.y)
                .fill().map((el, j) => new Particle(
                    new Vector(i, j), // particle id
                    new Vector(i * this.a - this.crystalSize.x / 2 * this.a, j * this.a - this.crystalSize.y / 2 * this.a) // space pos
        )));

        // Initial perturbation
        /* for (let i = 0; i < this.crystalSize.x; i++) {
            for (let j = 0; j < this.crystalSize.y; j++) {
                let f = 0.4;
                this.particles[i][j].pos.x     += this.a * f;
                this.particles[i][j].lastPos.x += this.a * f;
            }
        } */
        for (let j = 0; j < this.crystalSize.y; j++) {
            this.particles[0][j].pos.y += this.a * 0.06;
        }
    }

    update(dt) {
        // Check if mouse interaction
        if (mouseIsPressed) {
            // Mouse position in simulation values
            let mPos = new Vector(
                mouseX - width * 0.5,
                -mouseY + height * 0.5
            ).div(width).mult(2).mult(_pSimulationInstance.config.engine.plotter.scale.x);

            // Corresponding nearest IDs
            let mPosID = mPos.copy().div(this.a).add(this.crystalSize.copy().div(2));
            mPosID.set(Math.round(mPosID.x), Math.round(mPosID.y));

            // Check ID in range and notify it to the corresponding particle
            if (mPosID.x >= 0 && mPosID.x < this.crystalSize.x  && mPosID.y >= 0 && mPosID.y < this.crystalSize.x) {
                // Check if cursor in radius
                if (
                    this.particles[mPosID.x]
                    && this.particles[mPosID.x][mPosID.y]
                    && Vector.dist(mPos, this.particles[mPosID.x][mPosID.y].pos) < _pSimulationInstance.config.engine.plotter.scale.x / this.crystalSize.x * 0.1
                ) this.particles[mPosID.x][mPosID.y].selected = true;
            }
        }

        // Update particles
        this.particles.forEach(el => el.forEach(el2 => el2.update(this.particles, dt)));
    }

    draw(drawer) {
        // Draw particles
        this.particles.forEach(el => el.forEach(el2 => el2.draw(this.particles, drawer)));

        // Compute Fourier first corresponding frequencies
        /* let MAX_FREQ = 3;
        let FREQ_IT = MAX_FREQ / 100;

        let fourierSerInd = [];
        let fourierSerVal = [];
        let it = -MAX_FREQ;
        while (it < MAX_FREQ) {
            fourierSerInd.push(it);
            fourierSerVal.push(this.fourier(this.particles, new Vector(it, Math.round(this.particles[0].count / 2))));
            it += FREQ_IT;
        }

        // Display them
        let plt = {
            x: fourierSerInd,
            y: fourierSerVal,
            mode: 'markers',
            type: 'scatter'
        };
        let layout = {
            xaxis: {
                title: 'Nombre d\'ondes'
            },
            yaxis: {
                title: 'Amplitude',
                range: [0, 2*10e-11]
            }
        };
        Plotly.newPlot('plot', [plt], layout); */


        // Display wave propagation on X axis
        let freqID  = [];
        let freqVal = [];
        let j = Math.trunc(this.particles[0].length / 2 - 1);
        this.particles.forEach(p => {
            freqID.push(p[j].pos.x);
            freqVal.push(Vector.sub(p[j].pos, p[j].initialPos).mag());
        });
        // Display them
        let plt = {
            x: freqID,
            y: freqVal,
            mode: 'lines+markers', // 'markers',
            type: 'scatter'
        };
        let layout = {
            xaxis: {
                title: 'Position en x (y = Ny/2)',
            },
            yaxis: {
                title: 'Amplitude d\'écart à la position d\'équilibre'
            }
        };
        Plotly.newPlot('plot', [plt], layout);
    }



    /**
     * Compute a discrete fourier transform
     * @param points The points of the FT
     * @param nu Value of the function to evaluate to
     * @return the evaluated FT
     */
    fourier(points, nu) {
        let valR = 0;
        let valI = 0;
        for (let i = 0; i < points.length; i++) {
            for (let j = 0; j < points[0].length; j++) {
                let n = Math.sqrt((points[i][j].lastPos.x - points[i][j].pos.x) ** 2 + (points[i][j].lastPos.y - points[i][j].pos.y) ** 2);
                let phi = -2 * PI * (nu.x * i / points.length + nu.y * j / points[0].length);
                valR += n * Math.cos(phi);
                valI += n * Math.sin(phi);
            }
        }
        return Math.sqrt(valR*valR + valI*valI);
    }
}
