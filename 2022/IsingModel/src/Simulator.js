class Simulator {
    constructor(canvas) {
        this.canvas = canvas;

        // Resize canvas to window size
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight * 0.999;
    }

    async initialize() {
        // Initialize
        this.api = new WebGPUAPI(document.getElementById('drawing-canvas'));
        if (!await this.api.initialize())
            document.getElementById('error-p').innerHTML = "Your browser doesn't support WebGPU yet. Try using the latest Google Chrome version.";


        // ===== CONFIG =====
        // Set GUI
        this.gui = new OptionsGuiAPI('Ising model', 'The <c>Ising model</c> is a physics modelisation of magnetism inside matter, using the Metropolis algorithm.');
        let folPhysics = this.gui.addFolder('Physics');
        this.temperature = this.gui.addInput('$$k_B T$$', folPhysics, 4, 0, 10, 0.001, '<c>Heat energy</c> of the grid.'); 
        this.magField = this.gui.addInput("$$h$$", folPhysics, 0, -1.1/4, 1.1/4, 0.001, 'Value of <c>magnetic field</c>.');
        this.couplingConst = this.gui.addInput("$$J$$", folPhysics, 1, 0, 5, 0.001, 'Module of the <c>coupling constant</c> in the Hamiltonian.');

        let folConfig = this.gui.addFolder("Configuration");
        this.runCountByTick = this.gui.addInput("Simulation speed", folConfig, 1, 0, 100, 1); // Numbers of spins flipped each tick
        this.maxSize = 4000;
        this.size = this.gui.addInput("Grid size", folConfig, 1000, 2, this.maxSize, 1);
        this.gui.addButton("Reset simulation", folConfig, () => {
            // let randomSpins = new Uint32Array(this.maxSize * this.maxSize).map(() => Math.round(Math.random())); // Random spins
            let randomSpins = new Uint32Array(this.maxSize * this.maxSize).fill(0); // All spins up
            this.api.updateBuffer(this.spinsData.spinsBuffer, randomSpins);
        });
        this.gui.processMaths();

        // Set algorithm values
        this.gridSize = [this.size(), parseInt(this.size() * this.canvas.height / this.canvas.width)]; // Grid side size
        this.stepsCount = -1;
        this.stepDisplayed = -100;
        this.frameID = 0;
        this.dataCount = 0;
        this.ESquared = 0;
        this.E = 0;
        this.magnetization = 0;
        this.thCapacity = 0;

        
        // ===== DATA STORAGE =====
        // Create data containers
        this.spinsData = {
            spinsBuffer: this.api.createBuffer(new Uint32Array(this.maxSize * this.maxSize), GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST),
            spinsData: this.api.createBuffer(new Float32Array([this.gridSize[0], this.gridSize[1]]), GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST)
        };
        this.physicsData = {
            simValues: this.api.createBuffer(new Float32Array([0, 0, 1, 1, 0, 0]), GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST),
            physData: this.api.createBuffer(new Float32Array([this.temperature(), this.magField(), this.couplingConst()]), GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST),
            thermoQuantities: this.api.createBuffer(new Int32Array([0, 0]), GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST)
        };

        // Create graphics pipeline
        this.graphicsPipeline = await this.api.createGraphicsPipeline({
            shaders: [
                { type: "vert", src: "shaders/draw.vert.wgsl" },
                { type: "frag", src: "shaders/draw.frag.wgsl" }
            ],
            layouts: [
                [
                    {
                        type: "buffer",
                        visibility: GPUShaderStage.FRAGMENT,
                        bufferAccess: "read-only-storage",
                        buffer: this.spinsData.spinsBuffer
                    },
                    {
                        type: "buffer",
                        visibility: GPUShaderStage.FRAGMENT,
                        bufferAccess: "uniform",
                        buffer: this.spinsData.spinsData
                    }
                ]
            ]
        });

        // Create compute pipeline
        this.computePipeline = await this.api.createComputePipeline({
            shader: { type: "comp", src: "shaders/ising.comp.wgsl" },
            layouts: [
                [
                    {
                        type: "buffer",
                        visibility: GPUShaderStage.COMPUTE,
                        bufferAccess: "storage",
                        buffer: this.spinsData.spinsBuffer
                    },
                    {
                        type: "buffer",
                        visibility: GPUShaderStage.COMPUTE,
                        bufferAccess: "uniform",
                        buffer: this.spinsData.spinsData
                    }
                ],
                [
                    {
                        type: "buffer",
                        visibility: GPUShaderStage.COMPUTE,
                        bufferAccess: "uniform",
                        buffer: this.physicsData.simValues
                    },
                    {
                        type: "buffer",
                        visibility: GPUShaderStage.COMPUTE,
                        bufferAccess: "uniform",
                        buffer: this.physicsData.physData
                    }
                ],
                [
                    {
                        type: "buffer",
                        visibility: GPUShaderStage.COMPUTE,
                        bufferAccess: "storage",
                        buffer: this.physicsData.thermoQuantities
                    }
                ]
            ]
        });
        

        // ===== SET INITIAL DATA =====
        let randomSpins = new Uint32Array(this.maxSize * this.maxSize).map(() => Math.round(Math.random())); // Random spins
        // let randomSpins = new Uint32Array(this.maxSize * this.maxSize).fill(0); // All spins up
        this.api.updateBuffer(this.spinsData.spinsBuffer, randomSpins);
    }

    async tick(dt) {
        // Update WebGPU dependencies
        this.api.tick();

        // Update gui values
        this.api.updateBuffer(this.physicsData.physData, new Float32Array([this.temperature(), this.magField(), this.couplingConst()]));

        if (this.size() != this.lastSize) {
            // Check size
            this.lastSize = this.size();
            this.gridSize = [this.size(), parseInt(this.size() * this.canvas.height / this.canvas.width)];
            this.api.updateBuffer(this.spinsData.spinsData, new Float32Array([this.gridSize[0], this.gridSize[1]]));

            // Reset spins
            let randomSpins = new Uint32Array(this.maxSize * this.maxSize).map(() => Math.round(Math.random())); // Random spins
            // let randomSpins = new Uint32Array(this.maxSize * this.maxSize).fill(0); // All spins up
            this.api.updateBuffer(this.spinsData.spinsBuffer, randomSpins);
        }

        // Run compute shaders
        simulation.runCompute();
        
        // Display grid
        this.graphicsPipeline.run();

        // Fetch thermo quantities
        // this.fetchThermoQuantities();

        // Output values
        // console.log("Average energy", this.E);
        // console.log("Average magnetization", this.magnetization);
        // console.log("Average thermal capacity", this.thCapacity);
    }

    runCompute() {
        // Run compute shader
        for (let i = 0; i < this.runCountByTick(); i++) {
            // Update random values
            let translVectorRand = [Math.round(Math.random() * 1000000) / 100000, Math.round(Math.random() * 1000000) / 100000];
            let scaleVectorRand = [Math.round(Math.random() * 1000000) / 3000000 + 1, Math.round(Math.random() * 100000) / 3000000 + 1];
            this.frameID = (this.frameID + 1) % 2;
            this.api.updateBuffer(this.physicsData.simValues, new Float32Array([
                translVectorRand[0], translVectorRand[1],
                scaleVectorRand[0], scaleVectorRand[1],
                this.frameID, 0
            ]));

            // Run compute pipeline
            this.computePipeline.run(Math.ceil(this.gridSize[0] / 16.0), Math.ceil(this.gridSize[1] / 16.0));
        }
    }

    async fetchThermoQuantities() {
        // Read data
        let data = await this.api.readBuffer(this.physicsData.thermoQuantities);

        // Extract thermo quantities
        this.E = data[0] / (this.gridSize[0] * this.gridSize[1]);
        this.magnetization = data[1] / (this.gridSize[0] * this.gridSize[1]);
        this.ESquared = (this.ESquared * this.dataCount + this.E * this.E) / (this.dataCount + 1);
        this.thCapacity = (this.ESquared - this.E * this.E) / (this.temperature() * this.temperature());
        this.dataCount++;

        // Reset data buffer
        this.api.updateBuffer(this.physicsData.thermoQuantities, new Int32Array([0, 0]));
    }
}
