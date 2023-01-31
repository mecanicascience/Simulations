struct Grid {
    points : array<f32>
};
@group(0) @binding(0) var<storage, read> inGrid : Grid;
@group(0) @binding(1) var<storage, read> inGridSpeed : Grid;

struct GridConfig {
    size: vec2<f32>
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
    // Colors
    var positiveColor = vec3<f32>(0.9, 0.2, 0.2);
    var middleColor   = vec3<f32>(0.05, 0.05, 0.05);
    var negativeColor = vec3<f32>(0.2, 0.2, 0.9);

    // Clamp
    var t = inGrid.points[index];
    if (t > 1) { t = 1; }
    else if (t < -1) { t = -1; }

    // Compute wave color
    var col = middleColor;
    if (t < 0) {
        col = abs(t) * negativeColor + (1.0 - abs(t)) * middleColor;
    }
    else if (t > 0) {
        col = t * positiveColor + (1.0 - t) * middleColor;
    }

    // Add walls color
    col = col / inGridSpeed.points[index];
    return col;
}
