function getConfig() {
    return [
        parseInt(this.params.n()),
        parseInt(this.params.l()),
        parseInt(this.params.m()),
        parseFloat(this.params.opacity()),
        parseInt(this.params.Z())
    ];
}

async function startProgram() {
    // Set canvas size
    let can = document.getElementById('drawing-canvas');
    can.width = window.innerWidth * 0.95;
    can.height = window.innerHeight * 0.95;

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
    this.optionsGUI = new OptionsGuiAPI("Hydrogen atom", "Simulation of the wavefunction of the <c>Hydrogen Atom orbitals</c>.");

    let numbers = this.optionsGUI.addFolder('Quantum number');
    this.params.n = this.optionsGUI.addInput("$$n$$", numbers, 4, 0, 10, 1, '<c>Principal</c> Quantum Number.');
    this.params.l = this.optionsGUI.addInput("$$l$$", numbers, 1, 0, 10, 1, '<c>Angular Momentum</c> Quantum Number.');
    this.params.m = this.optionsGUI.addInput("$$m$$", numbers, -1, -10, 10, 1, '<c>Magnetic</c> Quantum Number.');
    
    let config = this.optionsGUI.addFolder('Configuration');
    this.params.opacity = this.optionsGUI.addInput("Opacity", config, 12.0, 0.1, 500, 0.01);
    this.params.Z = this.optionsGUI.addInput("Atomic Number", config, 1, 1, 10, 1);
    this.optionsGUI.processMaths();
}


window.addEventListener("load", startProgram);
