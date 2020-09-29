class Scene {
    constructor() {
        let multColor = Math.random() * 10;
        let offset    = Math.random() * 0.5;
        let initW = 1;
        this.lastTime = 0;

        this.circlesLeft = []; // 1/height*40000
        for (let i = 0; i < Math.round(height / 50); i++) {
            this.circlesLeft.push(new CLCircle(-3, -i * 3, 0.8, initW * (i+1), 'LEFT', hslToRgb(i*multColor/100 + offset, 1, 0.5)));
        }

        this.circlesTop = []; // 1/width*40000
        for (let i = 0; i < 20; i++) {
            this.circlesTop.push(new CLCircle(i * 3, 0, 0.8, initW * (i+1), 'TOP', this.circlesLeft[i] == undefined ? hslToRgb(i*multColor/100 + offset, 1, 0.5) : this.circlesLeft[i].colorVec));
        }


        this.curves = [];
        for (let j = 0; j < this.circlesLeft.length; j++) {
            for (let i = 0; i < this.circlesTop.length; i++) {
                this.curves.push(new Curve(i*3, -j*3, this.circlesLeft[j], this.circlesTop[i]));
            }
        }
    }

    update(dt) {
        for (let i = 0; i < this.circlesLeft.length; i++)
            this.circlesLeft[i].update(dt);

        for (let i = 0; i < this.circlesTop.length; i++)
            this.circlesTop[i].update(dt);

        for (let i = 0; i < this.curves.length; i++)
            this.curves[i].addPoint(dt);
    }

    draw(drawer) {
        push();
        translate(0, -_pSimulationInstance.plotter.computeForXYZ(0, 0).y + 200 - 90);
        for (let i = 0; i < this.circlesTop.length; i++)
            this.circlesTop[i].draw(drawer);

        translate(0, 90);

        for (let i = 0; i < this.curves.length; i++)
            this.curves[i].draw(drawer);

        for (let i = 0; i < this.circlesLeft.length; i++)
            this.circlesLeft[i].draw(drawer);

        pop();
    }
}




function hslToRgb(h, s, l) {
    let r, g, b;

    if(s == 0) {
        r = g = b = l; // achromatic
    }
    else {
        let hue2rgb = function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        let p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return {r : Math.round(r * 255), g : Math.round(g * 255), b : Math.round(b * 255)};
}
