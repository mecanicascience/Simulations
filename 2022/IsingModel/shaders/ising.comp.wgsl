// COMPUTE NEXT FRAME FOR ISING MODEL
// ==== Spins grid data ====
struct GridSpins {
    points : array<u32>
};
@group(0) @binding(0) var<storage, read_write> inGridSpins : GridSpins;

struct GridData {
    size : vec2<f32>
};
@group(0) @binding(1) var<uniform> inGridData : GridData;


// ==== Simulation ====
struct SimulationValues {
    translationRandValues : vec2<f32>,
    scaleRandValues : vec2<f32>,
    frameID : f32
};
@group(1) @binding(0) var<uniform> inSimValues : SimulationValues;

struct PhysData {
    temperature : f32,
    spin : f32,
    couplingConst : f32
};
@group(1) @binding(1) var<uniform> inPhysicsData : PhysData;



@stage(compute) @workgroup_size(16, 16)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let coords = vec2<f32>(f32(global_id.x), f32(global_id.y));
    if (coords.x >= inGridData.size.x || coords.y >= inGridData.size.y) {
        return;
    }

    // Check if this spin can be selected during this frame
    if (inSimValues.frameID == 0.0 && (
           (coords.y % 2.0 == 0.0 && coords.x % 2.0 == 0.0)
        || (coords.y % 2.0 == 1.0 && coords.x % 2.0 == 1.0)
    )) { return; }
    if (inSimValues.frameID == 1.0 && (
           (coords.y % 2.0 == 0.0 && coords.x % 2.0 == 1.0)
        || (coords.y % 2.0 == 1.0 && coords.x % 2.0 == 0.0)
    )) { return; }

    // Set spin by running the algorithm
    inGridSpins.points[i32(coords.x + coords.y * inGridData.size.x)] = metropolis(coords);
}



// ======== PHYSICS ========
// Check if the spin should be inverted using the Metropolis algorithm
fn metropolis(coords : vec2<f32>) -> u32 {
    var sp = spinAt(coords.x, coords.y);

    // Compute old and new energies
	let oldE = 2.0 * computeEnergy(sp, coords);
    if (sp == 0u) { sp = 1u; } else { sp = 0u; } // Invert spin
	let newE = 2.0 * computeEnergy(sp, coords);

    // Run Metropolis algorithm
	let deltaE = newE - oldE;
    if (deltaE < 0.0) { // DeltaE < 0 : Change accepted
        return sp;
    }

    // DeltaE >= 0
    let invertProba = randFast(coords);
    let beta = 1.0 / inPhysicsData.temperature;
    if (invertProba <= exp(-beta * deltaE)) {
        return sp; // Change accepted
    }
    if (sp == 0u) { sp = 1u; } else { sp = 0u; } // Change refused
    return sp;
}

// Compute the energy given by the atom and given it's spin sp
fn computeEnergy(sp : u32, coords : vec2<f32>) -> f32 {
    // Grid and atom values
    let atomS = f32(sp) * 2.0 - 1.0;
    let s = inPhysicsData.spin;
    let j = inPhysicsData.couplingConst;

    // Sum over 4 neighbor (periodic conditions)
    return -j * s * atomS * (f32(spinAt(coords.x, coords.y + 1.0)) * 2.0 - 1.0)
           -j * s * atomS * (f32(spinAt(coords.x, coords.y - 1.0)) * 2.0 - 1.0)
           -j * s * atomS * (f32(spinAt(coords.x + 1.0, coords.y)) * 2.0 - 1.0)
           -j * s * atomS * (f32(spinAt(coords.x - 1.0, coords.y)) * 2.0 - 1.0);
}



// ======= UTILS ========
// Return the spin of the element at given coordinates, handle edges
fn spinAt(x : f32, y : f32) -> u32 {
    var coordsAbs = vec2<f32>(x, y);
    // Check if x in range
    if (coordsAbs.x >= inGridData.size.x) { coordsAbs.x -= inGridData.size.x; }
    else if (coordsAbs.x < 0.0) { coordsAbs.x += inGridData.size.x; }

    // Check if y in range
    if (coordsAbs.y >= inGridData.size.y) { coordsAbs.y -= inGridData.size.y; }
    else if (coordsAbs.y < 0.0) { coordsAbs.y += inGridData.size.y; }

    return inGridSpins.points[i32(round(coordsAbs.x) + round(coordsAbs.y) * inGridData.size.x)];
}

// Gives a random number between 0 and 1
// Using UE4 RandFast : https://github.com/EpicGames/UnrealEngine/blob/release/Engine/Shaders/Private/Random.ush
fn randFast(v : vec2<f32>) -> f32 {
    let v2 = (v + inSimValues.translationRandValues) * inSimValues.scaleRandValues;
    let magic = 3571.0;
    let random2 = (1.0 / 4320.0) * v2 + vec2<f32>(0.25, 0.0);
    let random = fract(dot(random2 * random2, vec2<f32>(magic)));
    return fract(random * random * (magic * 2.0));
}
