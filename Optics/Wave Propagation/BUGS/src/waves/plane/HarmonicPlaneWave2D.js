class HarmonicPlaneWave2D extends ParticlesWaveTemplate {
    constructor(o) {
        super(1000);

        this.omega     = o.addInput('\\omega', 1.7, -20, 20);
        this.phi0      = o.addInput('\\varphi_0', 0, -5, 5);
        this.amplitude = o.addInput('\\text{Amplitude}', 1.1, -10, 10);
        this.k         = o.addVector('\\text{Vecteur } \\vec{k}', [0.3, 0], [-5, -5], [5, 5]);
    }

    getAmplitude(r, t) {
        let phi = Vector.dot(this.k(), r) + this.omega() * t + this.phi0();
        return this.amplitude() * Math.cos(phi);
    }
}
