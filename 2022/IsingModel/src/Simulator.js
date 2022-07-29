class Simulator {
    constructor(canvas) {
        this.canvas = canvas;
    }

    async initialize() {
        // Initialize
        this.api = new WebGPUAPI(document.getElementById('drawing-canvas'));
        await this.api.initialize();


        // ===== CONFIG =====
        // General config
        this.spinsCountW = 200; // Grid side size
        this.runCountByTick = 200; // Numbers of spins flipped each tick
        this.spinsCount = this.spinsCountW * this.spinsCountW;

        // Physics data
        let temperature = 3;
        let spin = 1;
        let couplingConst = 1;


        // ===== DATA STORAGE =====
        // Create data containers
        this.spinsData = {
            spinsBuffer: this.api.createBuffer(new Uint32Array(this.spinsCount), GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST),
            spinsData: this.api.createBuffer(new Float32Array([this.spinsCountW, this.spinsCountW]), GPUBufferUsage.UNIFORM)
        };
        this.physicsData = {
            randomValues: this.api.createBuffer(new Float32Array([0, 0, 1, 1]), GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST),
            physData: this.api.createBuffer(new Float32Array([temperature, spin, couplingConst]), GPUBufferUsage.UNIFORM),
            selectedSpin: this.api.createBuffer(new Float32Array([-1, -1]), GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST)
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
                ],
                [
                    {
                        type: "buffer",
                        visibility: GPUShaderStage.FRAGMENT,
                        bufferAccess: "uniform",
                        buffer: this.physicsData.randomValues
                    },
                    {
                        type: "buffer",
                        visibility: GPUShaderStage.FRAGMENT,
                        bufferAccess: "uniform",
                        buffer: this.physicsData.physData
                    },
                    {
                        type: "buffer",
                        visibility: GPUShaderStage.FRAGMENT,
                        bufferAccess: "uniform",
                        buffer: this.physicsData.selectedSpin
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
                        buffer: this.physicsData.randomValues
                    },
                    {
                        type: "buffer",
                        visibility: GPUShaderStage.COMPUTE,
                        bufferAccess: "uniform",
                        buffer: this.physicsData.physData
                    },
                    {
                        type: "buffer",
                        visibility: GPUShaderStage.COMPUTE,
                        bufferAccess: "uniform",
                        buffer: this.physicsData.selectedSpin
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

        // Counting values
        this.stepsCount = -1;
        this.stepDisplayed = -100;
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
            let translVector = [Math.round(Math.random() * 1000000) / 1000, Math.round(Math.random() * 1000000) / 1000];
            let scaleVector = [Math.round(Math.random() * 1000000) / 10000 + 1, Math.round(Math.random() * 100000) / 10000 + 1];
            this.api.updateBuffer(this.physicsData.randomValues, new Float32Array([translVector[0], translVector[1], scaleVector[0], scaleVector[1]]));

            // Update selected spin
            let selectedSpin = [Math.floor(Math.random() * this.spinsCountW), Math.floor(Math.random() * this.spinsCountW)];
            this.api.updateBuffer(this.physicsData.selectedSpin, new Float32Array([selectedSpin[0], selectedSpin[1]]));

            // Run compute pipeline
            let worksGCount = Math.ceil(this.spinsCountW / 16.0);
            this.computePipeline.run(worksGCount, worksGCount);
        }

        // Debug values
        this.stepsCount += this.runCountByTick;
        if (this.stepsCount - this.stepDisplayed >= 10000) {
            this.stepDisplayed = this.stepsCount;
            console.log("Step : ", Math.round(this.stepsCount / 10) * 10);
        }
    }
}