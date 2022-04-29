async function startProgram() {
    // Check WebGPU compatibility
    if (navigator.gpu == undefined)
        console.log("wsh");
    if (navigator.gpu == undefined)
        throw new Error('WebGPU is not supported on this browser.');

    // Start WebGPU Simulator
    let canvas = document.getElementById('drawing-canvas');
    let simulator = new WebGPUSimulator(canvas);
    
    // Initialize simulator
    await simulator.initialize();

    // Start engine
    simulator.run();
}


window.addEventListener("load", startProgram);
