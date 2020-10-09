class Spring {
    constructor(attachPointLeft, attachPointRight, initialPos = new Vector(), l0, q, m, k, drawRadius) {
        this.attachPointLeft  = attachPointLeft;
        this.attachPointRight = attachPointRight;

        this.drawRadius = drawRadius;

        this.currentForce = new Vector();

        this.pos   = initialPos;
        this.vel   = new Vector(0, 0);
        this.acc   = new Vector(0, 0);

        this.l0 = l0;  // m
        this.q  = q;   // N/m
        this.m  = m;   // kg
        this.k  = k;   // N/m

        this.showForces = false;
    }

    calculateForces(dt) {
        this.springForceLeft  = (this.pos.copy()).sub(this.attachPointLeft.pos).sub(this.l0).mult(-this.q);
        this.springForceRight = (this.attachPointRight.pos.copy()).sub(this.pos).sub(this.l0).mult(this.q);
        this.fluidFriction = Vector.mult(this.vel, -this.k);
    }

    update(dt) {
        this.acc.clear();
        this.acc.add(this.springForceLeft);  // spring force from left attach point
        this.acc.add(this.springForceRight); // spring force from right attach point
        this.acc.add(this.fluidFriction); // fluid forces
        this.acc.div(this.m);

        this.vel.add(this.acc.mult(dt));
        this.pos.add((this.vel.copy()).mult(dt));
    }

    draw(drawer) {
        drawer
            .noFill()
            .stroke(255, 255, 255)
            .strokeWeight(1)
            .line(
                this.attachPointLeft.pos.x + this.attachPointLeft.drawRadius, this.attachPointLeft.pos.y,
                this.pos.x - this.drawRadius, this.pos.y
            );

        if (this.attachPointRight.type == 'static')
            drawer.line(
                this.pos.x + this.drawRadius, this.pos.y,
                this.attachPointRight.pos.x + this.attachPointRight.drawRadius, this.attachPointRight.pos.y
            );

        drawer
            .noStroke()
            .fill(70, 255, 70)
            .circle(this.pos.x, this.pos.y, this.drawRadius)
        ;

        if (this.showForces) {
            this.springForceLeft.color = 'red';
            this.springForceLeft.draw(this.pos);

            this.springForceRight.color = 'green';
            this.springForceRight.draw(this.pos);
        }
    }
}
