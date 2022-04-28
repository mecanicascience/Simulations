function runSimulator(simulator) {
	simulator
		// configuration du moteur
		.setEngineConfig((engineConf) => {
			// taille de l'affichage
			engineConf.plotter.scale = {
				x: 10,			// taille de l'écran en largeur <=> 10 m
				y: 10,			// taille de l'écran en hauteur <=> 20 m
			};
			engineConf.plotter.displayGrid = false; // affichage du quadriage
		})
		// ajout d'objets
		.addObjects(Point, 1, 0, 0) // origine du repère
		.addObjects(Particle, 1, ["_RUN_F", random, -8, 8], ["_RUN_F", random, -8, 8], 'M1', 'a1')
		.addObjects(Particle, 1, ["_RUN_F", random, -8, 8], ["_RUN_F", random, -8, 8], 'M2')
		.addObjects(Particle, 1, ["_RUN_F", random, -8, 8], ["_RUN_F", random, -8, 8], 'M3')
	;
}
