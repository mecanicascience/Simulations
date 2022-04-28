function runSimulator(simulator) {
	simulator
		.setEngineConfig((engineConf) => {
			engineConf.plotter.displayGrid = false;
		})
		.addObjects(Timestamper, 1)
	;
}


class Timestamper {
	constructor() {}

	update() {
		document.getElementById('nb-timestamp').innerHTML = Date.now();
	}

	draw() {}
}
