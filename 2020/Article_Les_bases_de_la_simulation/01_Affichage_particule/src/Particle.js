class Particle {
    constructor(x0, y0) {
        // position de la particule => à t=0, définie en fonction des paramètres
        this.pos = new Vector(x0, y0);
    }

    update(dt, everyObjects) { }

    draw(drawer) {
        // rayon défini dans la configuration personnelle
        let radius = getCustomConfig().rayonParticule;
        drawer
            .noStroke()
            .fill('rgba(255, 0, 0, 0.7)') // couleur rouge
            .ellipse(this.pos.x, this.pos.y, radius, radius);
    }
}
