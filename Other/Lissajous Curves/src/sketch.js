function runSimulator(simulator) {
	simulator
		.setEngineConfig((engineConf) => {
			engineConf.plotter.scale = {
				x : 30,
				y : 30,
			};
			engineConf.plotter.offset = {
				x : 25,
				y : -9,
			};
			engineConf.plotter.displayGrid = false;
			engineConf.plotter.squareByX = true;
		})
		.addObjects(Scene, 1)
	;
}
