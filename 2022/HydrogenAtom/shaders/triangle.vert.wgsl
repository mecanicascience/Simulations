struct VSOut {
    @builtin(position) position: vec4<f32>,
    @location(0) pos: vec2<f32>
};


@vertex
fn main(@location(0) inPos: vec3<f32>, // from (-1 = left, -1 = bottom) to (1 = right, 1 = top)
        @location(1) inColor: vec3<f32>) -> VSOut {
    var vsOut : VSOut;
    vsOut.position = vec4<f32>(inPos, 1.0);
    vsOut.pos = (inPos.xy + 1.0) / 2.0;

    return vsOut;
}
