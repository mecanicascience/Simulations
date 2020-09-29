class Earth {
    constructor(res, moon) {
        this.res = res;
        this.resPoints = [];
        this.moon = moon;
    }

    update(dt) {
        this.resPoints = [];
        for (let i = 0; i < this.res; i++) {
            let pt = new Vector(
                Math.cos(2 * Math.PI / this.res * i) * Constants.body.earth.r * pointersF1[2].getValue() * 1.1,
                Math.sin(2 * Math.PI / this.res * i) * Constants.body.earth.r * pointersF1[2].getValue() * 1.1
            );
            pt.add(this.deltaK(pt));
            this.resPoints.push(pt);
        }
    }

    draw(drawer) {
        // DRAW WATER
        drawer
            .noStroke()
            .fill(50, 50, 200);

        drawer.beginShape();
        for (let i = 0; i < this.resPoints.length; i++) {
            drawer.vertex(this.resPoints[i].x, this.resPoints[i].y, 10, 10, true);
        }
        drawer.endShape();


        // DRAW EARTH
        drawer
            .fill(40, 120, 40)
            .circle(0, 0, Constants.body.earth.r * pointersF1[2].getValue())
        ;
    }



    deltaK(vec) {
        let deltaK1 = new Vector(this.moon.pos.x - vec.x, this.moon.pos.y - vec.y);
        deltaK1 = deltaK1.div(deltaK1.mag()**3);

        let deltaK2 = new Vector(this.moon.pos.x - 0, this.moon.pos.y - 0);
        deltaK2 = deltaK2.div(deltaK2.mag()**3);

        return (deltaK1.sub(deltaK2)).mult(Constants.G).mult(Constants.body.moon.m).mult(5*100000000000*pointersF1[3].getValue()/10);
    }
}
