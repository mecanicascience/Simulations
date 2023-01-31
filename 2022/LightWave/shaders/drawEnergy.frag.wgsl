struct Grid {
    points : array<f32>
};
@group(0) @binding(0) var<storage, read> inGrid : Grid;
@group(0) @binding(1) var<storage, read> inGridSpeed : Grid;

struct GridConfig {
    size: vec2<f32>,
    deltat: f32,
    deltax: f32,
    deltay: f32,
    lightSpeed: f32,
    damping: f32,
    energyAvgCount: f32
};
@group(1) @binding(0) var<uniform> inGridConfig : GridConfig;


@fragment
fn main(@location(0) inUv : vec2<f32>) -> @location(0) vec4<f32> {
    // Coords
    var coords = vec2<f32>(floor(inUv.x * inGridConfig.size.x), floor(inUv.y * inGridConfig.size.y));
    var index = i32(coords.x + coords.y * inGridConfig.size.x);

    // Compute color
    var col = computeColor(index);
    return vec4<f32>(col.r, col.g, col.b, 1.0);
}

// Compute pixel color
fn computeColor(index : i32) -> vec3<f32> {
    var t = inGrid.points[index] / inGridConfig.energyAvgCount;
    var col = t * vec3<f32>(1.0, 1.0, 0.0) + (1.0 - t) * vec3<f32>(0.05, 0.05, 0.05);

    // Add walls color
    col = col / inGridSpeed.points[index];
    return col;
}
