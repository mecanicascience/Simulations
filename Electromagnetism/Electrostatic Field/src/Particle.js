class Particle {
    static SPEED = 3;
    static DRAW_RADIUS = 10;

    constructor(x, y, q, r) {
        this.pos = new Vector(x, y);
        this.q = q;
        this.r = Models.particleRadius;
    }

    update(dt) {

    }

    draw(drawer) {

    }
}
