class Waterfall {
    constructor() {
        this.config = {
            n_lines         :   50,
            new_line_freq_hz:   15,
            speed           :    3,

            fft_size        : 1024,
            min_freq_hz     :    0,
            max_freq_hz     : 5000,

            color_line      : [1, 1, 1],
            color_stripe    : [0, 0, 0]
        };

        this.parameters = {
            last_line_inserted_time: new Date().getTime(),
            time                : null,
            delta_time          : null,
            screen_width        : null,
            screen_height       : null,
            audioDataSize       : null,
            line_buffer_length  : null,
            stripe_buffer_length: null
        };

        this.uniforms = {
            color                : null,
            delta_time           : null,
            line_offset          : null,
            vertex_model_to_world: null,
            vertex_world_to_clip : null
        };

        this.init_webgl();

        this.camera = null;
        this.world_matrix = null;
        this.init_camera_world();
        
        this.audio = null;
        this.init_audio();

        this.buffers = [];
    }

    init_audio() {
        this.audio = new Audio(this.config.fft_size, this.config.min_freq_hz, this.config.max_freq_hz);
        this.audio.init();
        this.parameters.audioDataSize = this.audio.get_audio_data_size();
        this.parameters.line_buffer_length = this.parameters.audioDataSize;
        this.parameters.stripe_buffer_length = this.parameters.audioDataSize * 2;
    }

    init_webgl() {
        this.canvas = document.querySelector('canvas');

        try {
            this.gl = this.canvas.getContext('webgl');
        } catch(error) { }
        if (!this.gl) {
            throw "cannot create webgl context";
        }

        // load and compile shaders
        let vertex_shader = document.getElementById('vs').textContent;
        let fragment_shader = document.getElementById('fs').textContent;
        this.shader = WebGLHelpers.create_program(this.gl, vertex_shader, fragment_shader);

        // uniforms
        this.uniforms = {
            color: this.gl.getUniformLocation(this.shader, 'color'),
            delta_time: this.gl.getUniformLocation(this.shader, 'delta_time'),
            line_offset: this.gl.getUniformLocation(this.shader, 'line_offset'),
            vertex_model_to_world: this.gl.getUniformLocation(this.shader, 'vertex_model_to_world'),
            vertex_world_to_clip: this.gl.getUniformLocation(this.shader, 'vertex_world_to_clip')
        };
    }

    init_camera_world() {
        this.camera = new Camera(Math.PI / 4, 1, 0, 1000);
        this.camera.translate([0, 1, 4]);
        this.camera.look_at([0, 0, 0], [0, 1, 0]);

        this.world_matrix = mat4.create();
        mat4.fromScaling(this.world_matrix, [4, 1, 4]);
        mat4.translate(this.world_matrix, this.world_matrix, [-0.5, -1, 0]);
    }

    resize_canvas(event) {
        if (this.canvas.width != this.canvas.clientWidth ||
            this.canvas.height != this.canvas.clientHeight) {

            this.canvas.width = this.canvas.clientWidth;
            this.canvas.height = this.canvas.clientHeight;

            this.parameters.screen_width = this.canvas.width;
            this.parameters.screen_height = this.canvas.height;

            this.camera.set_aspect(this.parameters.screen_width / this.parameters.screen_height);
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    create_line_buffer(data) {
        let points = new Float32Array((this.parameters.line_buffer_length) * 2);

        data.forEach((v, i) => {
            points[i * 2] = i / data.length;
            points[i * 2 + 1] = v / 255;
        });

        let buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, points, this.gl.STATIC_DRAW);

        return buffer;
    }

    create_stripe_buffer(data) {
        let points = new Float32Array((this.parameters.stripe_buffer_length) * 2);

        data.forEach((v, i) => {
            points[i * 4] = i / data.length;
            points[i * 4 + 1] = v / 255;
            points[i * 4 + 2] = i / data.length;
            points[i * 4 + 3] = 0;
        });

        let buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, points, this.gl.STATIC_DRAW);

        return buffer;
    }

    should_insert_new_line() {
        this.parameters.time = new Date().getTime();
        this.parameters.delta_time = this.parameters.time - this.parameters.last_line_inserted_time;
        let new_line_freq_ms = 1 / this.config.new_line_freq_hz * 1000;

        if(this.parameters.delta_time > new_line_freq_ms) {
            this.parameters.delta_time %= new_line_freq_ms;
            this.parameters.last_line_inserted_time = this.parameters.time - this.parameters.delta_time;
            return true;
        } else {
            return false;
        }
    }

    insert_new_line() {
        if(!this.audio.is_initialized()) {
            return;
        }

        let data = this.audio.get_current_audio_data();
        let line_buffer = this.create_line_buffer(data);
        let stripe_buffer = this.create_stripe_buffer(data);
        this.buffers.unshift({line: line_buffer, stripe: stripe_buffer});

        if(this.buffers.length > this.config.n_lines) {
            let old = this.buffers.pop();
            this.gl.deleteBuffer(old.line);
            this.gl.deleteBuffer(old.stripe);
        }
    }

    loop_main() {
        if(this.should_insert_new_line()) {
            this.insert_new_line();    
        }
        this.resize_canvas();
        this.render();
        requestAnimationFrame(this.loop_main.bind(this));
    }

    render() {
        if (!this.shader) return;

        // clear screen
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        // load shader into GPU
        this.gl.useProgram(this.shader);

        // set uniforms
        this.gl.uniform1f(this.uniforms.delta_time, this.parameters.delta_time / 1000 / this.config.n_lines);
        this.gl.uniformMatrix4fv(this.uniforms.vertex_model_to_world, false, this.world_matrix);
        this.gl.uniformMatrix4fv(this.uniforms.vertex_world_to_clip, false, this.camera.get_world_to_clip_matrix());

        // render stripes and lines
        for(let i = this.buffers.length - 1; i >= 0; i--) {
            let b = this.buffers[i];

            this.gl.uniform1f(this.uniforms.line_offset, i / this.config.n_lines);
            let vertex_position = null;

            this.gl.uniform3fv(this.uniforms.color, this.config.color_stripe);
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, b.stripe);
            this.gl.vertexAttribPointer(vertex_position, 2, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(vertex_position);
            this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.parameters.stripe_buffer_length);
            this.gl.disableVertexAttribArray(vertex_position);

            this.gl.uniform3fv(this.uniforms.color, this.config.color_line);
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, b.line);
            this.gl.vertexAttribPointer(vertex_position, 2, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(vertex_position);
            this.gl.drawArrays(this.gl.LINE_STRIP, 0, this.parameters.line_buffer_length);
            this.gl.disableVertexAttribArray(vertex_position);
        }
    }
}
