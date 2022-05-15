function getConfig() {
    return [
        parseInt(this.params.n()),
        parseInt(this.params.l()),
        parseInt(this.params.m()),
        parseInt(this.params.opacity()),
        parseInt(this.params.Z())
    ];
}

async function startProgram() {
    // Set canvas size
    let can = document.getElementById('drawing-canvas');
    can.width = window.innerWidth;
    can.height = window.innerHeight;

    // Load GUI
    loadGUI();

    // Add loading GPU module
    const otMeta = document.createElement('meta');
    otMeta.httpEquiv = 'origin-trial';
    otMeta.content = 'AmuZWablDld33xMJcfEiPlfHNGLwljmCzpZzCJj5kwgDYGU5ODvXK/6nTOJFLJuLusomNtFkSu44q7kVO+zncAEAAABxeyJvcmlnaW4iOiJodHRwczovL3NpbXVsYXRpb25zLm1lY2FuaWNhc2NpZW5jZS5mcjo0NDMiLCJmZWF0dXJlIjoiV2ViR1BVIiwiZXhwaXJ5IjoxNjYzNzE4Mzk5LCJpc1N1YmRvbWFpbiI6dHJ1ZX0=';
    document.head.append(otMeta);

    // Check WebGPU compatibility
    if (navigator.gpu == undefined) {
        const errorDom = document.createElement('p');
        errorDom.innerHTML = "Your browser doesn't support WebGPU.\nPlease use one of the latests Google Chrome versions.";
        document.getElementById('error_div').append(errorDom);
        throw new Error('WebGPU is not supported on this browser.');
    }

    // Start WebGPU Simulator
    let canvas = document.getElementById('drawing-canvas');
    let simulator = new WebGPUSimulator(canvas);
    
    // Initialize simulator
    await simulator.initialize();

    // Start engine
    await simulator.run();
}

async function loadGUI() {
    this.params = {};
    this.optionsGUI = new OptionsGUI();
    this.optionsGUI.addFolder('\\text{Paramètres}', 'root', 'parameters');
    
    this.optionsGUI.addFolder('\\text{Configuration}', this.optionsGUI.datas.parameters, 'config');
    this.params.opacity = this.optionsGUI.addInput("\\text{Opacité}", 5000, 1000, 100000, this.optionsGUI.datas.parameters.config);
    this.params.Z = this.optionsGUI.addInput("\\text{Numéro atomique} Z", 1, 1, 10, this.optionsGUI.datas.parameters.config);

    this.optionsGUI.addFolder('\\text{Nombre quantiques}', this.optionsGUI.datas.parameters, 'quantum_numbers');
    this.params.n = this.optionsGUI.addInput("n", 2, 0, 10, this.optionsGUI.datas.parameters.quantum_numbers);
    this.params.l = this.optionsGUI.addInput("l", 1, 1, 10, this.optionsGUI.datas.parameters.quantum_numbers);
    this.params.m = this.optionsGUI.addInput("m", 0, -10, 10, this.optionsGUI.datas.parameters.quantum_numbers);
}


window.addEventListener("load", startProgram);
