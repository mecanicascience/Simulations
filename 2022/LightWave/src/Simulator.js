class Simulator {
    constructor(canvas) {
        this.canvas = canvas;

        // Resize canvas to window size
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight * 0.999;
    }

    async initialize() {
        // Physics
        let deltat = 1;
        let deltax = 20;
        let deltay = 20;
        this.computePerFrame = 15;
        let lightSpeed = 1;
        let damping = 0.0; // 0 - 1

        // Sine wave
        this.amplitude = 1;
        this.pulsation = 0.2;
        this.maxt = 200; // 0 for infinite
        this.energyFrameCount = Math.round(2 * Math.PI / this.pulsation) * 1;

        // Start API
        this.api = new WebGPUAPI(document.getElementById('drawing-canvas'));
        if (!await this.api.initialize())
            document.getElementById('error-p').innerHTML = "Your browser doesn't support WebGPU yet. Try using the latest Google Chrome version.";

        // Set grid speed
        let gridSpeedVal = new Float32Array(this.canvas.width * this.canvas.height).map((el, index) => {
            let x = index % this.canvas.width;
            let y = Math.floor(index / this.canvas.height);
            let xSize = 6;
            let ySize = 6;

            // Parabolla
            /*if (x > Math.round(this.canvas.width / 2)) {
                let newX = x / this.canvas.width * 2 - 1 + 1;
                let newY = (y / this.canvas.height * 2 - 1 - 1) / 2;
                let dist2 = newX*newX + newY*newY;
                if (dist2 > 1.5)
                    return 0.0;
            }*/

            // Middle change curved
            // if (x > Math.round(this.canvas.width / 2))
            //     if (y < Math.abs(x - this.canvas.width / 2)*5)
            //         return 0.4;

            // Single slit
            // if (x > Math.round(this.canvas.width / 2) - xSize && x < Math.round(this.canvas.width / 2) + xSize && (y > this.canvas.height / 2 + ySize || y < this.canvas.height / 2 - ySize))
            //     return 0.0;

            // Double slit
            // if (x > Math.round(this.canvas.width / 2) - xSize && x < Math.round(this.canvas.width / 2) + xSize
            //     && (
            //        (y > 0.45 * this.canvas.height + ySize || y < 0.45 * this.canvas.height - ySize)
            //     && (y > 0.55 * this.canvas.height + ySize || y < 0.55 * this.canvas.height - ySize)
            //     )) return 0.0;

            // Fourier
            if (x > Math.round(this.canvas.width / 2) - xSize && x < Math.round(this.canvas.width / 2) + xSize && y % 90 < (90 - ySize) && y % 90 > ySize)
                return 0.0;

            return 1.0;
        });

        // Create resources
        this.computeData = {
            // Grid wave values
            grid0: this.api.createBuffer(new Float32Array(this.canvas.width * this.canvas.height).fill(0), GPUBufferUsage.STORAGE),
            grid1: this.api.createBuffer(new Float32Array(this.canvas.width * this.canvas.height).fill(0), GPUBufferUsage.STORAGE),
            grid2: this.api.createBuffer(new Float32Array(this.canvas.width * this.canvas.height).fill(0), GPUBufferUsage.STORAGE),
            // Grid wave energy
            gridEnergy: this.api.createBuffer(new Float32Array(this.canvas.width * this.canvas.height).fill(0), GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC),
            gridEnergyDisp: this.api.createBuffer(new Float32Array(this.canvas.width * this.canvas.height).fill(0), GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST),
            // Grid speed values
            gridSpeed: this.api.createBuffer(gridSpeedVal, GPUBufferUsage.STORAGE),
            // Grid config
            gridDesc: this.api.createBuffer(new Float32Array([this.canvas.width, this.canvas.height, deltat, deltax, deltay, lightSpeed, damping, this.energyFrameCount]), GPUBufferUsage.UNIFORM),
            sinWaveDesc: this.api.createBuffer(new Float32Array([this.amplitude, this.pulsation, this.maxt, 0.0]), GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST)
        };

        // Graphics pipelines
        for (let i = 0; i < 3; i++) {
            this["graphicsPip" + i] = await this.api.createGraphicsPipeline({ // Draw i
                shaders: [
                    { type: "vert", src: "shaders/wave.vert.wgsl" },
                    { type: "frag", src: "shaders/drawWave.frag.wgsl" }
                ],
                layouts: [
                    [
                        { // Grid values
                            type: "buffer",
                            visibility: GPUShaderStage.FRAGMENT,
                            bufferAccess: "read-only-storage",
                            buffer: this.computeData["grid" + i]
                        },
                        { // Grid speed values
                            type: "buffer",
                            visibility: GPUShaderStage.FRAGMENT,
                            bufferAccess: "read-only-storage",
                            buffer: this.computeData.gridSpeed
                        }
                    ],
                    [
                        { // Grid config
                            type: "buffer",
                            visibility: GPUShaderStage.FRAGMENT,
                            bufferAccess: "uniform",
                            buffer: this.computeData.gridDesc
                        }
                    ]
                ]
            });
        }
        this["graphicsPipEnergy"] = await this.api.createGraphicsPipeline({ // Draw energy
            shaders: [
                { type: "vert", src: "shaders/wave.vert.wgsl" },
                { type: "frag", src: "shaders/drawEnergy.frag.wgsl" }
            ],
            layouts: [
                [
                    { // Grid values
                        type: "buffer",
                        visibility: GPUShaderStage.FRAGMENT,
                        bufferAccess: "read-only-storage",
                        buffer: this.computeData.gridEnergyDisp
                    },
                    { // Grid speed values
                        type: "buffer",
                        visibility: GPUShaderStage.FRAGMENT,
                        bufferAccess: "read-only-storage",
                        buffer: this.computeData.gridSpeed
                    }
                ],
                [
                    { // Grid config
                        type: "buffer",
                        visibility: GPUShaderStage.FRAGMENT,
                        bufferAccess: "uniform",
                        buffer: this.computeData.gridDesc
                    }
                ]
            ]
        });

        // Compute pipelines
        for (let i = 0; i < 3; i++) {
            this["computePip" + i] = await this.api.createComputePipeline({ // Write to i
                shader: {
                    type: "comp",
                    src: "shaders/wave.comp.wgsl"
                },
                layouts: [
                    [
                        { // Read : t - 1
                            type: "buffer",
                            visibility: GPUShaderStage.COMPUTE,
                            bufferAccess: "read-only-storage",
                            buffer: this.computeData["grid" + ((i - 2) + 3) % 3]
                        },
                        { // Read : t
                            type: "buffer",
                            visibility: GPUShaderStage.COMPUTE,
                            bufferAccess: "read-only-storage",
                            buffer: this.computeData["grid" + ((i - 1) + 3) % 3]
                        },
                        { // Write : t + 1
                            type: "buffer",
                            visibility: GPUShaderStage.COMPUTE,
                            bufferAccess: "storage",
                            buffer: this.computeData["grid" + i]
                        },
                        { // Grid energy
                            type: "buffer",
                            visibility: GPUShaderStage.COMPUTE,
                            bufferAccess: "storage",
                            buffer: this.computeData.gridEnergy
                        },
                        { // Grid speed values
                            type: "buffer",
                            visibility: GPUShaderStage.COMPUTE,
                            bufferAccess: "read-only-storage",
                            buffer: this.computeData.gridSpeed
                        }
                    ],
                    [
                        { // Grid config
                            type: "buffer",
                            visibility: GPUShaderStage.COMPUTE,
                            bufferAccess: "uniform",
                            buffer: this.computeData.gridDesc
                        },
                        { // Sin wave config
                            type: "buffer",
                            visibility: GPUShaderStage.COMPUTE,
                            bufferAccess: "uniform",
                            buffer: this.computeData.sinWaveDesc
                        }
                    ]
                ]
            });
        }

        // Global variables
        this.currentFrameID = 0;
        this.t = 0;
        this.energyFrameCounter = 0;
    }

    async tick(dt) {
        // Update WebGPU dependencies
        this.api.tick();
        this.t++;
        
        for (let i = 0; i < this.computePerFrame; i++) {
            // Update buffers
            this.api.updateBuffer(this.computeData.sinWaveDesc, new Float32Array([this.amplitude, this.pulsation, this.maxt, this.t]));

            // Compute
            this["computePip" + this.currentFrameID].run(Math.ceil(this.canvas.width / 16.0), Math.ceil(this.canvas.height / 16.0));

            // Update global variables
            this.currentFrameID = (this.currentFrameID + 1) % 3;
            this.energyFrameCounter++;

            // Handle Energy
            if (this.energyFrameCounter >= this.energyFrameCount) {
                // Reset energy
                this.api.readBuffer(this.computeData.gridEnergy).then((res) => {
                    this.energyData = res;
                    this.shouldUpdateEnergy = true;
                });

                this.api.updateBuffer(this.computeData.gridEnergy, new Float32Array(this.canvas.width * this.canvas.height).fill(0));
                this.energyFrameCounter = 0;
            }

            if (this.shouldUpdateEnergy) {
                this.shouldUpdateEnergy = false;
                this.api.updateBuffer(this.computeData.gridEnergyDisp, this.energyData);
            }
        }

        // Draw
        // this["graphicsPip" + this.currentFrameID].run(); // Waves
        this.graphicsPipEnergy.run(); // Energy
    }
}
