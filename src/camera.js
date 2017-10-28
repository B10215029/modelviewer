import { mat4, vec3 } from "gl-matrix";
export class Camera {
    constructor() {
        /** @type {"perspective"|"ortho"|"frustum"} */
        this.projectionType = "ortho";
        this.eye = [0, 0, 1];
        this.center = [0, 0, 0];
        this.up = [0, 1, 0];
        this.rotation = [0, 0, 0];
        this.scale = 5.5;
        this.fovy = 45;
        this.aspect = 1;
        this.left = -1;
        this.right = 1;
        this.bottom = -1;
        this.top = 1;
        this.near = 0;
        this.far = 1;
    }

    /**
     * @type {mat4}
     */
    get viewMatrix() {
        let eye = vec3.scale(vec3.create(), this.eye, Math.pow(2, this.scale));
        vec3.rotateX(eye, eye, [0, 0, 0], this.rotation[0]);
        vec3.rotateY(eye, eye, [0, 0, 0], this.rotation[1]);
        return mat4.lookAt(mat4.create(), eye, this.center, this.up);
    }

    /**
     * @type {mat4}
     */
    get projectionMatrix() {
        let mat = mat4.create();
        if (this.projectionType === "perspective")
            mat4.perspective(mat, this.fovy, this.aspect, this.near, this.far);
        else if (this.projectionType === "ortho")
            mat4.ortho(mat, this.left, this.right, this.bottom, this.top, this.near, this.far);
        else if (this.projectionType === "frustum")
            mat4.frustum(mat, this.left, this.right, this.bottom, this.top, this.near, this.far);
        return mat;
    }

    /**
     *
     * @param {vec3} eye Position of the viewer
     * @param {vec3} center Point the viewer is looking at
     * @param {vec3} up vec3 pointing up
     */
    lookAt(eye, center, up) {
        this.eye = eye;
        this.center = center;
        this.up = up;
    }

    /**
     * 
     * @param {number} fovy Vertical field of view in radians
     * @param {number} aspect Aspect ratio. typically viewport width/height
     * @param {number} near Near bound of the frustum
     * @param {number} far Far bound of the frustum
     */
    perspective(fovy, aspect, near, far) {
        this.fovy = fovy;
        this.aspect = aspect;
        this.near = near;
        this.far = far;
        this.projectionType = "perspective";
    }

    /**
     * 
     * @param {Number} left Left bound of the frustum
     * @param {Number} right Right bound of the frustum
     * @param {Number} bottom Bottom bound of the frustum
     * @param {Number} top Top bound of the frustum
     * @param {Number} near Near bound of the frustum
     * @param {Number} far Far bound of the frustum
     */
    ortho(left, right, bottom, top, near, far) {
        this.left = left;
        this.right = right;
        this.bottom = bottom;
        this.top = top;
        this.near = near;
        this.far = far;
        this.projectionType = "ortho";
    }

    /**
     *
     * @param {Number} left Left bound of the frustum
     * @param {Number} right Right bound of the frustum
     * @param {Number} bottom Bottom bound of the frustum
     * @param {Number} top Top bound of the frustum
     * @param {Number} near Near bound of the frustum
     * @param {Number} far Far bound of the frustum
     */
    frustum(left, right, bottom, top, near, far) {
        this.left = left;
        this.right = right;
        this.bottom = bottom;
        this.top = top;
        this.near = near;
        this.far = far;
        this.projectionType = "frustum";
    }
}
