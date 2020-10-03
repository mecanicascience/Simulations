class Wave {
	constructor() {
		this.t = 0;
		this.offset = 8;
	}

	update(dt) {
		this.t += dt;
	}

	draw(drawer) {
		let mult = 30;
		for (let x = -z*mult; x < z*mult; x++) {
			let amp = this.amplitude('Stationary', x / mult, this.t);
/*			drawer
				.noStroke()
				.fill('red')
				.ellipse(x / mult, amp * 3, 10, 10);
			drawer
				.stroke('gray')
				.noFill()
				.line(x / 2, 3, x / 2, -3);*/
			 drawer
				.noStroke()
				.fill('gray')
				.ellipse(x / mult, amp.a* 3, 3, 3);
			drawer
				.noStroke()
				.fill('gray')
				.ellipse(x / mult, amp.b * 3, 3, 3);
			drawer
				.noStroke()
				.fill('red')
				.ellipse(x / mult, amp.c * 3, 3, 3);
		}
	}

	amplitude(c, x, t) {
		if(c == 1 || c == 'Sinusoid') {
			// Onde sinusoidale
			let k = 2;
			let w = 0.2;
			return Math.sin(k*x - w * t);
		}
		else if(c == 2 || c == 'Progressive') {
			// Onde progressive
			let v = 10;
			return 3*Math.exp(-Math.pow(x - v*t + this.offset, 2));
		}
		else if(c == 3 || c == 'Dispersion') {
			// Phénomène de dispersion
				let dk = 1;
				let dw = 5;
				let k = 10;
				let w = 20;
				// return Math.cos(k/2*x-w/2*t) + Math.cos((k + dk)/2*x-(w + dw)/2*t);
				return { a : Math.cos(dk/2*x-dw/2*t), b : Math.cos((k + dk/2)*x-(w + dw/2)*t)};
		}
		else if(c == 4 || c == 'Stationary') {
			// Stationnaire
			//t = 0;
			let k = 2;
			let w = 2;
			return { a: Math.sin(k*x - w*t), b : Math.sin(k*x + w*t), c : 2 * Math.cos(w*t) * Math.cos(k*x) };
		}
		else if(c == 5 || c == 'Beat') {
			// Battements
			// let v1 = 0.1;
			// let v2 = 1.2;
			let k = 10;
			return Math.cos(k*x) * Math.cos((v1 + v2) * 2*Math.PI*t);
		}
		else if(c == 6 || c == 'Modulated') {
			// Signal modulé
			let v1 = 0.1;
			let v2 = 1.2;
			let b = 3;
			return Math.cos(x + v1*t) + b/2 * Math.cos(x + (v1 + v2)*t) + b/2 * Math.cos(x + (v1 - v2)*t);
		}
	}
}
