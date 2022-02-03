function runSimulator(simulator) {
    simulator
        .setEngineConfig((eC) => {
            eC.plotter.scale = { x: 5, y: 5 };
            eC.plotter.offset = { x: 0, y: 0 };
            eC.plotter.displayGrid = false;
            eC.plotter.squareByX = true;
        })
        .addObjects(Simulator, 1);
}
