function runSimulator(simulator) {
	simulator
		.setEngineConfig((engineConf) => {
			engineConf.plotter.scale = { x: 3*10e5, y: 3*10e5 };

			engineConf.plotter.displayGrid = false;
		})
		.addObjects(
			NBody,	// référence à la classe de la particule
			50,	// nombre de particules à créer simultanément
			// masse de chaque particule en kg
			["_RUN_F", random, 10**26, 10**27],
			// position X0 et Y0 aléatoire entre -1 millions et 1 millions de mètres
			["_RUN_F", random, -10e5, 10e5], ["_RUN_F", random, -10e5, 10e5],
			// vitesse vx0 et vy0 aléatoire entre -5 et 5 m.s^-1
			["_RUN_F", random, -5*10e3, 5*10e3], ["_RUN_F", random, -5*10e3, 5*10e3]
		)
     ;
}
