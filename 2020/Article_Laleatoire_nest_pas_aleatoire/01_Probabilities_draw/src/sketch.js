function runSimulator(simulator) {
	simulator
		.setEngineConfig((engineConf) => {
			engineConf.plotter.scale = {
				x: 7,
				y: 7,
			};
			engineConf.plotter.displayGrid = false;
		})
		.addObjects(Plotter, 1)
	;
}
