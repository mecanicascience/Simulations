function runSimulator(simulator) {
	simulator
		.setEngineConfig((engineConf) => {
			engineConf.plotter.scale = { x: 3*10e10, y: 3*10e10 };
			engineConf.runner.simulationSpeed = 5 * 10e5;

			engineConf.plotter.displayGrid = false;
		})
		// Terre
		.addObjects(NBody, 1, 6.0e24, 0, 1.5e11, 3.0e4, 0, [173, 231, 247])
		// Soleil
		.addObjects(NBody, 1, 1.989*10**30, 0, 0, 0, 0, [246, 244, 129])
     ;
}
