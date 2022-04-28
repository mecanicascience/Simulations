class AmplitudeWaveTemplate extends Wave {
    constructor() {
        super();

        this.color = [random(100, 255), random(100, 255), random(100, 255)];
        this.strokeWeight = 3;

        this.iteratorLoop = this.widthRelativeX / 500;
    }

    updateWave(dt, t) { }

    drawWave(drawer) {
        drawer
            .stroke(this.color)
            .strokeWeight(this.strokeWeight)
            .noFill();

        for (let x = 0; x < this.widthRelativeX; x += this.iteratorLoop) {
            let amp = this.getAmplitude(new Vector(x, 0), this.t);
    		drawer.line(x - this.iteratorLoop, this.lastAmp, x, amp);
    		this.lastAmp = amp;
        }
    }

    /** Must be @Override */
    getAmplitude() { return 0; }
}
