const defaultZoomVal = 80*10**7;

class pSimulationText {
    'Zoom (%)' = 100;
    'Zoom' = 1.07;
    'Accentuation' = 1;
    'Vitesse Sim' = 1000000;

    updatedZoom() {
        let nZoom = pointersF1[0].getValue();
        _pSimulationInstance.config.engine.plotter.scale = {
            x : defaultZoomVal / nZoom * 100,
            y : defaultZoomVal / nZoom * 100
        };
    }

    updatedSpeed() {
        let nSpeed = pointersF1[1].getValue();
        _pSimulationInstance.config.engine.runner.simulationSpeed = nSpeed;
    }
}


let gui;
let pSParam = {};
let pointersF1 = [];
function createInterfaceDatGui() {
    let pStext = new pSimulationText();
    gui = new dat.GUI();

    pSParam.f1 = gui.addFolder('Simulation');
    pointersF1.push(pSParam.f1.add(pStext, 'Zoom (%)', 100, 5000).onChange(pStext.updatedZoom));
    pointersF1.push(pSParam.f1.add(pStext, 'Vitesse Sim', 1, 1000000).onChange(pStext.updatedSpeed));
    pSParam.f1.open();

    pSParam.f2 = gui.addFolder('Marées');
    pointersF1.push(pSParam.f2.add(pStext, 'Zoom', 1, 10));
    pointersF1.push(pSParam.f2.add(pStext, 'Accentuation', 1, 100));
    pSParam.f2.open();
}




function runSimulator(simulator) {
    createInterfaceDatGui();

    simulator
        .setEngineConfig((eC) => {
            eC.plotter.scale = { x : defaultZoomVal, y : defaultZoomVal };
            // eC.plotter.displayGrid = true;
            eC.plotter.squareByX = true;
            eC.plotter.movable = true;
            eC.runner.simulationSpeed = 1000000;
        })
        .addObjects(Field, 1);
}
