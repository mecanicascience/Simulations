class Grapher {
    constructor() {
        this.configGUI();
        this.waves = [ new ColorCircularWave2D(this.optionsGUI) ];
    }

    update(dt) {
        for (let i = 0; i < this.waves.length; i++)
            this.waves[i].update(dt);
    }

    draw(drawer) {
        for (let i = 0; i < this.waves.length; i++)
            this.waves[i].draw(drawer);
    }


    configGUI() {
        this.optionsGUI = new OptionsGUI();
        this.optionsGUI.addFolder('\\text{Type de simulation}', 'root', 'simulation_type');

        this.optionsGUI.addFolder('\\text{Onde plane}', this.optionsGUI.datas.simulation_type, 'plane');
        this.planeWaveList = this.optionsGUI.addList('\\text{Ondes}',
            { 'Harmonique 1D' : 0, 'Harmonique 2D' : 1, 'Colorée' : 2 },
            0, _optionsGUIInstance.datas.simulation_type.plane
        );
        this.optionsGUI.addButton('\\text{Simuler}', () => this.setupWavePlane(), _optionsGUIInstance.datas.simulation_type.plane);

        this.optionsGUI.addFolder('\\text{Onde circulaire}', this.optionsGUI.datas.simulation_type, 'circular');
        this.circularWaveList = this.optionsGUI.addList('\\text{Ondes}',
            { 'Colorée' : 0 },
            0, _optionsGUIInstance.datas.simulation_type.circular
        );
        this.optionsGUI.addButton('\\text{Simuler}', () => this.setupWaveCircular(), _optionsGUIInstance.datas.simulation_type.circular);
    }



    setupWavePlane() {
        let val = this.planeWaveList();
        this.optionsGUI.reset();
        this.configGUI();
        document.getElementsByClassName('tp-dfwv')[document.getElementsByClassName('tp-dfwv').length - 2].innerHTML = '';

        if (val == 0)
            this.waves = [ new HarmonicPlaneWave1D(this.optionsGUI) ];
        else if (val == 1)
            this.waves = [ new HarmonicPlaneWave2D(this.optionsGUI) ];
        else
            this.waves = [ new ColorPlaneWave2D(this.optionsGUI) ];
    }

    setupWaveCircular() {
        let val = this.planeWaveList();
        this.optionsGUI.reset();
        this.configGUI();
        document.getElementsByClassName('tp-dfwv')[document.getElementsByClassName('tp-dfwv').length - 2].innerHTML = '';

        if (val == 0)
            this.waves = [ new ColorCircularWave2D(this.optionsGUI) ];
    }
}
