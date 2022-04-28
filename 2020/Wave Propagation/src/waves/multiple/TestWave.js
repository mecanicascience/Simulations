class TestWave {
    constructor() {
        this.t = 0;
    }

    getNormalizedAmplitude(r, dt) {
        this.t += dt;

        let m = _pSimulationInstance.plotter.computeForXYFromPixel(mouseX, mouseY)
            .sub(
                _pSimulationInstance.config.engine.plotter.offset.x,
                _pSimulationInstance.config.engine.plotter.offset.y
            );
        let mouseWaveAmp = (Math.cos(this.t * 0.0003 + Vector.add(r, new Vector(-20, 0)).sub(m.x, m.y).mag()) + 1) / 2;
        let centerWave = (Math.cos(this.t * 0.0003 + r.mag()) + 1) / 2;
        return (mouseWaveAmp + centerWave) / 2;
    }
}
