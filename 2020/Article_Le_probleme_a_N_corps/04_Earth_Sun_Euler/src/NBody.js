class NBody {
    /** Appelé à la création de l'objet */
    constructor(mass, x0, y0, vx0, vy0, color) {
        this.mass = mass;                  // masse de l'objet
        this.pos = new Vector(x0, y0);     // position initiale de l'objet
        this.vel = new Vector(vx0, vy0);   // vitesse initiale de l'objet
        this.acc = new Vector(0, 0);       // pas d'accélération initiale
        // couleur [R, G, B] aléatoire
        this.color = color;
    }


    /** Appelé x fois/seconde
    * @param dt Le temps passé depuis la dernière update
    * @param everyObjects Liste de tous les objets de la simulation */
    update(dt, everyObjects) {
        this.pos.add(Vector.mult(this.vel, dt));
        this.vel.add(Vector.mult(this.acc, dt));

        let G = 6.67430E-11; // constante gravitationnelle
        this.acc.set(0, 0);  // on supprime l'ancienne accélération

        for(let i = 0; i < everyObjects.length; i++) {
            // si l'objet à l'index i est l'objet dont on calcule l'accélération, on continue la boucle
            if(everyObjects[i] == this)
                continue;

            // accélération pour chaque corps
            let vectDirection = Vector.sub(this.pos , everyObjects[i].pos);
            let distance      = Vector.dist(this.pos, everyObjects[i].pos);

            this.acc.add(vectDirection).mult(-G * everyObjects[i].mass).div(distance ** 3)
        }
    }


    /** Appelé 60 fois/seconde */
    draw(drawer) {
        let r = 15;

        if(Math.abs(this.pos.x) > 10**8) {
            let v = Vector.mult(this.vel, 1000000);
            v.color = [this.color[0] - 150, this.color[1] - 150, this.color[2] - 150];
            v.draw(this.pos);

            r = 5;
        }

        drawer
            .noStroke()
            .fill(this.color[0], this.color[1], this.color[2])
            .ellipse(this.pos.x, this.pos.y, r, r);
    }
}
