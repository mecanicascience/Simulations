// COMPUTE THERMODYNAMICAL VARIABLES
// ==== Spins grid data ====
struct GridSpins {
    points : array<u32>
};
@group(0) @binding(0) var<storage, read> inGridSpins : GridSpins;

struct GridData {
    size : vec2<f32>
};
@group(0) @binding(1) var<uniform> inGridData : GridData;


// ==== Simulation ====
struct PhysData {
    temperature : f32,
    magField : f32,
    couplingConst : f32
};
@group(1) @binding(0) var<uniform> inPhysicsData : PhysData;

struct ThermoValues {
    energy : atomic<i32>,
    magnetization : atomic<i32>
};
@group(1) @binding(1) var<storage, read_write> inThermoValues : ThermoValues;


@compute @workgroup_size(16, 16)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let coords = vec2<f32>(f32(global_id.x), f32(global_id.y));
    if (coords.x >= inGridData.size.x || coords.y >= inGridData.size.y) {
        return;
    }

    // Compute values
    computeEnergy(coords);
    computeSpin(coords);
}


// ======= PHYSICS =======
fn computeEnergy(coords: vec2<f32>) {
    // Grid and atom values
    let atomS = f32(spinAt(coords.x, coords.y)) * 2.0 - 1.0;
    let j = inPhysicsData.couplingConst;

    // Sum over 4 neighbor (periodic conditions)
    var E = -j * atomS * (
              f32(spinAt(coords.x, coords.y + 1.0)) * 2.0 - 1.0
            + f32(spinAt(coords.x, coords.y - 1.0)) * 2.0 - 1.0
            + f32(spinAt(coords.x + 1.0, coords.y)) * 2.0 - 1.0
            + f32(spinAt(coords.x - 1.0, coords.y)) * 2.0 - 1.0
    );
    E += -atomS * inPhysicsData.magField;
    
}

fn computeSpin(coords: vec2<f32>) {
    let spinVal = f32(spinAt(coords.x, coords.y)) * 2.0 - 1.0;
    atomicAdd(&inThermoValues.magnetization, i32(round(spinVal)));
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
