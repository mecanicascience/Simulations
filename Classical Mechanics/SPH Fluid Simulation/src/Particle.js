let H = 16;
let HSQ = H * H;
let REST_DENS = 1000;
let GAS_CONST = 2000;

let POLY6 = 315 / (65 * Math.PI * Math.pow(H, 9));
let SPIKY_GRAD = -45 / (Math.PI * Math.pow(H, 6));
let VISC_LAP = 45 / (Math.PI * Math.pow(H, 6));
let VISC = 250;

class Particle {
    constructor(r0, v0) {
        this.r = 5*10e-3; // this.r = 5*10e-3;
        // this.m = 10e-4;
        this.m = 65;

        this.lastPos = new Vector();
        this.pos = r0;
        this.vel = v0;
        this.acc = new Vector(0, 0);

        this.corr = {
            pos : new Vector(),
            vel : new Vector()
        };

        this.c = {
            viscosity : 10e-6,
            caracteristicRadius : this.r,
            restitutionCoefficient : 0.5
        };
    }


    updateSystem(dt, everyParticles) {
        this.pos.add(Vector.mult(this.vel.copy(), dt));
        this.vel.add(Vector.mult(this.acc.copy(), dt));

        this.acc.set(0, 0);
        let forces = this.generateForces(everyParticles);
        for (let i = 0; i < forces.length; i++)
            this.acc.add(forces[i].div(this.m));

        this.lastPos = this.pos;
    }

    generateForces(everyParticles) {
        let forces = [];

        // Gravity
        let g = 9.81;
        forces.push(new Vector(0, -this.m * g));

        // Air friction
        forces.push((this.vel.copy()).mult(-6 * Math.PI * this.c.viscosity * this.c.caracteristicRadius));

        let fpress = new Vector();
        let fvisc  = new Vector();
		for (let i = 0; i < everyParticles.length; i++) {
            let pj = everyParticles[i];
			if (everyParticles[i] == this)
				continue;

			let rij = Vector.sub(pj.pos, this.pos);
			let r = rij.mag();

			if (r < H) {
                // compute pressure force contribution
				fpress.add(rij.normalize().mult(-this.mass * (this.p + pj.p) / (2 * pj.rho) * SPIKY_GRAD * Math.pow(H - r, 2)));
				// compute viscosity force contribution
				fvisc.add(VISC * this.mass * (pj.v - this.v) / pj.rho * VISC_LAP * (H - r));
			}
		}
		let fgrav = new Vector(0, 12000 * -9.8 * this.rho);
		forces.push(fpress);
        forces.push(fvisc);
        forces.push(fgrav);

        return forces;
    }



    computeCorrections(boxDim, everyParticles) {
        this.corr = {
            pos : this.pos.copy(),
            vel : this.vel.copy()
        };

        this.corr = this.computeBoundariesCollisions(this.corr, boxDim);
        this.computeDensityPressure(everyParticles);
        // this.corr = this.computeNeighbourCollisions (this.corr, everyParticles);
    }

    computeBoundariesCollisions(corr, boxDim) {
        if (this.pos.x < -boxDim.width / 2 + this.r) {
            this.corr.pos.x  = -boxDim.width / 2 + this.r;
            this.corr.vel.x *= -this.c.restitutionCoefficient;
        }
        if (this.pos.x >  boxDim.width / 2 - this.r) {
            this.corr.pos.x  =  boxDim.width / 2 - this.r;
            this.corr.vel.x *= -this.c.restitutionCoefficient;
        }

        if (this.pos.y < -boxDim.height / 2 + this.r) {
            this.corr.pos.y  = -boxDim.height / 2 + this.r;
            this.corr.vel.y *= -this.c.restitutionCoefficient;
        }
        if (this.pos.y >  boxDim.height / 2 - this.r) {
            this.corr.pos.y  =  boxDim.height / 2 - this.r;
            this.corr.vel.y *= -this.c.restitutionCoefficient;
        }

        return corr;
    }

    computeNeighbourCollisions(corr, everyParticles)  {
        for (let i = 0; i < everyParticles.length; i++) {
            if (everyParticles[i] == this)
                continue;

            let p1 = this.lastPos.copy();
            let p2 = everyParticles[i].lastPos.copy();
            let p1p2 = Vector.sub(p2, p1);
            let p1p2Mag = p1p2.mag();
            let p1p2Unit = (p1p2.copy()).normalize();

            if (p1p2Mag <= 2 * this.r) {
                this.sStop = true;

                let centerDelta = Vector.mult(p1p2Unit, this.r - p1p2Mag / 2).mult(-1);
                corr.pos.add(centerDelta);

                // collision point : p1.add(Vector.mult(p1p2Unit, this.r)).add(centerDelta)
                // corr.pos.add(centerDelta);

                // this.center = p1.add(p1p2.div(2)).sub(centerDelta);
                // Vector.sub(p2, p1).normalize().mult(this.r)

                // let p2p1 = Vector.sub(p2, p1);
                // let targetDeltaPos = p2p1.div(2).add((p2p1.copy()).normalize().mult(-this.r*1.2));
                // corr.pos.add(targetDeltaPos);
                // corr.vel.add(this.projectUonV(everyParticles[i].vel, p2p1).mult(this.c.restitutionCoefficient));
                // corr.vel.sub(this.projectUonV(this             .vel, p2p1).mult(this.c.restitutionCoefficient));
            }
        }

        return corr;
    }

    projectUonV(u, v) {
        return Vector.mult(v, Vector.dot(u, v) / Vector.dot(v, v));
    }


    computeDensityPressure(everyParticles) {
        this.rho = 0;
        for (let i = 0; i < everyParticles.length; i++) {
            let rij = Vector.sub(everyParticles[i].pos, this.pos);
            let r2 = rij.mag();

            if (r2 < HSQ) {
                this.rho += this.m * POLY6 * Math.pow(HSQ - r2, 3);
            }
        }
        this.p = GAS_CONST * (this.rho - REST_DENS);
    }


    applyCorrections() {
        this.pos = this.corr.pos;
        this.vel = this.corr.vel;
    }


    draw(drawer) {
        drawer
            .noFill()
            .stroke(70, 200, 70)
            .circle(this.pos.x, this.pos.y, this.r)
        ;
    }
}
