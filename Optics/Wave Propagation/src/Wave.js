class Wave {
	constructor() {
		this.t = 0;

		this.widthRelativeX =
			  _pSimulationInstance.config.engine.plotter.scale.x
			+ _pSimulationInstance.config.engine.plotter.offset.x;
		this.widthRelativeY =
			  _pSimulationInstance.config.engine.plotter.scale.y
			+ _pSimulationInstance.config.engine.plotter.offset.y;

		this.offset = new Vector(
            _pSimulationInstance.config.engine.plotter.offset.x,
            _pSimulationInstance.config.engine.plotter.offset.y
        );

        this.scale = new Vector(
            _pSimulationInstance.config.engine.plotter.scale.x,
            _pSimulationInstance.config.engine.plotter.scale.y
        );
	}

	update(dt) {
		this.t += dt;

		this.updateWave(dt, this.t);
	}

	draw(drawer) {
		this.drawWave(drawer);
	}
}
