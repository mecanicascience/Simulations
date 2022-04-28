function runSimulator(simulator) {
	simulator
		.setEngineConfig((engineConf) => {
			engineConf.plotter.scale = {
				x: 2,
				y: 2,
			 };
		})
		.addObjects(Plotter, 1)
	;
}
