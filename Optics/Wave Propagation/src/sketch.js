function runSimulator(simulator) {
    let z = 20;

    simulator
        .setEngineConfig((eC) => {
            eC.plotter.scale  = { x : z, y : z };
            eC.plotter.offset = { x : z, y : 0 };
            // eC.plotter.displayGrid = true;
            eC.plotter.squareByX = true;
        })
        .addObjects(Grapher, 1);

    pixelDensity(1);
}
