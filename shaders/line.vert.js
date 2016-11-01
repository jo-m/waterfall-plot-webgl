window.Shaders = window.Shaders || {frag: {}, vert: {}};
Shaders.vert.line = `

attribute vec3 vertex;

uniform mat4 vertex_model_to_world;
uniform mat4 vertex_world_to_clip;

uniform float time_offset;
uniform float line_offset;

varying vec2 vertex_2d;
varying float offset;

void main() {
    vertex_2d = vertex.xy;
    offset = line_offset + time_offset;
    gl_Position = vertex_world_to_clip * vertex_model_to_world * vec4(vertex.x, vertex.y, -offset, 1.0);
}`;
