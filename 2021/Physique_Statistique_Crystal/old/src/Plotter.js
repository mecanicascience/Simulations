class Plotter {
	constructor() {
		// Generate N particles at random pos and speed
		const PARTICLES_COUNT = 1000;
		this.particles = {
			count : PARTICLES_COUNT,
			pos : new Float32Array(PARTICLES_COUNT).fill().map(el => (
				[
					Math.random() * 2 - 1, // X
					Math.random() * 2 - 1  // Y
				]
			)),
			vel : new Float32Array(PARTICLES_COUNT).fill().map(el => (
				[
					(Math.random() * 2 - 1) / 10, // X
					(Math.random() * 2 - 1) / 10  // Y
				]
			))
		};
		console.log(`Displaying ${PARTICLES_COUNT} particles.`);

		// Setup the GPU shaders
		this.setupRenderingGPU();
	}


	setupRenderingGPU() {
		this.canvas = document.getElementById('test');
		this.gl = this.canvas.getContext('webgl');
		if (!this.gl) {
			alert("WEBGL not supported on this device.");
			return;
		}

		this.draw_buffers_EXT = this.gl.getExtension('WEBGL_draw_buffers');
		if (!this.draw_buffers_EXT) {
			alert("This animation require the WEBGL_draw_buffers extension. Please update your browser.");
			return;
		}

		// Setup WebGL
		this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
		this.gl.clearColor(0.0, 0.0, 0.0, 1.0); // Set clear color
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT); // Clear color and depth buffer


		// Setup shaders
		const vertShaderSource = `
			attribute vec2 aPos;

			void main() {
				gl_Position = vec4(aPos, 0.0, 1.0);
			}
		`;

		const fragShaderSource = `
			#extension GL_EXT_draw_buffers : require
			precision mediump float;
			uniform vec2 iResolution;

			void main() {
				// Normalized pixel coordinates (from 0 to 1)
				vec2 uv = gl_FragCoord.xy / iResolution.xy;

				// Output data
				gl_FragData[0] = vec4(0.0, uv.y, 0.0, 1.0);
				gl_FragData[1] = vec4(uv.x, 0.0, 0.0, 1.0);
			}
		`;


		// Create shaders and link it to the pipeline
		const vertShader = this.loadShader(this.gl.VERTEX_SHADER  , vertShaderSource);
		const fragShader = this.loadShader(this.gl.FRAGMENT_SHADER, fragShaderSource);

		this.pipelineProgram = this.gl.createProgram();
		this.gl.attachShader(this.pipelineProgram, vertShader);
		this.gl.attachShader(this.pipelineProgram, fragShader);
		this.gl.linkProgram(this.pipelineProgram);
		
		// If failed to link shaders
		if (!this.gl.getProgramParameter(this.pipelineProgram, this.gl.LINK_STATUS)) {
			alert("Cannot link shader program: " + this.gl.getProgramInfoLog(this.pipelineProgram));
			return;
		}


		// Get uniform offsets
		this.iResolutionOffset = this.gl.getUniformLocation(this.pipelineProgram, "iResolution");

		// Create and bind buffers
		let squareVertices = new Float32Array([
			-1.0,  1.0,
			 1.0,  1.0,
			 1.0, -1.0,
			-1.0,  1.0,
			-1.0, -1.0,
			 1.0, -1.0
		]);
		this.squareVertBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.squareVertBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, squareVertices, this.gl.STATIC_DRAW);


		/* // Pos
		this.posBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.posBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, this.particles.pos, this.gl.STATIC_DRAW);

		// Vel
		this.velBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.velBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, this.particles.vel, this.gl.STATIC_DRAW); */
	
		// Create textures
		// Texture 1
		this.targetTexture1 = this.gl.createTexture();
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.targetTexture1);
		this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA,
			this.canvas.width, this.canvas.height, 0,
			this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);
		
		// Texture 2
		this.targetTexture2 = this.gl.createTexture();
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.targetTexture2);
		this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA,
			this.canvas.width, this.canvas.height, 0,
			this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);
	


		// Create frame buffers
		this.drawFramebuffer = this.gl.createFramebuffer();
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.drawFramebuffer);
		this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.draw_buffers_EXT.COLOR_ATTACHMENT0_WEBGL, this.gl.TEXTURE_2D, this.targetTexture1, 0);
		this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.draw_buffers_EXT.COLOR_ATTACHMENT1_WEBGL, this.gl.TEXTURE_2D, this.targetTexture2, 0);
	
		this.readFramebufferAtt1 = this.gl.createFramebuffer();
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.readFramebufferAtt1);
		this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.draw_buffers_EXT.COLOR_ATTACHMENT2_WEBGL, this.gl.TEXTURE_2D, this.targetTexture1, 0);

		this.readFramebufferAtt2 = this.gl.createFramebuffer();
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.readFramebufferAtt2);
		this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.draw_buffers_EXT.COLOR_ATTACHMENT3_WEBGL, this.gl.TEXTURE_2D, this.targetTexture2, 0);
	}

	

	update(dt) {
		// Say WebGL to use the program
		this.gl.useProgram(this.pipelineProgram);

		// Set data
		this.pipelineProgram.aPos = this.gl.getAttribLocation(this.pipelineProgram, "aPos");
		this.gl.enableVertexAttribArray(this.pipelineProgram.aPos);
		this.gl.vertexAttribPointer(this.pipelineProgram.aPos, 2, this.gl.FLOAT, false, 0, 0);

		// Set uniforms
		this.gl.uniform2fv(this.iResolutionOffset, [this.canvas.width, this.canvas.height]);

		// Draw particles
		this.draw_buffers_EXT.drawBuffersWEBGL([this.draw_buffers_EXT.COLOR_ATTACHMENT0_WEBGL, this.draw_buffers_EXT.COLOR_ATTACHMENT1_WEBGL]);
		// this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
		this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);



		// Output texture
		// Read the contents of the framebuffer
		let data = new Uint8Array(this.canvas.width * this.canvas.height * 4);
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.readFramebufferAtt1);
		this.gl.readPixels(0, 0, this.canvas.width, this.canvas.height, this.gl.RGBA, this.gl.UNSIGNED_BYTE, data);

		// Create a 2D canvas to store the result 
		var canvas = document.createElement('canvas');
		canvas.width = this.canvas.width;
		canvas.height = this.canvas.height;
		var context = canvas.getContext('2d');
	
		// Copy the pixels to a 2D canvas
		var imageData = context.createImageData(this.canvas.width, this.canvas.height);
		imageData.data.set(data);
		context.putImageData(imageData, 0, 0);
	
		var img = new Image();
		img.src = canvas.toDataURL();
		canvas.toBlob((blob) => {
			const url = URL.createObjectURL(blob);
			window.open(url);
		});

		noLoop();
	}



	loadShader(type, source) {
		const shader = this.gl.createShader(type);
	  
		// Send source to the object
		this.gl.shaderSource(shader, source);
	  
		// Compile shader
		this.gl.compileShader(shader);
	  
		// Check if compiled
		if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
		  alert('An error occurred compiling the shaders: ' + this.gl.getShaderInfoLog(shader));
		  this.gl.deleteShader(shader);
		  return null;
		}
	  
		return shader;
	}

	draw(drawer) {
		// Draw square
		drawer
			.noFill()
			.stroke(255)
			.strokeWeight(2)
			.rect(-1, -1, 2, 2);

		// Draw particles
		drawer
			.noStroke()
			.fill(255);
		for (let i = 0; i < this.particles.count; i++) {
			drawer.circle(this.particles.pos[i].x, this.particles.pos[i].y, 2);
		}
	}
}
