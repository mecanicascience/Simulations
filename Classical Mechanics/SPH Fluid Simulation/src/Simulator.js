class Simulator {
    constructor() {
        let PARTICLE_COUNT = 100;
        this.boxDimensions = { width : 10, height : 8 };

        this.particlesArr = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            let rx = (random() * this.boxDimensions.width  - this.boxDimensions.width  / 2) * 0.9;
            let ry = (random() * this.boxDimensions.height - this.boxDimensions.height / 2) * 0.9;

            let rvx = random() * 3 - 3 / 2;
            let rvy = random() * 3 - 3 / 2;
            // let rvx = 0.8 * 50 - 50 / 2;
            // let rvy = 0.8 * 50 - 50 / 2;

            this.particlesArr.push(new Particle(new Vector(rx, ry), new Vector(rvx, rvy)));
        }
    }



    update(dt) {
        for (let i = 0; i < this.particlesArr.length; i++)
            this.particlesArr[i].updateSystem(dt, this.particlesArr);

        for (let i = 0; i < this.particlesArr.length; i++)
            this.particlesArr[i].computeCorrections(this.boxDimensions, this.particlesArr);

        for (let i = 0; i < this.particlesArr.length; i++)
            this.particlesArr[i].applyCorrections();
    }



    draw(drawer) {
        for (let i = 0; i < this.particlesArr.length; i++) {
            this.particlesArr[i].draw(drawer);
        }

        let h = this.boxDimensions.height / 2;
        let w = this.boxDimensions.width  / 2;

        drawer
            .stroke(255)
            .strokeWeight(2)
            .noFill()
            .line(-w, -h,  w, -h)
            .line(-w,  h,  w,  h)
            .line( w, -h,  w,  h)
            .line(-w, -h, -w,  h)
        ;
    }
}
