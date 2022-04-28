class Plotter {
	constructor() {
		this.glHelper = new WebGLHelper();
		this.glHelper.initialize('simulationCanvas', ['EXT_color_buffer_float', 'OES_texture_float_linear']);

		// Create program
		this.particlesProgram = 'Particle Simulation';
		this.glHelper.createProgram(this.particlesProgram, vertShaderSource, fragShaderSource);


		// Create the rectangle vertices buffer (a 2x2 rectangle)
		this.squareVertBuffer = this.glHelper.setVerticesBuffer(
			this.particlesProgram,
			new Float32Array([
				-1.0, 1.0,  1.0,  1.0, 1.0, -1.0,
				-1.0, 1.0, -1.0, -1.0, 1.0, -1.0
			]), 'aPos', 2, this.glHelper.gl.FLOAT);


		// Config
		let particlesCount = 1000; // Number of particles in the simulation
		this.simulationSizeFactor = 10; // Size factor of the box of the simulation

		// Viewing config
		this.frameViewingFactor = 10; // The particles shaders data will be updated every N frames
		this.shouldDraw = true;
		this.particleDrawRadius = 30;

		// Running modes
		this.noLoop = true; // True = noLoop() - False = loop()
		this.stepMode = true; // True = use the step() fonction to go to the next frame and stop the simulation

		// Initialize simulation
		this.setupSimulation(particlesCount);


		// Add program constants
		this.glHelper.addUniform(this.particlesProgram, 'Mass', 100, 'uMass', 'float');
		this.glHelper.addUniform(this.particlesProgram, 'Gravity', 9.81, 'uGravity', 'float');
		this.glHelper.addUniform(this.particlesProgram, 'Particle Radius', 0.1, 'uRadius', 'float');
		this.glHelper.addUniform(this.particlesProgram, 'Particle Mass', 10, 'uCollisionFactor', 'float');

		// Add simulation loop constants
		this.glHelper.addUniform(this.particlesProgram, 'Delta Time', 0.0, 'iDeltaTime', 'float');
		this.glHelper.addUniform(this.particlesProgram, 'Particle size factor', this.simulationSizeFactor, 'iSizeFactor', 'float');
		this.glHelper.addUniform(this.particlesProgram, 'Resolution', [this.particles.particlesCountR, this.particles.particlesCountR], 'iResolution', 'vec2');

		// Set attachment constants
		this.glHelper.addUniform(this.particlesProgram, 'Position Buffer', 0, 'inPosData', 'attachment');
		this.glHelper.addUniform(this.particlesProgram, 'Velocity Buffer', 1, 'inVelData', 'attachment');



		// First frame
		this.frameID = 0;
		this.viewingScalar = 1000; // See float numbers first 2 digits values
		
		this.drawingHTMLImagesID = {};
		document.getElementById('simulation_title').textContent =
			`Drawing ${this.particles.count} particles in a ${this.frameViewingFactor}x${this.frameViewingFactor} m box`;

		// Read buffers
		this.readBuffers();
		this.drawParticles();


		// Start graphs
		this.pressureChart = new Chart(document.getElementById('pressureGraph'), {
			type: 'line',
			data: {
				labels: this.data.legend,
				datasets: [{ data: this.data.pressure, label: "Pressure by frame ID", borderColor: "#3e95cd" }]
			}
		});

		this.energyChart = new Chart(document.getElementById('energyGraph'), {
			type: 'line',
			data: {
				labels: this.data.legend,
				datasets: [{ data: this.data.energy, label: "Energy by frame ID", borderColor: "#3e95cd" }]
			}
		});
	}

	
	setupSimulation(particlesCount) {
		// Particles data
		this.particles = {
			particlesCountR: Math.ceil(Math.sqrt(particlesCount))
		};
		let bWidth = this.particles.particlesCountR;
		let bHeight = this.particles.particlesCountR;

		// Initial particles positions
		let initialPos = new Float32Array(bWidth * bHeight * 4);
		for (let i = 0; i < initialPos.length; i += 4) {
			initialPos[i + 0] = (Math.random() * 1.9 - 1.9 / 2) * this.simulationSizeFactor;
			initialPos[i + 1] = (Math.random() * 1.9 - 1.9 / 2) * this.simulationSizeFactor;
			initialPos[i + 2] = 0;
			initialPos[i + 3] = 1;
		}

		// Initial particles velocity
		let initialVel = new Float32Array(bWidth * bHeight * 4);
		for (let i = 0; i < initialVel.length; i += 4) {
			initialVel[i + 0] = (Math.random() * 1.9 - 1.9 / 2) * this.simulationSizeFactor * 0.1;
			initialVel[i + 1] = (Math.random() * 1.9 - 1.9 / 2) * this.simulationSizeFactor * 0.1;
			initialVel[i + 2] = 0;
			initialVel[i + 3] = 1;
		}


		// Setup buffer and textures to store datas
		this.particles = {
			particlesCountR: Math.ceil(Math.sqrt(particlesCount)), // 10x10 particles in total
			currentFrame : 0,
			buffers : {
				frame0 : {
					buffer: this.glHelper.createFrameBuffer(),
					pos: this.glHelper.createTexture([bWidth, bHeight], 0, this.glHelper.gl.RGBA32F, this.glHelper.gl.RGBA, this.glHelper.gl.FLOAT, initialPos.slice()),
					vel: this.glHelper.createTexture([bWidth, bHeight], 1, this.glHelper.gl.RGBA32F, this.glHelper.gl.RGBA, this.glHelper.gl.FLOAT, initialVel.slice())
				},
				frame1 : {
					buffer: this.glHelper.createFrameBuffer(),
					pos: this.glHelper.createTexture([bWidth, bHeight], 2, this.glHelper.gl.RGBA32F, this.glHelper.gl.RGBA, this.glHelper.gl.FLOAT, initialPos.slice()),
					vel: this.glHelper.createTexture([bWidth, bHeight], 3, this.glHelper.gl.RGBA32F, this.glHelper.gl.RGBA, this.glHelper.gl.FLOAT, initialVel.slice())
				},
				data : {
					pressure: this.glHelper.createTexture([bWidth, bHeight], 4, this.glHelper.gl.RGBA32F, this.glHelper.gl.RGBA, this.glHelper.gl.FLOAT),
					energy  : this.glHelper.createTexture([bWidth, bHeight], 5, this.glHelper.gl.RGBA32F, this.glHelper.gl.RGBA, this.glHelper.gl.FLOAT)
				}
			}
		};
		this.particles.count = this.particles.particlesCountR ** 2;

		// The data that the particles give
		this.data = {
			pressure : [],
			energy : [],
			legend : []
		};


		// Bind attachments to frame buffers
		// Frame 0
		this.glHelper.bindTexture(this.particles.buffers.frame0.buffer, 0, this.particles.buffers.frame0.pos);
		this.glHelper.bindTexture(this.particles.buffers.frame0.buffer, 1, this.particles.buffers.frame0.vel);

		// Frame 1
		this.glHelper.bindTexture(this.particles.buffers.frame1.buffer, 0, this.particles.buffers.frame1.pos);
		this.glHelper.bindTexture(this.particles.buffers.frame1.buffer, 1, this.particles.buffers.frame1.vel);

		// Data
		this.glHelper.bindTexture(this.particles.buffers.frame0.buffer, 2, this.particles.buffers.data.pressure);
		this.glHelper.bindTexture(this.particles.buffers.frame1.buffer, 2, this.particles.buffers.data.pressure);
		this.glHelper.bindTexture(this.particles.buffers.frame0.buffer, 3, this.particles.buffers.data.energy);
		this.glHelper.bindTexture(this.particles.buffers.frame1.buffer, 3, this.particles.buffers.data.energy);
	}


	update(dt) {
		if (this.noLoop)
			return;

		// Update dynamic uniforms
		this.glHelper.setUniform(this.particlesProgram, 'Delta Time', dt);

		if (this.frameID % 2 == 0) { // Frame 0
			// Bind frame buffer 1 as output
			this.glHelper.bindFramebuffer(this.particles.buffers.frame1.buffer);

			// Bind frame buffers 0 as inputs
			this.glHelper.setUniform(this.particlesProgram, 'Position Buffer', 0);
			this.glHelper.setUniform(this.particlesProgram, 'Velocity Buffer', 1);
		}
		else { // Frame 1
			// Bind frame buffer 0 as output
			this.glHelper.bindFramebuffer(this.particles.buffers.frame0.buffer);

			// Bind frame buffers 1 as inputs
			this.glHelper.setUniform(this.particlesProgram, 'Position Buffer', 2);
			this.glHelper.setUniform(this.particlesProgram, 'Velocity Buffer', 3);
		}

		// Say to use the program and send uniforms
		this.glHelper.startProgram(this.particlesProgram);

		// Draw elements to the color attachments 0 and 1
		this.glHelper.drawProgram(this.particlesProgram, [0, 1, 2, 3]);

		// Update data based on the new computed values
		if (this.frameID % this.frameViewingFactor == 0)
			this.updateData();


		// Update HTML simulation status
		this.frameID++;
		document.getElementById('frameID').innerHTML = (this.frameID % 2) + "";
		document.getElementById('frameCount').innerHTML = this.frameID + "";
	}

	
	/** Draw the buffers to the screen */
	draw() {
		// Handle loop modes
		if (this.noLoop)
			return;
		if (this.stepMode)
			this.noLoop = true;

		// Draw the particles position
		this.drawParticles();

		// Read frame buffer content every 100 frame
		if (this.shouldDraw && (this.stepMode || this.frameID % this.frameViewingFactor == 0))
			this.readBuffers();
	}



	/** Update the simulation datas */
	updateData() {
		// Read buffer values
		let newPressureRaw = this.readBuffer(0, 2, false);
		let newEnergyRaw = this.readBuffer(0, 3, false);

		async function addToValues(thisRef) {
			// Compute total values
			let newPressure = 0;
			let newEnergy = 0;
			for (let i = 0; i < newPressureRaw.length; i += 4) {
				newPressure += newPressureRaw[i];
				newEnergy += newEnergyRaw[i];
			}

			// Round to 3rd decimal
			let roundFactor = 1000;
			newPressure = Math.round(newPressure * roundFactor) / roundFactor;
			newEnergy   = Math.round(newEnergy   * roundFactor) / roundFactor;

			// Divide pressure and energy by constants to scale
			newPressure /= 1e5;
			newEnergy /= 1e3;

			// Push new data to the list
			thisRef.data.legend.push(thisRef.frameID);
			thisRef.data.pressure.push(newPressure);
			thisRef.data.energy.push(newEnergy);

			// Update graphs data
			thisRef.pressureChart.data.labels = thisRef.data.legend;
			thisRef.pressureChart.data.datasets[0].data = thisRef.data.pressure;

			thisRef.energyChart.data.labels = thisRef.data.legend;
			thisRef.energyChart.data.datasets[0].data = thisRef.data.energy;

			thisRef.pressureChart.update();
			thisRef.energyChart.update();
		}
		addToValues(this);
	}




	/** Reads and display the content of the buffers */
	readBuffers() {
		// Read buffer 0
		this.readBuffer(0, 0);
		this.readBuffer(0, 1);
		this.readBuffer(0, 2);
		this.readBuffer(0, 3);

		// Read buffer 1
		this.readBuffer(1, 0);
		this.readBuffer(1, 1);
	}

	/**
	 * Set the content of a buffer image attachment
	 * @param bufferID The framebuffer ID of the attachment
	 * @param attachmentID The attachment ID in the frame buffer
	 * @param display If true, will display the data, else will return them
	 */
	readBuffer(bufferID, attachmentID, display = true) {
		// Already updating images
		let textRepresentation = bufferID.toString() + attachmentID.toString();
		if (this.drawingHTMLImagesID[textRepresentation])
			return;

		// Read pixel data
		let dataFloat = this.glHelper.readAttachment(this.particles.buffers["frame" + bufferID].buffer,
						attachmentID, [this.particles.particlesCountR, this.particles.particlesCountR]);
		if (this.logInfo)
			console.log(dataFloat, bufferID, attachmentID);

		if (display) {
			// Set that the image is updating
			this.drawingHTMLImagesID[textRepresentation] = true;

			// Display the buffer
			this.displayBufferAsync(dataFloat, [bufferID, attachmentID])
				.then(() => this.drawingHTMLImagesID[textRepresentation] = false);
		}
		else
			return dataFloat;
	}


	/**
	 * Displays the given buffer async based on the ID
	 * @param dataFloat A float32 array of the data
	 * @param id ID of the buffer 
	 */
	async displayBufferAsync(dataFloat, id) {
		// Map float32 data to uint32 data to display
		let dataUInt = new Uint32Array(dataFloat.length);
		for (let i = 0; i < dataFloat.length; i += 4) {
			for (let j = 0; j < 4; j++)
				dataUInt[i + j] = Math.round(((dataFloat[i + j] / this.simulationSizeFactor) / 2) * this.viewingScalar) / this.viewingScalar * 300;
			dataUInt[i + 3] = 200;
		}

		// Create a 2D canvas to store the result
		let canvas = document.createElement('canvas');
		canvas.width = this.particles.particlesCountR;
		canvas.height = this.particles.particlesCountR;
		let context = canvas.getContext('2d');

		// Copy the pixels to a 2D canvas
		let imageData = context.createImageData(this.particles.particlesCountR, this.particles.particlesCountR);
		imageData.data.set(dataUInt);
		context.putImageData(imageData, 0, 0);

		// Generate canvas as url
		let canvasURL = canvas.toDataURL();
		let rootID = 'buffer' + id[0].toString() + '_' + 'attachment' + id[1].toString();
		document.getElementById(rootID).src = canvasURL;
		document.getElementById(rootID + '_frame').textContent = "Frame " + this.frameID.toString();
	}


	/** Draw the particles on the screen */
	drawParticles() {
		if (!this.shouldDraw)
			return;

		// Read current buffer
		let data = this.glHelper.readAttachment(this.particles.buffers["frame" + this.frameID % 2].buffer, 0,
					[this.particles.particlesCountR, this.particles.particlesCountR]);

		// Drawing data
		const canvas = document.getElementById('drawingCanvas');
		const context = canvas.getContext('2d');
		const centerX = canvas.width / 2;
		const centerY = canvas.height / 2;

		// Clear canvas
		context.clearRect(0, 0, canvas.width, canvas.height);

		// Draw particles
		for (let i = 0; i < data.length / 4; i++) {
			let x = data[i * 4 + 0] / this.simulationSizeFactor;
			let y = data[i * 4 + 1] / this.simulationSizeFactor;

			context.beginPath();
			context.arc(centerX + x * centerX, centerY + y * centerY, this.particleDrawRadius / this.simulationSizeFactor, 0, 2 * Math.PI, false);
			context.fillStyle = 'white';
			context.fill();
		}
	}
}