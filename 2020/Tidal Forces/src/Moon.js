class Moon {
    constructor() {
        this.pos = new Vector(Constants.body.moon.d_toEarth, 0);
        this.theta = 0;
    }

    update(dt) {
        let omega  = 2 * Math.PI / Constants.body.moon.T;
        let dTheta = omega * dt;
        this.theta += dTheta;

        this.pos.set(
            Constants.body.moon.d_toEarth * Math.cos(this.theta),
            Constants.body.moon.d_toEarth * Math.sin(this.theta)
        );
    }

    draw(drawer) {
        drawer
            .fill(200)
            .circle(this.pos.x, this.pos.y, Constants.body.moon.r * pointersF1[2].getValue())
        ;
    }
}
