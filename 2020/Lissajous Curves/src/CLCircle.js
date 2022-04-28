class CLCircle {
    constructor(x0, y0, r, T, type, colorVec) {
        this.T     = T;
        this.pos0  = new Vector(x0, y0);
        this.omega = 2*Math.PI/T;
        this.r     = r;
        this.pos   = new Vector(this.r, 0);
        this.type  = type;
        this.t = 0;
        this.colorVec = colorVec;
    }

    update(dt) {
        this.t += dt;

        this.pos.set(
            this.r * Math.cos(this.omega * this.t),
            this.r * Math.sin(this.omega * this.t)
        );
    }

    draw(drawer) {
        drawer
            // Circle
            .noFill()
            .stroke(this.colorVec.r, this.colorVec.g, this.colorVec.b)
            .strokeWeight(3)
            .ellipse(this.pos0.x, this.pos0.y, this.r, this.r)
            // Dot on circle
            .fill(this.colorVec.r, this.colorVec.g, this.colorVec.b)
            .noStroke()
            .ellipse(this.pos0.x + this.pos.x, this.pos0.y + this.pos.y, 20, 20, true)
            // Traits
            .noFill()
            .stroke(this.colorVec.r, this.colorVec.g, this.colorVec.b);
        this.type == 'TOP'
            ? drawer.line(this.pos0.x + this.pos.x, this.pos0.y + this.pos.y, this.pos0.x + this.pos.x, -height)
            : drawer.line(this.pos0.x + this.pos.x, this.pos0.y + this.pos.y, width, this.pos0.y + this.pos.y)
        ;
    }
}
