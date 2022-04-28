class Particle {
    constructor(x0, y0, speedX, speedY) {
        // position de la particule => à t=0, définie en fonction des paramètres
        this.pos   = new Vector(x0, y0);
        this.speed = new Vector(speedX, speedY);

        // couleur aléatoire
        this.color = `rgba(
            ${parseInt(random(0, 255))},
            ${parseInt(random(0, 255))},
            ${parseInt(random(0, 255))},
            ${random(0.2, 1)}
        )`;
    }

    update(dt, everyObjects) {
        this.pos.add(this.speed);
    }

    draw(drawer) {
        // rayon défini dans la configuration personnelle
        let radius = getCustomConfig().drawSizeMultiplier;
        drawer
            .noStroke()
            .fill(this.color)
            .ellipse(this.pos.x, this.pos.y, radius, radius);
    }
}
