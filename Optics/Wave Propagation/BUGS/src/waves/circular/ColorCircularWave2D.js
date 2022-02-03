class ColorCircularWave2D extends GridWaveTemplate {
    constructor(o) {
        super(200);

        this.omega      = o.addInput('\\omega', 5, -20, 20);
        this.phi0       = o.addInput('\\varphi_0', 0, -5, 5);
        this.amplitude  = o.addInput('\\text{Amplitude}', 1, -10, 10);
        this.k          = o.addInput('k', 2.5, -5, 5);
        this.waveCenter = o.addVector('\\text{Wave center } M_O', [0, 0], [-20, -20], [20, 20]);
    }

    getNormalizedAmplitude(r, t) {
        let waveCenter = this.waveCenter().add(this.offset);
        let mag = (Vector.sub(r, waveCenter)).mag();
        let phi = this.k() * mag + this.omega() * t + this.phi0();

        let val = (1 / mag * this.amplitude() * Math.cos(phi) + 1) / 2;
        return val;
    }
}
