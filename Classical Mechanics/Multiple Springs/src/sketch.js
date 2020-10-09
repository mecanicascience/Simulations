// animation / plot
let MODE = 'animation';
let options = {
	plot : {
		particle_id : 1,        // right particle associated to the spring[particle_id]
		parameters  : {
			type       : 'pos',  // position / speed / acceleration
			coordinate : 'y' // x or y
		}
	},
	constants : {
		l0 : 1,
		q  : 1,
		m  : 0.5,
		k  : 0 // 0.3 N
	},
	parameters : {
		systemPointsNumber : 2, // 20
		drawParticleRadius : 0.1
	}
};

function runSimulator(simulator) {
	setupGUI();

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
			engineConf.plotter.squareByX = true;
		})
		.addObjects(Scene, 1, MODE, options)
	;
}


const params = {
	global : {
		 Mode : 0
	},
	configuration : {
		Graduation   : 100,
		'Données'    : 0,
		'Coordonnée' : 1
	}
};

function setupGUI() {
	const pane = new Tweakpane();
	const options_folder = pane.addFolder({
		title : 'Configuration'
	});
	options_folder.hidden = true;

	pane.addInput(params.global, 'Mode', { options: { animation : 0, courbes : 1 } })
		.on('change', (value) => {
			MODE = value ? 'plot' : 'animation';
			_pSimulationInstance.plotter.objectsL = [ new Scene(MODE, options) ];
			options_folder.hidden = !value;
		});

	options_folder
		.addInput(params.configuration, 'Données', { options: { position : 0, vitesse : 1, 'accélération' : 2 } })
		.on('change', (value) => {
			options.plot.parameters.type = value == 2 ? 'acc' : (value ? 'vel' : 'pos');
			_pSimulationInstance.plotter.objectsL = [ new Scene(MODE, options) ];
		});

	options_folder
		.addInput(params.configuration, 'Coordonnée', { options: { 'X' : 0, 'Y' : 1 } })
		.on('change', (value) => {
			options.plot.parameters.coordinate = value ? 'y' : 'x';
			_pSimulationInstance.plotter.objectsL = [ new Scene(MODE, options) ];
		});

	options_folder
		.addInput(params.configuration, 'Graduation', { min : 1, max : 150 })
		.on('change', (value) => {
			for (let i = 0; i < _pSimulationInstance.plotter.objectsL[0].datas.points.length; i++) {
				_pSimulationInstance.plotter.objectsL[0].datas.points[i].x
				 = _pSimulationInstance.plotter.objectsL[0].datas.points[i].xRaw / value - 2;
			}
		});
}
