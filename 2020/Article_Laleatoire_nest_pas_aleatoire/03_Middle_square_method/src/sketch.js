function runSimulator(simulator) {
	simulator
		.setEngineConfig((engineConf) => {
			engineConf.plotter.displayGrid = false;
		})
		.addObjects(MSM, 1, Math.round(Math.random() * 100))
	;
}
