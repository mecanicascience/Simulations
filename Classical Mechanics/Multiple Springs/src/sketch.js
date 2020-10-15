// animation / plot
let MODE = 'animation';
let options = {
	plot : {
		particle_id : 1,        // right particle associated to the spring[particle_id]
		parameters  : {
			type       : 'pos',  // position / speed / acceleration
			coordinate : 'x' // x or y
		}
	},
	constants : {
		l0 : 1,
		q  : 1,
		m  : 0.5,
		k  : 0.3 // 0.3 N
	},
	parameters : {
		systemPointsNumber : 2, // 20
		drawParticleRadius : 0.1,
		lockOnX : true
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
			engineConf.plotter.displayGrid = false;
		})
		.addObjects(Scene, 1, MODE, options)
	;
}


const params = {
	global : {
		 Mode : 0
	},
	configuration : {
		'Graduation' : 10,
		'Données'    : 0,
		'Coordonnée' : 0
	},
	systeme : {
		'Nombre de points' : 2,
		'Frottements (N)'  : 0.3,
		'Verouiller sur (Ox)' : true
	}
};

function setupGUI() {
	const pane = new Tweakpane();

	const options_folder   = pane.addFolder({ title : 'Graphe', expanded : false });
	const constants_folder = pane.addFolder({ title : 'Paramètres du système', expanded : true });

	// OPTIONS GRAPHE
	options_folder.hidden = true;

	pane.addInput(params.global, 'Mode', { options: { animation : 0, courbes : 1 } })
		.on('change', (value) => {
			MODE = value ? 'plot' : 'animation';
			resetScene();
			options_folder.hidden = !value;
		});

	options_folder
		.addInput(params.configuration, 'Données', { options: { position : 0, vitesse : 1, 'accélération' : 2 } })
		.on('change', (value) => {
			options.plot.parameters.type = value == 2 ? 'acc' : (value ? 'vel' : 'pos');
			resetScene();
		});

	options_folder
		.addInput(params.configuration, 'Coordonnée', { options: { 'X' : 0, 'Y' : 1 } })
		.on('change', (value) => {
			options.plot.parameters.coordinate = value ? 'y' : 'x';
			resetScene();
		});

	options_folder
		.addInput(params.configuration, 'Graduation', { min : 5, max : 40 })
		.on('change', (value) => {
			_pSimulationInstance.plotter.objectsL[0].plotter.resize(Math.round(value), null, Math.round(value), null);
		});


	// OPTIONS CONSTANTES
	constants_folder
		.addInput(params.systeme, 'Nombre de points', { min : 2, max : 150 })
		.on('change', (value) => {
			options.parameters.systemPointsNumber = Math.round(value);
			resetScene();
		});

	constants_folder
		.addInput(params.systeme, 'Frottements (N)', { min : 0, max : 1 })
		.on('change', (value) => {
			options.constants.k = value;
			resetScene();
		});

	constants_folder
		.addInput(params.systeme, 'Verouiller sur (Ox)')
		.on('change', (value) => {
			options.parameters.lockOnX = value;
			resetScene();
		});
}


function resetScene() {
	_pSimulationInstance.config.engine.plotter.scale  = { x : 10, y : 10 };
	_pSimulationInstance.config.engine.plotter.offset = { x : 8 , y : 0  };
	_pSimulationInstance.plotter.objectsL = [ new Scene(MODE, options) ];

	if (MODE == 'animation')
		_pSimulationInstance.config.engine.plotter.displayGrid = false;
	else
		_pSimulationInstance.config.engine.plotter.displayGrid = true;
}
