class Camera {
    constructor(fovy, aspect, near, far) {
        this.fovy = fovy;
        this.aspect = aspect;
        this.near = near;
        this.far = far;

        this.world = mat4.create();
        this.update_projection();
    }

    update_projection() {
        this.projection = mat4.create();
        mat4.perspective(this.projection, this.fovy, this.aspect, this.near, this.far);
    }

    set_aspect(aspect) {
        this.aspect = aspect;
        this.update_projection();
    }

    get_world_to_clip_matrix() {
        let out = mat4.create();
        return mat4.multiply(out, this.projection, this.get_world_to_view_matrix());
    }

    get_world_to_view_matrix() {
        let inv = mat4.create();
        return mat4.invert(inv, this.world);
    }

    translate(translation) {
        let trans = mat4.create();
        mat4.fromTranslation(trans, translation);
        mat4.multiply(this.world, this.world, trans);
    }

    rotate(rotate_fn, angle_rad) {
        let trans = mat4.create();
        rotate_fn(trans, trans, angle_rad);
        mat4.multiply(this.world, this.world, trans);
    }

    rotate_x(angle_rad) {
        this.rotate(mat4.rotateX, angle_rad);
    }

    rotate_y(angle_rad) {
        this.rotate(mat4.rotateY, angle_rad);
    }

    rotate_z(angle_rad) {
        this.rotate(mat4.rotateZ, angle_rad);
    }

    look_at(point, up) {
        let pos = vec3.create();
        mat4.getTranslation(pos, this.world);
        let trans = mat4.create();
        mat4.fromTranslation(trans, pos);
        let view = vec3.create();
        vec3.sub(view, point, pos);
        let rot = Camera.look_towards(view, up);
        mat4.multiply(trans, trans, rot);
        mat4.copy(this.world, trans);
    }

    static look_towards(front_vec, up_vec) {
        vec3.normalize(front_vec, front_vec);
        vec3.normalize(up_vec, up_vec);

        if(Math.abs(vec3.dot(up_vec, front_vec)) > 0.99999) {
            return mat4.create();
        }

        let prev_up = vec3.create();
        vec3.copy(prev_up, up_vec);

        let right = vec3.create();
        vec3.cross(right, front_vec, prev_up);
        let up = vec3.create();
        vec3.cross(up, right, front_vec);

        vec3.normalize(right, right);
        vec3.normalize(up, up);

        return mat4.fromValues(
            right[0], right[1], right[2], 0,
            up[0], up[1], up[2], 0,
            -front_vec[0], -front_vec[1], -front_vec[2], 0,
            0, 0, 0, 1
        );
    }
}
