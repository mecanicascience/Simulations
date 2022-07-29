// ==== Spins grid data ====
struct GridSpins {
    points : array<u32>
};
@group(0) @binding(0) var<storage> inGridSpins : GridSpins;

struct GridData {
    size : vec2<f32>
};
@group(0) @binding(1) var<uniform> inGridData : GridData;


@stage(fragment)
fn main(@location(0) inUv : vec2<f32>) -> @location(0) vec4<f32> {
    let coords = vec2<f32>(floor(inUv.x * inGridData.size.x), floor(inUv.y * inGridData.size.y));
    let sign = inGridSpins.points[i32(coords.x + coords.y * inGridData.size.x)];
    if (sign == 0u) {
        return vec4<f32>(0.2, 0.2, 0.3, 1.0);
    }
    else {
        return vec4<f32>(1.0, 1.0, 1.0, 1.0);
    }
}
