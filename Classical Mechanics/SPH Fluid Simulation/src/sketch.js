function runSimulator(simulator) {
    simulator
        .setEngineConfig((eC) => {
            eC.plotter.scale = { x : 10, y : 10 };
            // eC.plotter.displayGrid = true;
            eC.plotter.squareByX = true;
        })
        .addObjects(Simulator, 1);
}
