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



@compute @workgroup_size(16, 16)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let coords = vec2<f32>(f32(global_id.x), f32(global_id.y));
    if (coords.x >= inGridData.size.x || coords.y >= inGridData.size.y) {
        return;
    }

    // Get spin
    let sp = inGridSpins.points[i32(coords.x + coords.y * inGridData.size.x)];

    // Set spin
    if (sp == 0) {
        inGridSpins.points[i32(coords.x + coords.y * inGridData.size.x)] = 0;
    }
    else {
        inGridSpins.points[i32(coords.x + coords.y * inGridData.size.x)] = 1;
    }
}
