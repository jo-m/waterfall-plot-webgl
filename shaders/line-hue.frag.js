window.Shaders = window.Shaders || {frag: {}, vert: {}};
Shaders.frag.line_hue = `

varying vec2 vertex_2d;
varying float offset;

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
    vec3 hsv = vec3(vertex_2d.y * 1.2, 1, 1.0 - offset * 0.6);
    hsv = min(hsv, vec3(1, 1, 1));
    gl_FragColor = vec4(hsv2rgb(hsv), 1.0);
}`;
