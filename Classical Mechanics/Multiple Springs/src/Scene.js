class Scene {
    constructor(mode, options) {
        this.mode         = mode;
        this.options      = options;
        this.springs      = [];
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

        if (this.mode == 'plot') {
            if (this.options.plot.parameters.type == 'pos' && this.options.plot.parameters.coordinate == 'x')
                this.plotter = new PointsPlotter(10, 10, 10, 8);
            else
                this.plotter = new PointsPlotter(10, 10, 10, 0);
        }



        let systemPointsNumber = options.parameters.systemPointsNumber;
        if (systemPointsNumber <= 1)
            console.error("You need to simulate at least 2 points");

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
        if (options.parameters.lockOnX)
            this.springs[0].pos.x = 1;
        else
            this.springs[0].pos.y = -2;
    }

    update(dt) {
        for (let i = 0; i < this.springs.length; i++)
            this.springs[i].calculateForces(dt);

        for (let i = 0; i < this.springs.length; i++)
            this.springs[i].update(dt);

        if (this.mode == 'plot')
            this.plotter.addPoint(this.springs
                [this.options.plot.particle_id]
                [this.options.plot.parameters.type]
                [this.options.plot.parameters.coordinate]);
    }

    draw(drawer) {
        if (this.mode == 'animation') {
            for (let i = 0; i < this.springs.length; i++)
                this.springs[i].draw(drawer);

            drawer.noStroke().fill(170, 170, 170);

            for (let i = 0; i < this.staticPoints.length; i++)
                drawer.circle(this.staticPoints[i].pos.x, this.staticPoints[i].pos.y, this.staticPoints[i].drawRadius);
        }
        else if (this.mode == 'plot')
            this.plotter.draw(drawer);
    }
}
