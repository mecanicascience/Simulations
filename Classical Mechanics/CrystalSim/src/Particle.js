class Particle {
    constructor(pID, pos) {
        this.pID = pID;

        // Physics
        this.kappa = 0.6 * 10e-26; // ?
        this.mass = 1.99264*10e-26; // Using carbon atom mass

        // Simulations data
        this.initialPos = pos.copy();
        this.pos = pos;
        this.lastPos = pos.copy();
        this.acc = new Vector(0, 0);

        // User interaction
        this.selected = false;
    }


    computeForces(otherP, dt) {
        // Reset acceleration
        this.acc.set(0, 0);

        // Particle i is coupled with it's neighbors with springs
        for (let i = 0; i < 4; i++) {
            let id = new Vector(0, 0);
            // Draws only the springs to the down and right neighbors 
            switch (i) {
                case 0:
                    id.set(0, 1);
                    break;
                case 1:
                    id.set(0, -1);
                    break;
                case 2:
                    id.set(-1, 0);
                    break;
                case 3:
                    id.set(1, 0);
                    break;
            }

            // Find neighbor
            id.add(this.pID);
            if (id.x < 0 || id.x > otherP.length - 1 || id.y < 0 || id.y > otherP[0].length - 1)
                continue;

            // Compute force between this particle and the considered neighbor
            let pDx = Vector.sub(this.pos, this.initialPos);
            let opDx = Vector.sub(otherP[id.x][id.y].pos, otherP[id.x][id.y].initialPos);

            let f = opDx.sub(pDx).mult(this.kappa / this.mass);
            this.acc.add(f);
        }
    }

    update(otherP, dt) {
        // Reset user selection if mouse not pressed
        if (this.selected && !mouseIsPressed)
            this.selected = false;

        // If user selected
        if (this.selected) {
            let mPos = new Vector(
                mouseX - width * 0.5,
                -mouseY + height * 0.5
            ).div(width).mult(2).mult(_pSimulationInstance.config.engine.plotter.scale.x);

            this.pos = mPos.copy();
            this.lastPos = mPos.copy();
            return;
        }

        // Update particles position
        let tmp = this.pos.copy();
        this.pos = Vector.mult(this.pos, 2).sub(this.lastPos).add(Vector.mult(this.acc, dt*dt));
        this.lastPos = tmp;

        // Update acceleration
        this.computeForces(otherP, dt);
    }

    draw(otherP, drawer) {
        // Draw springs
        for (let i = 0; i < 2; i++) {
            let id = new Vector(0, 0);
            // Draws only the springs to the down and right neighbors 
            switch (i) {
                case 0:
                    id.set(0, 1);
                    break;
                case 1:
                    id.set(1, 0);
                    break;
            }

            id.add(this.pID);
            if (id.x < 0 || id.x > otherP.length - 1 || id.y < 0 || id.y > otherP[0].length - 1)
                continue;

            drawer
                .noFill()
                .strokeWeight(2)
                .stroke(200, 200, 200, 0.4)
                .line(this.pos.x, this.pos.y, otherP[id.x][id.y].pos.x, otherP[id.x][id.y].pos.y);
        }


        // Draw particle
        if (this.selected)
            drawer.fill(200, 100, 100);
        else
            drawer.fill(200, 200, 200);

        drawer
            .noStroke()
            .circle(this.pos.x, this.pos.y, 13 * exp(-otherP.length / 100), true);
    }
}
