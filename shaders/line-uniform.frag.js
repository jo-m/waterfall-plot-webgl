window.Shaders = window.Shaders || {frag: {}, vert: {}};
Shaders.frag.line_uniform = `

uniform vec3 color;

varying vec2 vertex_2d;

void main() {
    gl_FragColor = vec4(color, 1.0);
}`;
