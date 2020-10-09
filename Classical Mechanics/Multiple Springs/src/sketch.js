function runSimulator(simulator) {
	simulator
		.setEngineConfig((engineConf) => {
			engineConf.plotter.scale = {
				x : 10,
				y : 10,
			};
			engineConf.plotter.offset = {
				x : 8,
				y : 0,
			};
			engineConf.plotter.squareByX   = true;
			engineConf.plotter.displayGrid = true;
		})
		.addObjects(Scene, 1)
	;
}
