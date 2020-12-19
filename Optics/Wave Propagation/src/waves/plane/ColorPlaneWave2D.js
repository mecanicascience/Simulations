class ColorPlaneWave2D extends GridWaveTemplate {
    constructor(o) {
        super(200);

        this.omega     = o.addInput('\\omega', 10, -20, 20);
        this.phi0      = o.addInput('\\varphi_0', 0, -5, 5);
        this.amplitude = o.addInput('\\text{Amplitude}', 1, -10, 10);
        this.k         = o.addVector('\\text{Vecteur } \\vec{k}', [1.6, 1.3], [-5, -5], [5, 5]);
    }

    getNormalizedAmplitude(r, t) {
        let phi = (Vector.dot(this.k(), r) + this.omega() * t + this.phi0() + 1) / 2;
        return (Math.cos(phi) + 1) / 2;
    }
}
