class NBody {
    /** Appelé à la création de l'objet */
    constructor(mass, x0, y0, vx0, vy0, color, name) {
        this.mass = mass;                  // masse de l'objet
        this.pos = new Vector(x0, y0);     // position initiale de l'objet
        this.vel = new Vector(vx0, vy0);   // vitesse initiale de l'objet
        this.acc = new Vector(0, 0);       // pas d'accélération initiale
        // couleur [R, G, B] aléatoire
        this.color = color;

        this.path = [];
        this.name = name;
    }


    /** Appelé x fois/seconde
    * @param dt Le temps passé depuis la dernière update
    * @param everyObjects Liste de tous les objets de la simulation */
    update(dt, everyObjects) {
        this.calculNextAcc(dt, everyObjects);
        this.pos.add(Vector.mult(this.vel, dt)).add(Vector.mult(this.acc, dt*dt / 2));

        this.accCopy = this.acc.copy();
        this.calculNextAcc(dt, everyObjects);

        this.vel.add(Vector.add(this.accCopy, this.acc).mult(dt / 2));
    }

    /** Calcule la prochaine accélération à t = t+dt */
    calculNextAcc(dt, everyObjects) {
        let G = 6.67430E-11; // constante gravitationnelle
        this.acc.set(0, 0);  // on supprime l'ancienne accélération

        for(let i = 0; i < everyObjects.length; i++) {
            // si l'objet à l'index i est l'objet dont on calcule l'accélération, on continue la boucle
            if(everyObjects[i] == this)
                continue;

            // accélération pour chaque corps
            let vectDirection = Vector.sub (this.pos , everyObjects[i].pos);
            let distance      = Vector.dist(this.pos, everyObjects[i].pos);

            this.acc.add(vectDirection).mult(-G * everyObjects[i].mass).div(distance ** 3);
        }
    }


    /** Appelé 60 fois/seconde */
    draw(drawer) {
        let r = 15;

        drawer
            .noFill()
            .stroke(this.color[0], this.color[1], this.color[2]);

        if(this.name == "Terre") {
            r = 5;

            // Affichage du vecteur vitesse
            let v = Vector.mult(this.vel, 1000000);
            v.color = [this.color[0] - 150, this.color[1] - 150, this.color[2] - 150];
            v.draw(this.pos);

            // Affichage des orbites
            this.path[this.path.length] = [this.pos.x, this.pos.y];

            for (let i = 1; i < this.path.length; i++)
                drawer.line(this.path[i - 1][0], this.path[i - 1][1], this.path[i][0], this.path[i][1]);

            if(this.path.length > 1600)
                this.path.shift();
        }

        drawer
            .noStroke()
            .fill(this.color[0], this.color[1], this.color[2])
            .ellipse(this.pos.x, this.pos.y, r, r);
    }
}
