class Simulator {
    constructor(canvas) {
        this.canvas = canvas;
    }

    async initialize() {
        // Initialize
        this.api = new WebGPUAPI(document.getElementById('drawing-canvas'));
        await this.api.initialize();


        // ===== CONFIG =====
        this.spinsCountW = 100; // Grid side size
        this.spinsCount = this.spinsCountW * this.spinsCountW;


        // ===== DATA STORAGE =====
        // Create data containers
        this.spinsData = {
            spinsBuffer: this.api.createBuffer(new Uint32Array(this.spinsCount), GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST),
            spinsData: this.api.createBuffer(new Float32Array([this.spinsCountW, this.spinsCountW]), GPUBufferUsage.UNIFORM),
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
                ]
            ]
        });
        

        // ===== SET INITIAL DATA =====
        // Set random spins
        let randomSpins = new Uint32Array(this.spinsCount);
        for (let i = 0; i < this.spinsCount; i++)
            randomSpins[i] = Math.round(Math.random());
        this.api.updateBuffer(this.spinsData.spinsBuffer, randomSpins);
    }

    async tick(dt) {
        // Update simulator
        this.api.tick();

        // Run compute pipeline
        let worksGCount = Math.ceil(this.spinsCountW / 16.0);
        this.computePipeline.run(worksGCount, worksGCount);

        // Display grid
        this.graphicsPipeline.run();
    }
}