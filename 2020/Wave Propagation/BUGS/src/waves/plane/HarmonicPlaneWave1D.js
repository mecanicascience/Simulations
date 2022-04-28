class HarmonicPlaneWave1D extends AmplitudeWaveTemplate {
    constructor(o) {
        super();

        this.omega     = o.addInput('\\omega', 5, -20, 20);
        this.phi0      = o.addInput('\\varphi_0', 0, -5, 5);
        this.amplitude = o.addInput('\\text{Amplitude}', 2, -10, 10);
        this.k         = o.addVector('\\text{Vecteur } \\vec{k}', [1, 0], [-5, -5], [5, 5]);
    }

    getAmplitude(r, t) {
        let phi = Vector.dot(this.k(), r) + this.omega() * t + this.phi0();
        return this.amplitude() * Math.cos(phi);
    }
}
