class Particle {
    constructor(x0, y0, positionName, vectorName) {
        // position de la particule => à t=0, définie en fonction des paramètres
        this.point = new Point(x0, y0, "#FFFFFF", positionName, undefined, vectorName);

        // couleur du vecteur de la particule
        this.point.pos.color = "#bfbcbc";
        this.point.textPadding = 0.9;
    }

    update(dt, everyObjects) { }

    draw(drawer) {
        this.point.draw(drawer, false);
    }
}
