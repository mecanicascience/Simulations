class WebGPUSimulator {
	constructor(canvas) {
		this._debug = true;

		this.canvas = { html : canvas };
		this.graphicsPipeline = { shaders : {} };
	}
	



	async initialize() {
		// == INITIALIZE ENGINE ==
		if (this._debug) {
			console.log("\n\n\n== INITIALIZING ENGINE ==");
			console.log("Using debug mode.");
		}
		else
			console.log("Initializing engine.");


		// Setup WebGPU
		if (this._debug)
			console.log("\n=== Setup Web GPU ===");
		await this.setupWebGPU();

		// Create render resources
		if (this._debug)
			console.log("\n=== Create render resources ===");
		this.setupAttachments();
		this.setupDataBuffers();
		await this.setupShaders();
		this.setupUBO();

		// Create render system
		if (this._debug)
			console.log("\n=== Create render system ===");
		this.setupPipelineLayout();
		this.setupPipeline();
	}




	async run() {
		// == START ENGINE ==
		if (this._debug)
			console.log("\n\n\n== STARTING ENGINE ==");
		else
			console.log("Running engine.")

		// Create running loop
		let frameCount = 0;
		let lastTime = Date.now();

		this.loop = async function () {
			if (this._debug && frameCount % 100 == 0) {
				let newTime = Date.now();
				let deltaTime = newTime - lastTime;
				lastTime = newTime;

				console.log(`Rendering frame ${frameCount}. FPS : ${frameCount == 0 ? 'Unset' : '' + Math.round(1 / deltaTime * 1000 * 100)}.`);
			}

			// Render frame
			await this.draw();
			frameCount++;

			// Request next frame
			requestAnimationFrame(this.loop);
		}.bind(this);

		// Run engine
		this.loop();
	}

	async draw() {
		// Update attachments
		this.updateAttachments();

		// Update buffer configuration data
		await this.setBufferData(this.buffers.configuration, new Float32Array(getConfig()));

		// Record and run commands
		this.recordGPUCommands();
	}



	recordGPUCommands() {
		// Create render pass
		let colorAttachment = {
			view: this.attachments[1].view,
			clearValue: { r: 0, g: 0, b: 0, a: 1 },
			loadOp: 'clear',
			storeOp: 'store'
		};
		const depthAttachment = {
			view: this.attachments[0].view,
			depthLoadOp: 'clear',
			depthClearValue: 1,
			depthStoreOp: 'store',
			stencilLoadOp: 'clear',
			stencilStoreOp: 'store'
		};

		const renderPassDesc = {
			colorAttachments: [ colorAttachment ],
			depthStencilAttachment: depthAttachment
		};

		// Create command buffer
		let commandEncoder = this.device.createCommandEncoder();

		// Render pass
		let gpuRenderPassEncoder = commandEncoder.beginRenderPass(renderPassDesc);
		gpuRenderPassEncoder.setPipeline(this.graphicsPipeline.pipeline);
		gpuRenderPassEncoder.setViewport(0, 0, this.canvas.html.width, this.canvas.html.height, 0, 1);
		gpuRenderPassEncoder.setScissorRect(0, 0, this.canvas.html.width, this.canvas.html.height);
		gpuRenderPassEncoder.setVertexBuffer(0, this.buffers.position);
		gpuRenderPassEncoder.setVertexBuffer(1, this.buffers.color);
		gpuRenderPassEncoder.setIndexBuffer(this.buffers.index, 'uint16');
		gpuRenderPassEncoder.setBindGroup(0, this.bindGroups[0]);
		gpuRenderPassEncoder.drawIndexed(6);
		gpuRenderPassEncoder.end();


		// Submit commands to queue
		let commands = commandEncoder.finish();
		this.queue.submit([ commands ]);
	}

	updateAttachments() {
		// Retrieve current swapchain image to color attachment
		this.attachments[1].texture = this.canvas.context.getCurrentTexture();
		this.attachments[1].view = this.attachments[1].texture.createView();
	}




	setupPipeline() {
		// === Graphics Pipeline ===
		// Input Assembly
		const positionAttribDesc = {
			shaderLocation: 0, // [[location(0)]]
			offset: 0,
			format: 'float32x3'
		};
		const positionBufferDesc = {
			attributes: [positionAttribDesc],
			arrayStride: 4 * 3, // sizeof(float) * 3
			stepMode: 'vertex'
		};

		const colorAttribDesc = {
			shaderLocation: 1, // [[location(1)]]
			offset: 0,
			format: 'float32x3'
		};
		const colorBufferDesc = {
			attributes: [colorAttribDesc],
			arrayStride: 4 * 3, // sizeof(float) * 3
			stepMode: 'vertex'
		};


		// Depth stencil data
		const depthStencil = {
			depthWriteEnabled: true,
			depthCompare: 'less',
			format: 'depth24plus-stencil8'
		};


		// Shader Stages
		const vertexStage = {
			module: this.graphicsPipeline.shaders.vertex,
			entryPoint: 'main',
			buffers: [ positionBufferDesc, colorBufferDesc ]
		};
		
		const colorState = {
			format: 'bgra8unorm'
		};
		const fragmentStage = {
			module: this.graphicsPipeline.shaders.fragment,
			entryPoint: 'main',
			targets: [ colorState ],
		};


		// Rasterization
		const primitive = {
			frontFace: 'cw',
			cullMode: 'none',
			topology: 'triangle-list'
		};


		// Create pipeline
		const pipelineDesc = {
			layout : this.graphicsPipeline.layout,
			vertex : vertexStage,
			fragment : fragmentStage,
			primitive,
			depthStencil,
		};

		this.graphicsPipeline.pipeline = this.device.createRenderPipeline(pipelineDesc);
		if (this._debug)
			console.log("Graphics pipeline", this.graphicsPipeline.pipeline);
	}

	setupPipelineLayout() {
		// Create pipeline layout
		const pipelineLayoutDesc = {
			bindGroupLayouts: this.bindGroupsLayouts
		};
		this.graphicsPipeline.layout = this.device.createPipelineLayout(pipelineLayoutDesc);

		if (this._debug)
			console.log("Pipeline layout", this.graphicsPipeline.layout);
	}




	setupUBO() {
		const data = new Float32Array(getConfig());
		this.buffers.configuration = this.createBuffer(data, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST);

		// Create corresponding pipeline layout
		let uniformBindGroupLayout = this.device.createBindGroupLayout({
			entries: [{
				binding: 0,
				visibility: GPUShaderStage.FRAGMENT,
				buffer: {}
			}]
		});

		let uniformBindGroup = this.device.createBindGroup({
			layout: uniformBindGroupLayout,
			entries: [{
				binding: 0,
				resource: { buffer: this.buffers.configuration }
			}]
		});

		// Reference bind groups layouts
		this.bindGroupsLayouts = [uniformBindGroupLayout];
		this.bindGroups = [uniformBindGroup];

		// Log
		if (this._debug) {
			console.log("Uniform bind groups : ", this.bindGroups);
			console.log("Uniform bind groups layouts : ", this.bindGroupsLayouts);
		}
	}

	async setupShaders() {
		// Get shader code
		const vertShaderCode = await fetch('shaders/triangle.vert.wgsl')
			.then(response => response.text());
		const fragShaderCode = await fetch('shaders/triangle.frag.wgsl')
			.then(response => response.text());

		// Create shader modules
		const vertShaderModuleDesc = { code: vertShaderCode };
		const fragShaderModuleDesc = { code: fragShaderCode };
		
		this.graphicsPipeline.shaders = {
			vertex: this.device.createShaderModule(vertShaderModuleDesc),
			fragment: this.device.createShaderModule(fragShaderModuleDesc)
		};

		if (this._debug)
			console.log("Shaders", this.graphicsPipeline.shaders);
	}

	setupDataBuffers() {
		// ==== CREATE BUFFERS ====
		this.buffers = {};


		// Vertices (quad for full frag shader)
		const positions = new Float32Array([
			 1.0, -1.0, 0.0,
			-1.0, -1.0, 0.0,
			 1.0,  1.0, 0.0,
			-1.0,  1.0, 0.0
		]);
		this.buffers.position = this.createBuffer(positions, GPUBufferUsage.VERTEX);

		const colors = new Float32Array([ // rgb for each vertices
			1.0, 1.0, 1.0,
			1.0, 1.0, 1.0,
			1.0, 1.0, 1.0,
			1.0, 1.0, 1.0,
			1.0, 1.0, 1.0,
			1.0, 1.0, 1.0
		]);
		this.buffers.color = this.createBuffer(colors, GPUBufferUsage.VERTEX);

		const indices = new Uint16Array([0, 1, 2, 2, 1, 3]);
		this.buffers.index = this.createBuffer(indices, GPUBufferUsage.INDEX);

		
		// Configuration
		// Done in create ubo


		// Log buffers
		if (this._debug)
			console.log("Buffers", this.buffers);
	}

	setupAttachments() {
		// Create attachments object
		this.attachments = [];


		// ==== CREATE DEPTH ATTACHMENT ====
		// Declare attachment handles
		let attachment0 = {
			type : 'depth',
			texture : null,
			view : null
		};

		// Create view and texture
		const depthTextureDesc = {
			size: [this.canvas.html.width, this.canvas.html.height, 1],
			dimension: '2d',
			format: 'depth24plus-stencil8',
			usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC
		};

		attachment0.texture = this.device.createTexture(depthTextureDesc);
		attachment0.view = attachment0.texture.createView();
		
		this.attachments.push(attachment0);



		// ==== CREATE COLOR ATTACHMENT ====
		let attachment1 = {
			type : 'color',
			texture : null,
			view : null
		};

		// Associate attachment to the current drawing texture
		attachment1.texture = this.canvas.context.getCurrentTexture();
		attachment1.view = attachment1.texture.createView();

		this.attachments.push(attachment1);


		if (this._debug)
			console.log('Attachments', this.attachments);
	}




	async setupWebGPU() {
		// ==== GET INFOS ====
		// Get WebGPU
		this.entry = navigator.gpu;

		// Get physical device
		this.physicalDevice = await this.entry.requestAdapter();
		if (this._debug)
			console.log("Physical device", this.physicalDevice);

		// Get logical device
		this.device = await this.physicalDevice.requestDevice();
		if (this._debug)
			console.log("Logical device", this.device);

		// Get GPU queues
		this.queue = this.device.queue;
		if (this._debug)
			console.log("Rendering queue", this.queue);


		// ==== SETUP CANVAS ====
		this.canvas.context = this.canvas.html.getContext('webgpu');
		this.canvas.context.configure({
			device : this.device,
			format : 'bgra8unorm',
			usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.OUTPUT_ATTACHMENT | GPUTextureUsage.COPY_SRC
		});
		if (this._debug)
			console.log("Rendering canvas", this.canvas);
	}






	/**
	 * Create a buffer from the given params (aligned to 4 bytes)
	 * @param arr Array of data in the buffer
	 * @param usage Usage of the buffer as a GPUBufferUsage label
	 * @returns The instanciated GPU buffer
	 */
	createBuffer(arr, usage) {
		// Align to 4 bytes
		let desc = { size: ((arr.byteLength + 3) & ~3), usage, mappedAtCreation: true };
		let buffer = this.device.createBuffer(desc);
		const writeArray = arr instanceof Uint16Array ? new Uint16Array(buffer.getMappedRange()) : new Float32Array(buffer.getMappedRange());
		writeArray.set(arr);
		buffer.unmap();

		return buffer;
	};

	/**
	 * Change the buffer data (assuming same size)
	 * @param buffer The corresponding buffer
	 * @param arr Array of data in the buffer
	 */
	async setBufferData(buffer, arr) {
		this.queue.writeBuffer(buffer, 0, arr);
	}
}
