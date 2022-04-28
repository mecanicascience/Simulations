class MSM {
	constructor(seed) {
		this.currentNumber = seed;
		this.targetNumber  = seed;

		this.step       = 0;
		this.allSimTime = 0;
		this.iterationC = 0;

		this.animations = [
			pSAnimation.new('easeInOutCubic', 0.3),
			pSAnimation.new('easeInOutCubic', 0.3),
			pSAnimation.new('easeInOutCubic', 0.3),
			pSAnimation.new('easeInOutCubic', 0.3)
		];

		document.getElementById('nb-shown').innerHTML = this.currentNumber;
	}


	update(dt) {
		this.allSimTime += dt;

		if (this.step == 0) { // Draw two middle digits
			this.iterationC += 1;
			document.getElementById('nb-title').innerHTML = 'Itération ' + this.iterationC;

			document.getElementById('nb-shown').innerHTML = this.targetNumber;
			this.allSimTime = 0;
			this.animations[0].start();
			document.getElementById('nb-shown-bis').innerHTML = this.currentNumber;

			this.step += 1;
		}
		else if (this.step == 1 && this.allSimTime >= 2)
			this.step += 1;

		if (this.step == 2) { // Draw two middle digits fade out
			this.animations[1].start();

			this.currentNumber = this.extractNumberFrom(this.currentNumber);
			document.getElementById('nb-shown').innerHTML = this.currentNumber;

			this.step += 1;
		}
		else if (this.step == 3 && this.allSimTime >= 2.3)
			this.step += 1;



		if(this.step == 4) { // Draw square animation
			this.animations[2].start();
			this.step += 1;
		}
		else if (this.step == 5 && this.allSimTime >= 4)
			this.step += 1;



		if(this.step == 6) { // Draw square result
			this.animations[3].start();

			this.targetNumber = parseInt(this.currentNumber) ** 2;
			if((this.targetNumber + '').split('').length == 1)
				this.targetNumber = '0' + this.targetNumber;
			if((this.targetNumber + '').split('').length == 2)
				this.targetNumber = '0' + this.targetNumber;
			if((this.targetNumber + '').split('').length == 3)
				this.targetNumber = '0' + this.targetNumber;

			document.getElementById('nb-shown-bis').style     = 'opacity: 0;';
			document.getElementById('nb-shown-bis').innerHTML = this.targetNumber;

			this.step += 1;
		}
		else if (this.step == 7 && this.allSimTime >= 5) {
			this.currentNumber = this.targetNumber;

			document.getElementById('nb-shown').innerHTML = this.currentNumber;
			document.getElementById('nb-shown').style     = 'opacity: 1;';

			this.step = 0;
		}
	}


	draw(drawer) {
		if(this.step == 1) {
			document.getElementById('nb-shown-bis').style   = 'opacity: ' + this.animations[0].updateKey() + ';';
			document.getElementById('nb-underline').style   = 'opacity: ' + this.animations[0].updateKey() + ';';
			document.getElementById('nb-underline-1').style = 'opacity: ' + this.animations[0].updateKey() + ';';
			document.getElementById('nb-underline-2').style = 'opacity: ' + this.animations[0].updateKey() + ';';
		}
		else if(this.step == 3) {
			document.getElementById('nb-shown-bis').style   = 'opacity: ' + (1 - this.animations[1].updateKey()) + ';';
			document.getElementById('nb-underline').style   = 'opacity: ' + (1 - this.animations[1].updateKey()) + ';';
			document.getElementById('nb-underline-1').style = 'opacity: ' + (1 - this.animations[1].updateKey()) + ';';
			document.getElementById('nb-underline-2').style = 'opacity: ' + (1 - this.animations[1].updateKey()) + ';';
		}
		else if(this.step == 5) {
			document.getElementById('nb-square').style = 'opacity: ' + this.animations[2].updateKey() + ';';
		}
		else if(this.step == 7) {
			document.getElementById('nb-shown-bis').style = 'opacity: ' +      this.animations[3].updateKey()  + ';';
			document.getElementById('nb-square')   .style = 'opacity: ' + (1 - this.animations[3].updateKey()) + ';';
			document.getElementById('nb-shown')    .style = 'opacity: ' + (1 - this.animations[3].updateKey()) + ';';
		}
	}



	extractNumberFrom(initialNb) {
		let nb = (initialNb + '').split('');

		if (nb.length == 4)
			return nb[1] + '' + nb[2];

		if (nb.length == 6)
			return nb[2] + '' + nb[3];

		return initialNb;
	}
}
