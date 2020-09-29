let z = 20;

function runSimulator(simulator) {
    simulator
        .setEngineConfig((eC) => {
            eC.plotter.scale = { x : z, y: z };
            eC.plotter.displayGrid = false;
        })
        .addObjects(Wave, 1);
}
