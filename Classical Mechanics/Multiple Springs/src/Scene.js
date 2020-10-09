class Scene {
    constructor(systemPointsNumber, l0, q, m, k, drawParticleRadius) {
        this.staticPoints = [
            {
                pos  : new Vector(0, 0),
                type : 'static',
                id   : 'left attach point',
                drawRadius : 0.05
            },
            {
                pos  : new Vector(16, 0),
                type : 'static',
                id   : 'right attach point',
                drawRadius : 0.05
            }
        ];

        this.springs = [];

        if (systemPointsNumber <= 1) {
            console.error("You need to simulate at least 2 points");
        }

        // generate springs
        for (let i = 0; i < systemPointsNumber; i++)
            this.springs.push(
                new Spring(null, null, new Vector((16-1) / systemPointsNumber * i + 1, 0), l0, q, m, k, drawParticleRadius)
            );

        // attach springs to each other
        this.springs[0].attachPointLeft  = this.staticPoints[0];
        this.springs[0].attachPointRight = this.springs[1];

        this.springs[this.springs.length - 1].attachPointRight = this.staticPoints[1];
        this.springs[this.springs.length - 1].attachPointLeft  = this.springs[this.springs.length - 2];

        for (let i = 1; i < this.springs.length - 1; i++) {
            this.springs[i].attachPointLeft  = this.springs[i - 1];
            this.springs[i].attachPointRight = this.springs[i + 1];
        }

        // initial impact
        this.springs[0].pos.y = -3;
    }

    update(dt) {
        for (let i = 0; i < this.springs.length; i++)
            this.springs[i].calculateForces(dt);

        for (let i = 0; i < this.springs.length; i++)
            this.springs[i].update(dt);
    }

    draw(drawer) {
        for (let i = 0; i < this.springs.length; i++)
            this.springs[i].draw(drawer);

        drawer.noStroke().fill(170, 170, 170);

        for (let i = 0; i < this.staticPoints.length; i++)
            drawer.circle(this.staticPoints[i].pos.x, this.staticPoints[i].pos.y, this.staticPoints[i].drawRadius);
    }
}
