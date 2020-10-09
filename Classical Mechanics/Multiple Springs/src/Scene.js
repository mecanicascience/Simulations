class Scene {
    constructor(mode, options) {
        this.datas = {
            points : []
        };
        this.mode    = mode;
        this.options = options;

        let systemPointsNumber = options.parameters.systemPointsNumber;

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
                new Spring(
                    null, null, new Vector((16-1) / systemPointsNumber * i + 1, 0),
                    options.constants.l0, options.constants.q, options.constants.m, options.constants.k,
                    options.parameters.drawParticleRadius
                )
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

        if (this.mode == 'plot') {
            let N = Math.round(params.configuration.Graduation);
            let val = this.springs[this.options.plot.particle_id];

            this.datas.points.push({
                xRaw : this.datas.points.length,
                x : this.datas.points.length / N - 2,
                y : this.springs
                    [this.options.plot.particle_id]
                    [this.options.plot.parameters.type]
                    [this.options.plot.parameters.coordinate]
            });
        }
    }

    draw(drawer) {
        if (this.mode == 'animation') {
            for (let i = 0; i < this.springs.length; i++)
                this.springs[i].draw(drawer);

            drawer.noStroke().fill(170, 170, 170);

            for (let i = 0; i < this.staticPoints.length; i++)
                drawer.circle(this.staticPoints[i].pos.x, this.staticPoints[i].pos.y, this.staticPoints[i].drawRadius);
        }
        else if (this.mode == 'plot') {
            drawer.noFill().stroke(255).strokeWeight(3);
            for (let i = 1; i < this.datas.points.length; i++)
                drawer.line(
                    this.datas.points[i - 1].x, this.datas.points[i - 1].y,
                    this.datas.points[i].x, this.datas.points[i].y
                );
        }
    }
}
