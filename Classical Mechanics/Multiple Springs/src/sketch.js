function runSimulator(simulator) {
	const SYSTEM_POINT_NUMBER = 50; // 20

	const l0 = 1;
	const q  = 1;
	const m  = 0.5;
	const k  = 0.05; // 0.3 N

	const drawParticleRadius = 0.1;


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
			// engineConf.plotter.displayGrid = true;
		})
		.addObjects(Scene, 1, SYSTEM_POINT_NUMBER, l0, q, m, k, drawParticleRadius)
	;
}
