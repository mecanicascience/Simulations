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
        // General config
        let size = 4000; // Number of spins on a side
        let temperature = 2;
        let spin = 1;
        let couplingConst = 1;
        this.runCountByTick = 1; // Numbers of spins flipped each tick

        // Set config values
        this.gridSize = [size, parseInt(size * this.canvas.height / this.canvas.width)]; // Grid side size
        this.spinsCount = this.gridSize[0] * this.gridSize[1];

        // Counting values
        this.stepsCount = -1;
        this.stepDisplayed = -100;
        this.frameID = 0;

        // ===== DATA STORAGE =====
        // Create data containers
        this.spinsData = {
            spinsBuffer: this.api.createBuffer(new Uint32Array(this.spinsCount), GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST),
            spinsData: this.api.createBuffer(new Float32Array([this.gridSize[0], this.gridSize[1]]), GPUBufferUsage.UNIFORM)
        };
        this.physicsData = {
            simValues: this.api.createBuffer(new Float32Array([0, 0, 1, 1, 0]), GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST),
            physData: this.api.createBuffer(new Float32Array([temperature, spin, couplingConst]), GPUBufferUsage.UNIFORM)
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
        let randomSpins = new Uint32Array(this.spinsCount);
        // Set random spins
        for (let i = 0; i < this.spinsCount; i++)
            randomSpins[i] = Math.round(Math.random());
        // Set spins all up
        //randomSpins.fill(1);

        // Update spins
        this.api.updateBuffer(this.spinsData.spinsBuffer, randomSpins);
    }

    async tick(dt) {
        // Update WebGPU dependencies
        this.api.tick();

        // Display grid
        this.graphicsPipeline.run();

        // Run compute shaders
        await simulation.runCompute();
    }

    async runCompute() {
        // Run compute shader
        for (let i = 0; i < this.runCountByTick; i++) {
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

        // Debug values
        this.stepsCount += this.runCountByTick;
        if (this.stepsCount - this.stepDisplayed >= 10000) {
            this.stepDisplayed = this.stepsCount;
            console.log("Step : ", Math.round(this.stepsCount / 10) * 10);
        }
    }
}