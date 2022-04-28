class Plotter {
    constructor() {
        this.votesList = [2, 3, 7, 2, 9, 5, 5, 13, 8, 2, 10];
        this.texts     = [];
        this.textsBottom = [];

        let nb = 0;
        for (let i = 0; i < this.votesList.length; i++) {
            this.texts[i]       = new pSText(this.votesList[i] + '', new Vector(i - 5.2, 0.5), 2, 'white');
            this.textsBottom[i] = new pSText(i + '', new Vector(i - 5.2, -6.5), 3, 'black');
            nb += this.votesList[i];
        }

        this.topText = new pSText(
            nb + '\\text{ personnes ont participé à ce sondage}',
            new Vector(-0.5, _pSimulationInstance.config.engine.plotter.scale.y - 0.8),
            3,
            'white'
        );


        this.keyVal = 0;
        this.start  = false;

        this.anim = pSAnimation.new('easeInOutCubic', 3, {min : 0,  max : 1});

        this.max = this.getMaxVotes();

        _pSimulationInstance.plotter.drawer.rect = function(x, y, w, h) {
            let v0 = this.plotter.computeForXY(x, y);
            let v1 = this.plotter.computeForXY(
                -_pSimulationInstance.config.engine.plotter.scale.x + w,
                _pSimulationInstance.config.engine.plotter.scale.y + h
            );
            rect(v0.x, v0.y, v1.x, v1.y);
            return this;
        };

        window.animation = this;
    }

    getMaxVotes() {
        this.max = this.votesList[0];
        for (let i = 1; i < this.votesList.length; i++)
            if(this.votesList[i] > this.max)
                this.max = this.votesList[i];
        return this.max;
    }

    update(dt, everyObjects) {
        this.keyVal = this.anim.updateKey();

        for (let i = 0; i < this.votesList.length; i++) {
            let h = this.start ? this.keyVal * (this.votesList[i] / this.max) * 11 : -1;
            // if(this.keyVal == 1)
                // this.texts[i].setText(Math.round(this.votesList[i] + '') + '');
            // else
                // this.texts[i].setText(Math.round(h + '') + '');

            this.texts[i].pos.y = h - 6.9 + 1;
        }
    }

    draw(drawer) {
        let paddX = 5.2;
        let paddY = 6.5;
        let t     = 0.5;
        for (let i = 0; i < this.votesList.length; i++) {
            let h = this.start ? this.keyVal * (this.votesList[i] / this.max) * 11 : -1;

            drawer
                .stroke('white')
                .strokeWeight(5)
                .fill('gray')
                .rect(i-paddX-0.4, -paddY + t, 0.8, h + t)
                .fill('white')
                .rect(-6.5, -paddY + t, 12.5, -4 + t)
            ;
        }

        for (var i = 0; i < this.votesList.length; i++) {
            this.texts[i]      .draw();
            this.textsBottom[i].draw();
            this.topText       .draw();
        }

        if(!this.start)
            background('rgba(10, 10, 10, 0.7)');
    }


    startAnimation(vote) {
        this.votesList[vote] += 1;

        this.start = true;
        this.anim.start();
    }
}
