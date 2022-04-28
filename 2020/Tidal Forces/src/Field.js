class Field {
    constructor() {
        let res = 10000;

        this.moon  = new Moon();
        this.earth = new Earth(res, this.moon);
    }

    update(dt) {
        this.moon .update(dt);
        this.earth.update(dt);
    }

    draw(drawer) {
        this.moon .draw(drawer);
        this.earth.draw(drawer);
    }
}
