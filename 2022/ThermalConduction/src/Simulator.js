class Simulator {
    constructor(canvas) {
        this.canvas = canvas;

        // Resize canvas to window size
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight * 0.999;

        // Mouse handle
        this.mouseStatus = 'up';
        document.onmousemove = (e) => { this.mousePos = [e.clientX / this.canvas.width, 1 - e.clientY / this.canvas.height]; this.onMouseEvent(); };
        document.onmousedown = () => { this.mouseStatus = 'down'; this.onMouseEvent(); this.onMouseDown(); };
        document.onmouseup = () => this.mouseStatus = 'up';

        // Set initialize
        this.initialized = false;
        this.lastWall = Date.now();
    }

    async initialize() {
        // Initialize
        this.api = new WebGPUAPI(document.getElementById('drawing-canvas'));
        if (!await this.api.initialize())
            document.getElementById('error-p').innerHTML = "Your browser doesn't support WebGPU yet. Try using the latest Google Chrome version.";

        // GUI
        this.gui = new OptionsGuiAPI('HEAT EQUATION', 'The <c>heat equation</c> describes the evolution of sources of heat in matter. This simulation uses periodic boundary conditions.');
        // Physics config
        let physicsFol = this.gui.addFolder('Physics');
        this.conductivity = this.gui.addInput('$$\\kappa$$', physicsFol, 0.2, 0, 1, 0.001, 'The <c>thermal conductivity</c> describes how a material distribute heat inside it.');
        this.density = this.gui.addInput('$$\\rho$$', physicsFol, 10, 0, 100, 0.1, 'The <c>density</c> of a material describes how particles are arranged inside the materials.');
        this.capacity = this.gui.addInput('$$C$$', physicsFol, 20, 0, 50, 0.1, 'The <c>thermal capacity</c> of a material describes how much the material can retain heat.');

        // Drawing mode
        let drawFol = this.gui.addFolder('Add elements');
        this.pencilMode = this.gui.addSelect('Draw mode', drawFol, ['None', 'Sources', 'Walls'], 'None', 'Right click to <c>draw sources or walls</c> if selected');
        this.wallDrawRadius = this.gui.addInput('Wall Stencil Radius', drawFol, 10, 1, 20, 0.1);
        this.gui.addButton('Reset', drawFol, () => {
            this.sources = [ 0.0 ];
            this.api.updateBuffer(this.computeData.sources, new Float32Array(this.maxSourcesCount * 4));
            this.api.updateBuffer(this.computeData.grid0, new Float32Array(this.canvas.width * this.canvas.height).fill(0));
            this.api.updateBuffer(this.computeData.grid1, new Float32Array(this.canvas.width * this.canvas.height).fill(0));
        });

        // Colors as R, G, B from hot to cold
        let colors = [
            0.0, // First value is color count
            0.0, 0.0, 0.0,
            0.2, 0.2, 0.5,
            0.4, 0.6, 0.8,
            0.8, 0.9, 0.9,
            1.0, 0.8, 0.5,
            0.9, 0.3, 0.2,
            0.6, 0.0, 0.0
        ]
        colors[0] = Math.round((colors.length - 1) / 3);

        // Simulation config
        this.stepsPerTick = 100;     // Number of simulation steps for each tick
        this.maxSourcesCount = 500;  // Max number of sources in the simulation
        this.maxWallsCount = 500;    // Max number of walls per compute shader tick
        this.drawWallTickCount = 2;  // Draw walls each X tick

        // Steps config
        let deltat = 0.000001;
        let deltax = 0.0001;
        let deltay = 0.0001;

        // Update GUI display
        this.gui.processMaths();

        // Sources as [SourcesCount, X1, Y1, Radius1, Value1, X2, Y2, Radius2, Value2, ...]
        let initSources = new Float32Array(this.maxSourcesCount * 4);
        this.sources = [1.0, 0.5, 0.5, 5, 0.5];
        initSources.set(this.sources);

        // Create resources
        this.computeData = {
            // Grid heat values (0 - 1 for heat, -1 for wall)
            grid0: this.api.createBuffer(new Float32Array(this.canvas.width * this.canvas.height).fill(0), GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST),
            grid1: this.api.createBuffer(new Float32Array(this.canvas.width * this.canvas.height).fill(0), GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST),
            // Grid parameters
            gridColors: this.api.createBuffer(new Float32Array(colors), GPUBufferUsage.STORAGE),
            sources: this.api.createBuffer(initSources, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST),
            // Physics parameters
            gridData: this.api.createBuffer(new Float32Array([this.canvas.width, this.canvas.height, deltat, deltax, deltay, 0, 0]), GPUBufferUsage.UNIFORM),
            physData: this.api.createBuffer(new Float32Array([this.conductivity(), this.density(), this.capacity(), 0, 0, 0, 0]), GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST),
            // Wall buffer
            wallData: this.api.createBuffer(new Uint32Array(this.maxWallsCount * 3 + 2), GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST)
        };
        this.newWalls = [];
        this.drawCounter = 0;
        this.currFrameID = 0;

        // Graphics pipeline
        this.graphicsPip0 = await this.api.createGraphicsPipeline({ // Draw 0
            shaders: [
                { type: "vert", src: "shaders/draw.vert.wgsl" },
                { type: "frag", src: "shaders/draw.frag.wgsl" }
            ],
            layouts: [[
                {
                    type: "buffer",
                    visibility: GPUShaderStage.FRAGMENT,
                    bufferAccess: "read-only-storage",
                    buffer: this.computeData.grid0
                },
                {
                    type: "buffer",
                    visibility: GPUShaderStage.FRAGMENT,
                    bufferAccess: "uniform",
                    buffer: this.computeData.gridData
                },
                {
                    type: "buffer",
                    visibility: GPUShaderStage.FRAGMENT,
                    bufferAccess: "uniform",
                    buffer: this.computeData.physData
                },
                {
                    type: "buffer",
                    visibility: GPUShaderStage.FRAGMENT,
                    bufferAccess: "read-only-storage",
                    buffer: this.computeData.gridColors
                }
            ]]
        });
        this.graphicsPip1 = await this.api.createGraphicsPipeline({ // Draw 1
            shaders: [
                { type: "vert", src: "shaders/draw.vert.wgsl" },
                { type: "frag", src: "shaders/draw.frag.wgsl" }
            ],
            layouts: [[
                {
                    type: "buffer",
                    visibility: GPUShaderStage.FRAGMENT,
                    bufferAccess: "read-only-storage",
                    buffer: this.computeData.grid1
                },
                {
                    type: "buffer",
                    visibility: GPUShaderStage.FRAGMENT,
                    bufferAccess: "uniform",
                    buffer: this.computeData.gridData
                },
                {
                    type: "buffer",
                    visibility: GPUShaderStage.FRAGMENT,
                    bufferAccess: "uniform",
                    buffer: this.computeData.physData
                },
                {
                    type: "buffer",
                    visibility: GPUShaderStage.FRAGMENT,
                    bufferAccess: "read-only-storage",
                    buffer: this.computeData.gridColors
                }
            ]]
        });

        // Compute pipeline
        this.computePip0 = await this.api.createComputePipeline({ // Read from 1, write to 0
            shader: {
                type : "comp",
                src : "shaders/thermal.comp.wgsl"
            },
            layouts : [[
                {
                    type: "buffer",
                    visibility: GPUShaderStage.COMPUTE,
                    bufferAccess: "read-only-storage",
                    buffer: this.computeData.grid1
                },
                {
                    type: "buffer",
                    visibility: GPUShaderStage.COMPUTE,
                    bufferAccess: "storage",
                    buffer: this.computeData.grid0
                },
                {
                    type: "buffer",
                    visibility: GPUShaderStage.COMPUTE,
                    bufferAccess: "uniform",
                    buffer: this.computeData.gridData
                },
                {
                    type: "buffer",
                    visibility: GPUShaderStage.COMPUTE,
                    bufferAccess: "uniform",
                    buffer: this.computeData.physData
                },
                {
                    type: "buffer",
                    visibility: GPUShaderStage.COMPUTE,
                    bufferAccess: "read-only-storage",
                    buffer: this.computeData.sources
                }
            ]]
        });
        this.computePip1 = await this.api.createComputePipeline({ // Read from 0, write to 1
            shader: {
                type: "comp",
                src: "shaders/thermal.comp.wgsl"
            },
            layouts: [[
                {
                    type: "buffer",
                    visibility: GPUShaderStage.COMPUTE,
                    bufferAccess: "read-only-storage",
                    buffer: this.computeData.grid0
                },
                {
                    type: "buffer",
                    visibility: GPUShaderStage.COMPUTE,
                    bufferAccess: "storage",
                    buffer: this.computeData.grid1
                },
                {
                    type: "buffer",
                    visibility: GPUShaderStage.COMPUTE,
                    bufferAccess: "uniform",
                    buffer: this.computeData.gridData
                },
                {
                    type: "buffer",
                    visibility: GPUShaderStage.COMPUTE,
                    bufferAccess: "uniform",
                    buffer: this.computeData.physData
                },
                {
                    type: "buffer",
                    visibility: GPUShaderStage.COMPUTE,
                    bufferAccess: "read-only-storage",
                    buffer: this.computeData.sources
                }
            ]]
        });

        // Compute add walls
        this.computeWalls = await this.api.createComputePipeline({
            shader: {
                type: "comp",
                src: "shaders/drawWall.comp.wgsl"
            },
            layouts: [[
                {
                    type: "buffer",
                    visibility: GPUShaderStage.COMPUTE,
                    bufferAccess: "storage",
                    buffer: this.computeData.grid0
                },
                {
                    type: "buffer",
                    visibility: GPUShaderStage.COMPUTE,
                    bufferAccess: "storage",
                    buffer: this.computeData.grid1
                },
                {
                    type: "buffer",
                    visibility: GPUShaderStage.COMPUTE,
                    bufferAccess: "uniform",
                    buffer: this.computeData.gridData
                },
                {
                    type: "buffer",
                    visibility: GPUShaderStage.COMPUTE,
                    bufferAccess: "read-only-storage",
                    buffer: this.computeData.wallData
                }
            ]]
        });

        // Set initialized
        this.initialized = true;
    }

    async tick(dt) {
        // Update WebGPU dependencies
        this.api.tick();

        // Update data
        this.api.updateBuffer(this.computeData.physData, new Float32Array([this.conductivity(), this.density(), this.capacity(), 0, 0, 0, 0]));
        
        // Heat equation
        for (let i = 0; i < this.stepsPerTick; i++) {
            // Compute
            if (this.currFrameID == 0)
                this.computePip0.run(Math.ceil(this.canvas.width / 16.0), Math.ceil(this.canvas.height / 16.0)); // Read from 1, write to 0
            else
                this.computePip1.run(Math.ceil(this.canvas.width / 16.0), Math.ceil(this.canvas.height / 16.0)); // Read from 0, write to 1

            // Update data
            this.currFrameID = (this.currFrameID + 1) % 2;
        }

        // Draw Walls
        if (this.newWalls.length != 0 && this.drawCounter >= this.drawWallTickCount) {
            // Set walls buffer
            let arr = new Uint32Array(this.maxWallsCount * 3 + 2);
            arr.set([this.wallDrawRadius(), this.newWalls.length / 3.0]);
            arr.set(this.newWalls, 2);
            this.api.updateBuffer(this.computeData.wallData, arr);

            // Draw walls
            this.computeWalls.run(Math.ceil(this.newWalls.length / 3.0 / 256.0));

            // Reset
            let newData = [];
            if (this.newWalls.length >= 3)
                newData = [this.newWalls[this.newWalls.length - 3], this.newWalls[this.newWalls.length - 2], this.newWalls[this.newWalls.length - 1]];
            this.newWalls = [];
            this.drawCounter = 0;
        }
        this.drawCounter++;

        // Draw
        if (this.currFrameID == 0)
            this.graphicsPip1.run(); // Draw 1
        else
            this.graphicsPip0.run(); // Draw 0
    }

    onMouseDown() {
        if (!this.initialized)
            return;

        if (this.pencilMode() == 'Sources') {
            // Add source
            let arr = new Float32Array(this.maxSourcesCount * 4);
            this.sources = this.sources.concat([
                this.mousePos[0],
                this.mousePos[1],
                5,  // Radius
                0.5 // Heat value
            ]);
            arr.set(this.sources);

            // Set sources count
            this.sources[0]++;

            // Update sources buffer
            this.api.updateBuffer(this.computeData.sources, arr);
        }
    }

    onMouseEvent() {
        if (!this.initialized)
            return;

        // Add walls to draw list
        if (this.pencilMode() == 'Walls' && this.mouseStatus == 'down' && this.mousePos[0] >= 0 && this.mousePos[0] <= 1 && this.mousePos[1] >= 0 && this.mousePos[1] <= 1) {
            this.newWalls.push(Math.round(this.mousePos[0] * this.canvas.width));
            this.newWalls.push(Math.round(this.mousePos[1] * this.canvas.height));
            this.newWalls.push(Math.round(Date.now()));
        }
    }
}
