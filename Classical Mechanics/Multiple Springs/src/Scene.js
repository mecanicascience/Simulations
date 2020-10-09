class Scene {
    constructor() {
        this.staticPoints = [
            {
                pos  : new Vector(0, 0),
                type : 'static',
                id   : 'left attach point'
            },
            {
                pos  : new Vector(15, 0),
                type : 'static',
                id   : 'right attach point'
            }
        ];

        this.springs = [
            new Spring(this.staticPoints[0], new Vector( 1, 0), new Vector( 2, 0)),
            new Spring(this.staticPoints[1], new Vector(-1, 0), new Vector(-2, 0))
        ];
        this.springs.push(new Spring(this.springs[1], new Vector(-1, 0), new Vector(-2, 0), 20, 0.6));
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
            drawer.circle(this.staticPoints[i].pos.x, this.staticPoints[i].pos.y, 0.1);
    }
}
