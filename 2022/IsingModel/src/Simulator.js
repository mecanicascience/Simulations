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
        await this.api.initialize();


        // ===== CONFIG =====
        // Set GUI
        this.gui = new OptionsGuiAPI();
        let folPhysics = this.gui.addFolder("\\text{Physics}");
        this.temperature = this.gui.addInput("T", folPhysics, 2, 0, 10);        // Temperature
        this.spin = this.gui.addInput("|\\text{Spin}|", folPhysics, 1, 0, 5);   // Spin module
        this.couplingConst = this.gui.addInput("J", folPhysics, 1, 0, 5);       // J coupling constant

        let folConfig = this.gui.addFolder("\\text{Configuration}");
        this.runCountByTick = this.gui.addInput("\\text{Simulation speed}", folConfig, 1, 1, 100, 1); // Numbers of spins flipped each tick
        this.maxSize = 4000;
        this.size = this.gui.addInput("\\text{Grid size}", folConfig, 1000, 2, this.maxSize, 1);
        this.gui.addButton("\\text{Reset grid}", folConfig, () => {
            let randomSpins = new Uint32Array(this.maxSize * this.maxSize).map(() => Math.round(Math.random())); // Random spins
            //let randomSpins = new Uint32Array(this.maxSize * this.maxSize).fill(1); // All spins up
            this.api.updateBuffer(this.spinsData.spinsBuffer, randomSpins);
        });

        // Set algorithm values
        this.gridSize = [this.size(), parseInt(this.size() * this.canvas.height / this.canvas.width)]; // Grid side size
        this.stepsCount = -1;
        this.stepDisplayed = -100;
        this.frameID = 0;

        
        // ===== DATA STORAGE =====
        // Create data containers
        this.spinsData = {
            spinsBuffer: this.api.createBuffer(new Uint32Array(this.maxSize * this.maxSize), GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST),
            spinsData: this.api.createBuffer(new Float32Array([this.gridSize[0], this.gridSize[1]]), GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST)
        };
        this.physicsData = {
            simValues: this.api.createBuffer(new Float32Array([0, 0, 1, 1, 0]), GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST),
            physData: this.api.createBuffer(new Float32Array([this.temperature(), this.spin(), this.couplingConst()]), GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST)
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
                ]
            ]
        });
        

        // ===== SET INITIAL DATA =====
        let randomSpins = new Uint32Array(this.maxSize * this.maxSize).map(() => Math.round(Math.random())); // Random spins
        //let randomSpins = new Uint32Array(this.maxSize * this.maxSize).fill(1); // All spins up
        this.api.updateBuffer(this.spinsData.spinsBuffer, randomSpins);
    }

    async tick(dt) {
        // Update WebGPU dependencies
        this.api.tick();

        // Update gui values
        this.api.updateBuffer(this.physicsData.physData, new Float32Array([this.temperature(), this.spin(), this.couplingConst()]));

        if (this.size() != this.lastSize) {
            // Check size
            this.lastSize = this.size();
            this.gridSize = [this.size(), parseInt(this.size() * this.canvas.height / this.canvas.width)];
            this.api.updateBuffer(this.spinsData.spinsData, new Float32Array([this.gridSize[0], this.gridSize[1]]));

            // Reset spins
            let randomSpins = new Uint32Array(this.maxSize * this.maxSize).map(() => Math.round(Math.random())); // Random spins
            //let randomSpins = new Uint32Array(this.maxSize * this.maxSize).fill(1); // All spins up
            this.api.updateBuffer(this.spinsData.spinsBuffer, randomSpins);
        }

        // Run compute shaders
        await simulation.runCompute();
        
        // Display grid
        this.graphicsPipeline.run();
    }

    async runCompute() {
        // Run compute shader
        for (let i = 0; i < this.runCountByTick(); i++) {
            // Update random values
            let translVectorRand = [Math.round(Math.random() * 1000000) / 10000, Math.round(Math.random() * 1000000) / 10000];
            let scaleVectorRand = [Math.round(Math.random() * 1000000) / 300000 + 1, Math.round(Math.random() * 100000) / 300000 + 1];
            this.frameID = (this.frameID + 1) % 2;
            this.api.updateBuffer(this.physicsData.simValues, new Float32Array([
                translVectorRand[0], translVectorRand[1],
                scaleVectorRand[0], scaleVectorRand[1],
                this.frameID
            ]));

            // Run compute pipeline
            this.computePipeline.run(Math.ceil(this.gridSize[0] / 16.0), Math.ceil(this.gridSize[1] / 16.0));
        }
    }
}