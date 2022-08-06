/**
 * A class that contains helper methods with the WebGPU API.
 * Copyright @MecanicaScience https://mecanicascience.fr.
 * Basic source code example :
 * ```
 *  // Initialize API
 *  let simulator = new WebGPUAPI(document.getElementById('drawing-canvas'));
 *  await simulator.initialize();
 * 
 *  // Update WebGPU graphics components
 *  simulator.tick();
 * 
 *  // Create graphics pipeline
 *  let graphicsBuffer = simulator.createBuffer(new Uint32Array([0, 0]), GPUBufferUsage.UNIFORM); // Random data buffer
 *  let graphicsPip = await simulator.createGraphicsPipeline({
 *      shaders: [
 *          { type: "vert", src: "shaders/draw.vert.wgsl" },
 *          { type: "frag", src: "shaders/draw.frag.wgsl" }
 *      ],
 *      layouts: [[{ // Pass buffer as input (0, 0) in shader
 *          type: "buffer",
 *          visibility: GPUShaderStage.FRAGMENT,
 *          bufferAccess: "read-only-storage",
 *          buffer: graphicsBuffer
 *      }]]
 *  });
 * 
 *  // Draw
 *  graphicsPip.run();
 * 
 *  // Read buffer data
 *  console.log(await simulator.readBuffer(graphicsBuffer));
 * ```
 */
class WebGPUAPI {
	/**
	 * Create a new WebGPU Context
	 * @param canvas The engine canvas
	 */
	constructor(canvas) {
		// Set configuration
		this.canvas = { html: canvas };
	}

	/**
	 * Initialize WebGPU
	 * @return true if the browser supports WebGPU and false if it doesn't
	 */
	async initialize() {
		// ==== INITIALIZE ENGINE ====
		// Get WebGPU
		this.gpu = navigator.gpu;
		if (this.gpu == undefined || this.gpu == {} || !'gpu' in navigator) {
			console.error("Your browser doesn't support WebGPU.");
			return false;
		}

		// Get rendering devices
		this.physicalDevice = await this.gpu.requestAdapter(); // Physical device
		if (this.physicalDevice == undefined || this.physicalDevice == null) {
			console.error("Your browser doesn't support WebGPU. No physical device found.");
			return false;
		}
		this.device = await this.physicalDevice.requestDevice(); // Logical device
		this.queue = this.device.queue;

		// Create canvas
		this.canvas.context = this.canvas.html.getContext('webgpu');
		this.canvas.context.configure({
			device: this.device,
			format: 'bgra8unorm',
			usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.OUTPUT_ATTACHMENT | GPUTextureUsage.COPY_SRC
		});
		return true;
	}

	/** Update WebGPU data */
	tick() {
		// ==== UPDATE ATTACHMENTS ====
		this.attachments[1].texture = this.canvas.context.getCurrentTexture();
		this.attachments[1].view = this.attachments[1].texture.createView();
	}


	// ======= PIPELINES MANAGMENT =======
	/**
	 * Create a graphics pipeline
	 * @param config The pipeline configuration :
	 *  {
	 *      shaders : [
	 *          { type : "vert", src : "shaders/-.vert.wgsl" },
	 *          { type : "frag", src : "shaders/-.frag.wgsl" }
	 *      ],
	 *      layouts : [
	 *          [ // Bind group layout 0
	 *              { // Binding 0
	 *                  type : "buffer",
	 *                  visibility : GPUShaderStage.VERTEX / .FRAGMENT,
	 *                  bufferAccess : 'read-only-storage' / 'storage',
	 *                  buffer : ...
	 *              },
	 *              { // Binding 1
	 *                  type : "texture",
	 *                  visibility : GPUShaderStage.FRAGMENT,
	 *                  texture : ...,
	 *                  sampler : ...
	 *              }
	 *          ]
	 *      ]
	 *  } 
	 * @return The pipeline. Use pipeline.run() to draw the elements.
	 */
	async createGraphicsPipeline(config) {
		// ==== CREATE ATTACHMENTS ====
		this.attachments = [];

		// Create depth texture
		let depthTextureDesc = {
			size: [this.canvas.html.width, this.canvas.html.height, 1],
			dimension: '2d',
			format: 'depth24plus-stencil8',
			usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC
		};

		// Depth attachment
		let attachment0 = {
			type: 'depth',
			texture: this.device.createTexture(depthTextureDesc)
		};
		attachment0.view = attachment0.texture.createView();
		this.attachments.push(attachment0);

		// Color attachment
		let attachment1 = {
			type: 'color',
			texture: this.canvas.context.getCurrentTexture()
		};
		attachment1.view = attachment1.texture.createView();
		this.attachments.push(attachment1);


		// ==== CREATE SHADERS ====
		let pipeline = {
			shaders: []
		};
		for (let i = 0; i < config.shaders.length; i++) {
			let shaderCode = await fetch(config.shaders[i].src)
				.then(response => response.text());
			let shaderDesc = { code: shaderCode };
			if (config.shaders[i].type == "vert")
				pipeline.shaders.vert = this.device.createShaderModule(shaderDesc);
			else if (config.shaders[i].type == "frag")
				pipeline.shaders.frag = this.device.createShaderModule(shaderDesc);
			else
				console.error("Shader of type " + config.shaders[i].type + " is not implemented.");
		}


		// ==== CREATE LAYOUTS ====
		// Create binding layouts
		let bindGroupsLayouts = [];
		let bindGroups = [];

		for (let i = 0; i < config.layouts.length; i++) {
			let groupLayout = [];
			let bindGroupEntries = [];

			// Create bindings
			for (let j = 0; j < config.layouts[i].length; j++) {
				if (config.layouts[i][j].type == "buffer") {
					groupLayout.push({
						binding: j,
						visibility: config.layouts[i][j].visibility,
						buffer: { type: config.layouts[i][j].bufferAccess }
					});
					bindGroupEntries.push({
						binding: j,
						resource: config.layouts[i][j].buffer
					});
				}
				else if (config.layouts[i][j].type == "texture") {
					groupLayout.push({
						binding: j,
						visibility: config.layouts[i][j].visibility,
						texture: {
							sampleType: 'float',
							viewDimension: '2d',
							multisampled: false
						}
					});
					bindGroupEntries.push({
						binding: j,
						resource: config.layouts[i][j].texture.texture.createView({
							baseMipLevel: 0,
							mipLevelCount: 1
						})
					});
				}
				else if (config.layouts[i][j].type == "storageTexture") {
					groupLayout.push({
						binding: j,
						visibility: config.layouts[i][j].visibility,
						storageTexture: {
							access: 'write-only',
							format: config.layouts[i][j].texture.format,
							viewDimension: '2d'
						}
					});
					bindGroupEntries.push({
						binding: j,
						resource: config.layouts[i][j].texture.texture.createView({
							baseMipLevel: 0,
							mipLevelCount: 1
						})
					});
				}
				else {
					console.error("The texture of type " + config.layouts[i][j].type + " is not implemented.");
				}
			}

			// Instanciate them
			bindGroupsLayouts.push(this.device.createBindGroupLayout({ entries: groupLayout }));
			bindGroups.push(this.device.createBindGroup({
				layout: bindGroupsLayouts[i],
				entries: bindGroupEntries
			}));
		}
		pipeline.bindGroups = bindGroups;


		// ==== CREATE PIPELINE ====
		// Create pipeline layout
		let pipelineLayoutDesc = { bindGroupLayouts: bindGroupsLayouts };
		pipeline.layout = this.device.createPipelineLayout(pipelineLayoutDesc);

		// Create pipeline
		let positionBufferDesc = {
			attributes: [{
				shaderLocation: 0, // [[location(0)]]
				offset: 0,
				format: 'float32x3'
			}],
			arrayStride: 4 * 3, // sizeof(float) * 3
			stepMode: 'vertex'
		};

		let colorBufferDesc = {
			attributes: [{
				shaderLocation: 1, // [[location(1)]]
				offset: 0,
				format: 'float32x3'
			}],
			arrayStride: 4 * 3, // sizeof(float) * 3
			stepMode: 'vertex'
		};

		// Shader Stages
		let vertexStage = {
			module: pipeline.shaders.vert,
			entryPoint: 'main',
			buffers: [positionBufferDesc, colorBufferDesc]
		};

		let fragmentStage = {
			module: pipeline.shaders.frag,
			entryPoint: 'main',
			targets: [{ format: 'bgra8unorm' }]
		};

		// Create pipeline
		let pipelineDesc = {
			layout: pipeline.layout,
			vertex: vertexStage,
			fragment: fragmentStage,
			primitive: {
				frontFace: 'cw',
				cullMode: 'none',
				topology: 'triangle-list'
			},
			depthStencil: {
				depthWriteEnabled: true,
				depthCompare: 'less',
				format: 'depth24plus-stencil8'
			}
		};

		pipeline.pipeline = this.device.createRenderPipeline(pipelineDesc);

		// Set buffers
		pipeline.graphicsBuffers = {
			position: this.createBuffer(new Float32Array([ // Vertices
				1.0, -1.0, 0.0,
				-1.0, -1.0, 0.0,
				1.0, 1.0, 0.0,
				-1.0, 1.0, 0.0
			]), GPUBufferUsage.VERTEX),
			color: this.createBuffer(new Float32Array([ // Colors
				1.0, 1.0, 1.0,
				1.0, 1.0, 1.0,
				1.0, 1.0, 1.0,
				1.0, 1.0, 1.0,
				1.0, 1.0, 1.0,
				1.0, 1.0, 1.0
			]), GPUBufferUsage.VERTEX),
			index: this.createBuffer(new Uint16Array([0, 1, 2, 2, 1, 3]), GPUBufferUsage.INDEX)
		};

		let api = this;
		/**
		 * Run pipeline method
		 * @param renderPassDesc The render pass
		 */
		pipeline.run = function () {
			let commandEncoder = api.device.createCommandEncoder();
			let renderPassEncoder = commandEncoder.beginRenderPass({
				colorAttachments: [{
					view: api.attachments[1].view,
					clearValue: { r: 0, g: 0, b: 0, a: 1 },
					loadOp: 'clear',
					storeOp: 'store'
				}],
				depthStencilAttachment: {
					view: api.attachments[0].view,
					depthLoadOp: 'clear',
					depthClearValue: 1,
					depthStoreOp: 'store',
					stencilLoadOp: 'clear',
					stencilStoreOp: 'store'
				}
			});
			for (let i = 0; i < pipeline.bindGroups.length; i++)
				renderPassEncoder.setBindGroup(i, pipeline.bindGroups[i]);
			renderPassEncoder.setPipeline(pipeline.pipeline);
			renderPassEncoder.setViewport(0, 0, api.canvas.html.width, api.canvas.html.height, 0, 1);
			renderPassEncoder.setScissorRect(0, 0, api.canvas.html.width, api.canvas.html.height);
			renderPassEncoder.setVertexBuffer(0, pipeline.graphicsBuffers.position.buffer);
			renderPassEncoder.setVertexBuffer(1, pipeline.graphicsBuffers.color.buffer);
			renderPassEncoder.setIndexBuffer(pipeline.graphicsBuffers.index.buffer, 'uint16');
			renderPassEncoder.drawIndexed(6);
			renderPassEncoder.end();
			api.queue.submit([commandEncoder.finish()]);
		};
		return pipeline;
	}

	/**
	 * Create a compute pipeline
	 * @param config The pipeline configuration
	 *  {
	 *      shader : {
	 *          type : "comp"
	 *          src : "shaders/-.comp.wgsl"
	 *      },
	 *      layouts : [
	 *          [ // Bind group layout 0
	 *              { // Binding 0
	 *                  type : "buffer",
	 *                  visibility : GPUShaderStage.COMPUTE,
	 *                  bufferAccess : 'read-only-storage' / 'storage',
	 *                  buffer : ...
	 *              },
	 *              { // Binding 1
	 *                  type : "storageTexture",
	 *                  visibility : GPUShaderStage.COMPUTE,
	 *                  texture : ...,
	 *                  sampler : ...
	 *              }
	 *          ]
	 *      ]
	 *  } 
	 * @return The pipeline. Use pipeline.run(x, y, z) to dispatch workgroups.
	 */
	async createComputePipeline(config) {
		// ==== CREATE SHADERS ====
		let pipeline = {};
		let shaderCode = await fetch(config.shader.src)
			.then(response => response.text());
		let shaderDesc = { code: shaderCode };
		pipeline.shader = this.device.createShaderModule(shaderDesc);


		// ==== CREATE LAYOUTS ====
		// Create binding layouts
		let bindGroupsLayouts = [];
		let bindGroups = [];

		for (let i = 0; i < config.layouts.length; i++) {
			let groupLayout = [];
			let bindGroupEntries = [];

			// Create bindings
			for (let j = 0; j < config.layouts[i].length; j++) {
				if (config.layouts[i][j].type == "buffer") {
					groupLayout.push({
						binding: j,
						visibility: config.layouts[i][j].visibility,
						buffer: { type: config.layouts[i][j].bufferAccess }
					});
					bindGroupEntries.push({
						binding: j,
						resource: config.layouts[i][j].buffer
					});
				}
				else if (config.layouts[i][j].type == "texture") {
					groupLayout.push({
						binding: j,
						visibility: config.layouts[i][j].visibility,
						texture: {
							sampleType: 'float',
							viewDimension: '2d',
							multisampled: false
						}
					});
					bindGroupEntries.push({
						binding: j,
						resource: config.layouts[i][j].texture.texture.createView({
							baseMipLevel: 0,
							mipLevelCount: 1
						})
					});
				}
				else if (config.layouts[i][j].type == "storageTexture") {
					groupLayout.push({
						binding: j,
						visibility: config.layouts[i][j].visibility,
						storageTexture: {
							access: 'write-only',
							format: config.layouts[i][j].texture.format,
							viewDimension: '2d'
						}
					});
					bindGroupEntries.push({
						binding: j,
						resource: config.layouts[i][j].texture.texture.createView({
							baseMipLevel: 0,
							mipLevelCount: 1
						})
					});
				}
				else {
					console.error("The texture of type " + config.layouts[i][j].type + " is not implemented.");
				}
			}

			// Instanciate them
			bindGroupsLayouts.push(this.device.createBindGroupLayout({ entries: groupLayout }));
			bindGroups.push(this.device.createBindGroup({
				layout: bindGroupsLayouts[i],
				entries: bindGroupEntries
			}));
		}
		pipeline.bindGroups = bindGroups;


		// ==== CREATE PIPELINE ====
		// Create pipeline layout
		let pipelineLayoutDesc = { bindGroupLayouts: bindGroupsLayouts };
		pipeline.layout = this.device.createPipelineLayout(pipelineLayoutDesc);
		pipeline.pipeline = this.device.createComputePipeline({
			layout: pipeline.layout,
			compute: {
				module: pipeline.shader,
				entryPoint: "main"
			}
		});

		// Run method
		let api = this;
		/**
		 * Run pipeline method
		 * @param x The X dimension of the dispatch group
		 * @param y The Y dimension of the dispatch group
		 * @param z The Z dimension of the dispatch group
		 */
		pipeline.run = function (x, y = undefined, z = undefined) {
			if (x <= 0 || y < 0 || z < 0)
				console.error("Workgroups count isn't correct.");

			let computeCommandEncoder = api.device.createCommandEncoder();
			let computePassEncoder = computeCommandEncoder.beginComputePass();
			computePassEncoder.setPipeline(pipeline.pipeline);
			for (let i = 0; i < pipeline.bindGroups.length; i++)
				computePassEncoder.setBindGroup(i, pipeline.bindGroups[i]);
			computePassEncoder.dispatchWorkgroups(x, y, z);
			computePassEncoder.end();
			api.queue.submit([computeCommandEncoder.finish()]);
		};
		return pipeline;
	}



	// ======= BUFFER UTILS =======
	/**
	 * Create a buffer from the given params (aligned to 4 bytes).
	 * @param arr Array of data in the buffer
	 * @param usage Usage of the buffer as a GPUBufferUsage label
	 * @returns The instanciated GPU buffer
	 */
	createBuffer(arr, usage) {
		// Align to 4 bytes
		let size = (arr.byteLength + 3) & ~3;
		if (arr instanceof Uint32Array || arr instanceof Int32Array)
			size = arr.byteLength;
		let desc = { size: size, usage, mappedAtCreation: true };
		let buffer = this.device.createBuffer(desc);

		let writeArray;
		let type;
		if (arr instanceof Float32Array) {
			writeArray = new Float32Array(buffer.getMappedRange());
			type = 'float32';
		}
		else if (arr instanceof Uint16Array) {
			writeArray = new Uint16Array(buffer.getMappedRange());
			type = 'uint16';
		}
		else if (arr instanceof Uint32Array) {
			writeArray = new Uint32Array(buffer.getMappedRange());
			type = 'uint32';
		}
		else if (arr instanceof Int16Array) {
			writeArray = new Int16Array(buffer.getMappedRange());
			type = 'int16';
		}
		else if (arr instanceof Int32Array) {
			writeArray = new Int32Array(buffer.getMappedRange());
			type = 'int32';
		}
		writeArray.set(arr);
		buffer.unmap();

		return {
			buffer: buffer,
			size: size,
			offset: 0,
			type: type
		};
	}

	/**
	 * Update a buffer data asynchronously
	 * @param buffer The buffer
	 * @param newData The new buffer data
	 */
	async updateBuffer(buffer, newData) {
		// Create copy src buffer
		let srcBuffer = this.createBuffer(newData, GPUBufferUsage.COPY_SRC);

		// Copy src to dist
		const copyEncoder = this.device.createCommandEncoder();
		copyEncoder.copyBufferToBuffer(
			srcBuffer.buffer /* source buffer */,
			0 /* source offset */,
			buffer.buffer /* destination buffer */,
			0 /* destination offset */,
			buffer.size /* size */
		);
		this.queue.submit([copyEncoder.finish()]);
	}

	/**
	 * Read the content of a buffer.
	 * @param buffer Buffer
	 * @return The buffer data
	 */
	async readBuffer(buffer) {
		// Create command buffers
		const commandEncoder = this.device.createCommandEncoder();

		// Get a GPU buffer for reading in an unmapped state
		const gpuReadBuffer = this.device.createBuffer({
			size: buffer.size,
			usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
		});

		// Encode commands for copying buffer to buffer
		commandEncoder.copyBufferToBuffer(
			buffer.buffer, // source buffer
			0, // source offset
			gpuReadBuffer, // destination buffer
			0, // destination offset
			buffer.size, // size
		);

		// Submit commands
		const gpuCommands = commandEncoder.finish();
		this.device.queue.submit([gpuCommands]);

		// Display values
		await gpuReadBuffer.mapAsync(GPUMapMode.READ);
		if (buffer.type == "float32")
			return new Float32Array(gpuReadBuffer.getMappedRange());
		else if (buffer.type == "uint16")
			return new Uint16Array(gpuReadBuffer.getMappedRange());
		else if (buffer.type == "uint32")
			return new Uint32Array(gpuReadBuffer.getMappedRange());
		else if (buffer.type == "int16")
			return new Int16Array(gpuReadBuffer.getMappedRange());
		else if (buffer.type == "int32")
			return new Int32Array(gpuReadBuffer.getMappedRange());
	}
}
