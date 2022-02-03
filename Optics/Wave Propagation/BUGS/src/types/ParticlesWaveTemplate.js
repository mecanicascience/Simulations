class ParticlesWaveTemplate extends Wave {
    constructor(particlesCount) {
        super();

        this.particles = [];
        for (let i = 0; i < particlesCount; i++) {
            let v = new Vector(
                random(-this.scale.x + this.offset.x, this.scale.x + this.offset.x),
                random(-this.scale.x / 2, this.scale.x / 2)
            );
            this.particles.push({ equilibrium : v, actual : v });
        }
    }

    updateWave(dt, t) {
        for (let i = 0; i < this.particles.length; i++) {
            this.particles[i].actual = Vector.add(
                this.particles[i].equilibrium,
                this.getAmplitude(this.particles[i].actual, t)
            );
        }
    }

    drawWave(drawer) {
        drawer
            .noStroke()
            .fill(255);

        for (let i = 0; i < this.particles.length; i++)
            drawer.circle(this.particles[i].actual.x, this.particles[i].actual.y, 10, true);
    }
}
