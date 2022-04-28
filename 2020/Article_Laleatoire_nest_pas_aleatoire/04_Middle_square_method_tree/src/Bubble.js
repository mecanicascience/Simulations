class Bubble {
    constructor(x, y, number, isInitial = false, isFinal = false) {
        this.initialPos = new Vector(x, y);

        this.pos = this.initialPos.copy();
        this.pos.add((random() * 2 - 1) * 1, (random() * 2 - 1) * 1);
        this.vel = new Vector(0, 0);
        this.vel.add((random() * 2 - 1) * 3, (random() * 2 - 1) * 3);
        this.acc = new Vector(0, 0);

        this.number = new pSText(number >= 10 ? '' + number : '0' + number, (this.pos.copy()).sub(0, 0), 1.5, 'white');

        this.isInitial = isInitial;
        this.isFinal   = isFinal;
    }

    update(dt, cursorPos) {
        this.acc.clear();

        let k = [3, 500, 0.02];

        // Mouse Avoiding Target
        let r = Vector.dist(this.pos, cursorPos);
        this.acc.add(((this.pos.copy()).sub(cursorPos)).mult(1 / r**3 * k[0]));

        // Hooke force
        let r2 = Vector.dist(this.initialPos, this.pos);
        this.acc.add((this.initialPos.copy()).sub(this.pos).mult(k[1] * r2));

        // Friction
        this.acc.add((this.vel.copy()).mult(-k[2] * this.vel.mag()));

        this.vel.add(this.acc.mult(dt));
        this.pos.add((this.vel.copy()).mult(dt*dt));

        this.number.setPosition(this.pos.x, this.pos.y);
    }

    draw(drawer) {
        drawer
            .fill(this.isInitial ? 'rgba(20, 150, 20, 1)' : (this.isFinal ? 'rgba(150, 20, 20, 1)' : 'rgba(120, 120, 120, 1)'))
            .noStroke()
            .strokeWeight(2)
            .ellipse(this.pos.x, this.pos.y, 40, 40)
        ;

        this.number.draw();
    }
}
