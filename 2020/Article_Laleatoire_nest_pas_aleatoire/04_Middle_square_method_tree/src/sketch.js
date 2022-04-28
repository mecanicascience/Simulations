function runSimulator(simulator) {
	simulator
		.setEngineConfig((engineConf) => {
			engineConf.plotter.scale = {
				x: 11,
				y: 11,
			};

			engineConf.plotter.displayGrid = false;
		})
		.addObjects(MSMT, 1)
	;
}
