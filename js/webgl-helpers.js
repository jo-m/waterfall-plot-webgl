class WebGLHelpers {
    static create_program(gl, vertex_src, fragment_src) {
        let program = gl.createProgram();

        let vs = WebGLHelpers.create_shader(gl, vertex_src, gl.VERTEX_SHADER);
        let fs = WebGLHelpers.create_shader(gl, '#ifdef GL_ES\nprecision highp float;\n#endif\n\n' + fragment_src, gl.FRAGMENT_SHADER);

        if ( vs === null || fs === null ) return null;

        gl.attachShader(program, vs);
        gl.attachShader(program, fs);

        gl.deleteShader(vs);
        gl.deleteShader(fs);

        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            alert("ERROR:\n" +
            "VALIDATE_STATUS: " + gl.getProgramParameter(program, gl.VALIDATE_STATUS) + "\n" +
            "ERROR: " + gl.getError() + "\n\n" +
            "- Vertex Shader -\n" + vertex_src + "\n\n" +
            "- Fragment Shader -\n" + fragment_src);
            return null;
        }
        return program;
    }

    static create_shader(gl, src, type) {
        let shader = gl.createShader(type);

        gl.shaderSource(shader, src);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert((type == gl.VERTEX_SHADER ? "VERTEX" : "FRAGMENT") + " SHADER:\n" + gl.getShaderInfoLog(shader));
            return null;
        }
        return shader;
    }
}
