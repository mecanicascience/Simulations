class Grapher {
    constructor() {
        this.configGUI();

        this.res = 3000;
        this.renderingCanvas = document.getElementById('terrainRenderingCanvas');
        this.renderingCanvas.width  = window.innerWidth * 0.995;
        this.renderingCanvas.height = window.innerHeight * 0.995;

        this.drawWidth = this.renderingCanvas.width;
        this.drawHeight = this.renderingCanvas.height;

        let MODE = 'gpu'; // gpu / dev (enable debug options)
        this.gpu = new GPU({
            canvas : this.renderingCanvas,
            mode : MODE // cpu / gpu / dev (enable debug options)
        });

        this.drawGPU = this.gpu
            .addFunction(this.getWaveFunction())
            .createKernel(function(width, height, res, time, k, omega, localRes, centerX, centerY, phi0) {
                let sXIndex = Math.trunc((this.thread.x) / width * res);
                let sYIndex = Math.trunc((this.thread.y) / width * res);
                let val = getWaveValueAt(sXIndex - res / 2, sYIndex - res / 4, time, k, omega, localRes, centerX, centerY, phi0);
                let col = val;
                this.color(col, col, col);
            }, { output : [ this.drawWidth, this.drawHeight ] })
            .setGraphical(true);

        this.t = 0;
    }

    configGUI() {
        this.optionsGUI = new OptionsGUI();
        this.omega      = this.optionsGUI.addInput('\\omega', 5, -20, 20);
        this.phi0       = this.optionsGUI.addInput('\\varphi_0', 0, -5, 5);
        this.k          = this.optionsGUI.addInput('k', 2.5, -5, 5);
        this.waveCenter = this.optionsGUI.addVector('\\text{Wave center } M_O', [0, 0], [-2000, -2000], [2000, 2000]);
        this.localRes   = this.optionsGUI.addInput('Local Res', 20, 1, 100);
    }



    update(dt) {
        this.t += dt;
    }

    draw(drawer) {

        this.drawGPU(
            this.drawWidth, this.drawHeight, this.res, this.t, this.k(),
            this.omega(), this.localRes(), this.waveCenter().x, this.waveCenter().y, this.phi0()
        );
    }


    getWaveFunction() {
        // Return a number in range [0, 1]
        let f = function getWaveValueAt(x, y, t, k, omega, localRes, centerX, centerY, phi0) {
            let xC = (x - centerX) / localRes;
            let yC = (y - centerY) / localRes;
            let mag = Math.sqrt(xC*xC + yC*yC);
            let phi = k * mag + omega * t + phi0;

            let val = (1 / mag * 1 * Math.cos(phi) + 1) / 2;
            return val;
        };
        return f;
    }
}
