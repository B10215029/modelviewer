import GLTF from "./index";
import {mat4} from "gl-matrix";

export default class Camera {
    /**
     * 
     * @param {GLTF} gltf 
     * @param {*} data 
     */
    constructor(gltf, data) {
        this.gltf = gltf;
        if (data.orthographicname) {
            this.orthographic = new Orthographic(gltf, data.orthographicname);
        }
        if (data.perspective) {
            this.perspective = new Perspective(gltf, data.perspective);
        }
        this.type = data.type;
        this.name = data.name;
        // this.extensions = data.extensions;
        // this.extras = data.extras;
    }

    get projectionMatrix() {
        if (!this.matrix) {
            if (this.type === Camera.Type.perspective && this.perspective) {
                this.matrix = this.perspective.matrix;
            } else if (this.type === Camera.Type.orthographic && this.orthographic) {
                this.matrix = this.orthographic.matrix;
            } else {
                this.matrix = mat4.create();
            }
        }
        return this.matrix;
    }
}
Camera.Type = {
    perspective: "perspective",
    orthographic: "orthographic",
}

export class Orthographic {
    /**
     * 
     * @param {GLTF} gltf 
     * @param {*} data 
     */
    constructor(gltf, data) {
        this.gltf = gltf;
        this.xmag = data.xmag;
        this.ymag = data.ymag;
        this.zfar = data.zfar;
        this.znear = data.znear;
        // this.extensions = data.extensions;
        // this.extras = data.extras;
    }

    get matrix() {
        return mat4.ortho(mat4.create(), this.xmag / 2, this.xmag / -2, this.ymag / 2, this.ymag / -2, this.znear, this.zfar);
    }
}

export class Perspective {
    /**
     * 
     * @param {GLTF} gltf 
     * @param {*} data 
     */
    constructor(gltf, data) {
        this.gltf = gltf;
        this.aspectRatio = data.aspectRatio;
        this.yfov = data.yfov;
        this.zfar = data.zfar !== undefined ? data.zfar : Number.POSITIVE_INFINITY;
        this.znear = data.znear;
        // this.extensions = data.extensions;
        // this.extras = data.extras;
    }

    get matrix() {
        return this.perspective(mat4.create(), this.yfov, this.aspectRatio, this.znear, this.zfar);
    }

    perspective(out, fovy, aspect, near, far) {
        mat4.perspective(out, fovy, aspect, near, far);
        if (far === Number.POSITIVE_INFINITY) {
            out[10] = -1;
            out[14] = -2 * near;
        }
        return out;
      }
}
