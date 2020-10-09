const SPRING_DRAW_RADIUS = 0.2;

class Spring {
    constructor(attachPoint, caracteristicLength, initialPos = new Vector(), q = 1, k = 0.3) {
        this.attachPoint  = attachPoint;
        this.posEq        = caracteristicLength;
        this.currentForce = new Vector();

        this.pos   = initialPos.add(attachPoint.pos);
        this.vel   = new Vector(0, 0);
        this.acc   = new Vector(0, 0);

        this.q = q;   // N/m
        this.m = 0.5; // kg
        this.k = k;   // N/m

        this.showForces = false;
    }

    calculateForces(dt) {
        this.springForce   = (this.pos.copy()).sub(this.attachPoint.pos).sub(this.posEq).mult(-this.q);
        this.fluidFriction = Vector.mult(this.vel, -this.k);
    }

    update(dt) {
        this.acc.clear();
        this.acc.add(this.springForce);   // spring force
        this.acc.add(this.fluidFriction); // fluid forces
        this.acc.div(this.m);

        this.vel.add(this.acc.mult(dt));
        this.pos.add((this.vel.copy()).mult(dt));
    }

    draw(drawer) {
        drawer
            .noFill()
            .stroke(255, 255, 255)
            .strokeWeight(2)
            .line(this.attachPoint.pos.x, this.attachPoint.pos.y, this.pos.x, this.pos.y)
            .noStroke()
            .fill(70, 255, 70)
            .circle(this.pos.x, this.pos.y, SPRING_DRAW_RADIUS)
        ;

        if (this.showForces) {
            this.springForce.color = 'red';
            this.springForce.draw(this.pos);
        }
    }
}
