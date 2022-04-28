function runSimulator(simulator) {
	let speedL = 0.5;      		// vitesse maximum
	let positionL = 100; 		// position initiale
	let particlesCount = 500; 	// nombre de particules

	simulator
		// configuration du moteur
		.setEngineConfig((engineConf) => {
			// taille de l'affichage
			engineConf.plotter.scale = {
				x: positionL * 1.2,			// taille de l'écran en largeur <=> 100 m
				y: positionL * 1.2,			// taille de l'écran en hauteur <=> 100 m
			};
			engineConf.plotter.displayGrid = false; // affichage du quadriage
		})
		// variables personnelle
		.setCustomConfig((customConf) => {
			customConf.drawSizeMultiplier = 6;
		})
		// ajout d'objets
		.addObjects(
			Particle, 	// classe de la particule
			particlesCount, 		// nombre de particules
			// positions X et Y initiales aléatoire
			["_RUN_F", random, -positionL, positionL], ["_RUN_F", random, -positionL, positionL],
			// vitesse aléatoire en X et Y
			["_RUN_F", random, -speedL, speedL]      , ["_RUN_F", random, -speedL, speedL]
		)
	;
}
