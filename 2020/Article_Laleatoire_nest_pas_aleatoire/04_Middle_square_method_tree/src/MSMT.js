class MSMT {
	constructor() {
		this.sequenceNumbers = [];

		this.bubbleNumber = [];

		this.start = false;
	}

	startSimulation(seed) {
		document.getElementById('buttons').style = 'display: none;';

		let lastVal = seed;
		while ((lastVal != this.sequenceNumbers[this.sequenceNumbers.length - 1]) && lastVal != 24) {
			this.sequenceNumbers.push(lastVal);
			lastVal = this.extractNumberFrom(lastVal ** 2);

			if (this.sequenceNumbers.length > 30) break;
		}

		if (lastVal == 24)
			this.sequenceNumbers.push(24);
		if (this.sequenceNumbers[this.sequenceNumbers.length - 1] == 24)
			this.sequenceNumbers.push(57);


		this.start = true;

		this.addBubbles(this.sequenceNumbers);
	}


	update(dt) {
		if(!this.start)
			return;

		let pos = _pSimulationInstance.plotter.computeForXYFromPixel(mouseX, mouseY);
		for (let i = 0; i < this.bubbleNumber.length; i++)
			this.bubbleNumber[i].update(dt, pos);
	}


	draw(drawer) {
		if(!this.start)
			return;

		for (let i = 0; i < this.bubbleNumber.length - 1; i++)
			drawer
				.noFill()
				.stroke(255)
				.strokeWeight(3)
				.line(
					this.bubbleNumber[i]    .pos.x, this.bubbleNumber[i]    .pos.y,
					this.bubbleNumber[i + 1].pos.x, this.bubbleNumber[i + 1].pos.y
				);

		for (let i = 0; i < this.bubbleNumber.length; i++)
			this.bubbleNumber[i].draw(drawer);
	}


	extractNumberFrom(initialNb) {
		let nb = (initialNb + '').split('');

		if (nb.length == 1)
			nb.unshift('0');
		if (nb.length == 2)
			nb.unshift('0');
		if (nb.length == 3)
			nb.unshift('0');

		if (nb.length == 4)
			return parseInt(nb[1] + '' + nb[2]);

		if (nb.length == 6)
			return parseInt(nb[2] + '' + nb[3]);

		return initialNb;
	}


	addBubbles(seq) {
		// 1 - 15 : taille cycle
		let cycleSize = seq.length;

		if (cycleSize <= 8) {
			let k = [];
			if (cycleSize <= 6)
				k = [1, 2, 2, 2, 2, 2, 2];
			else if (cycleSize <= 7)
				k = [0, 2, 2, 2, 2, 2, 2, 2];
			else if (cycleSize <= 8)
				k = [-1, 2, 2, 2, 2, 2, 2, 2, 2];

			for (let i = 0; i < seq.length; i++)
				this.bubbleNumber.push(
					new Bubble(
						i * (16 / cycleSize) - cycleSize - k[0],
						random() * 10 / 2 - k[i + 1],
						seq[i],
						i == 0 ? true : false
					)
				);
		}
		else {
			for (let i = 0; i < 8; i++)
				this.bubbleNumber.push(
					new Bubble(
						i * (16 / 7) - 7 + 0,
						random() * 10 / 2 + 2,
						seq[i],
						i == 0 ? true : false
					)
				);

			this.bubbleNumber.push(new Bubble(6 * (16 / 7) - 7 + 1, -2, seq[8], false));

			for (let i = 9; i < seq.length; i++)
				this.bubbleNumber.push(
					new Bubble(
						6 * (16 / 7) - 2 - 2.5 * i + 15,
						random() * 10 / 2 - 6,
						seq[i],
						false
					)
				);
		}

		this.bubbleNumber[this.bubbleNumber.length - 1].isFinal = true;
	}
}
