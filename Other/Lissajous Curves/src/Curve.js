class Curve {
    constructor(x0, y0, circleLeft, circleTop) {
        this.points = [];
        this.circleLeft = circleLeft;
        this.circleTop  = circleTop;

        this.pos0 = new Vector(x0, y0);
    }

    addPoint(dt) {
        // if (this.circleLeft.t > this.circleLeft.T && this.circleTop.t > this.circleTop.T)
        //     return;
        this.points.push({x : this.circleTop.pos.x, y : this.circleLeft.pos.y});
    }

    update(dt) { }

    draw(drawer) {
        drawer
            .stroke(
                Math.round((this.circleTop.colorVec.r + this.circleLeft.colorVec.r) / 2),
                Math.round((this.circleTop.colorVec.g + this.circleLeft.colorVec.g) / 2),
                Math.round((this.circleTop.colorVec.b + this.circleLeft.colorVec.b) / 2)
            )
            .strokeWeight(3)
            .noFill()
            .beginShape();
        for (let i = 0; i < this.points.length; i++)
            drawer.vertex(this.points[i].x + this.pos0.x, this.points[i].y + this.pos0.y);
        drawer.endShape();
    }
}
