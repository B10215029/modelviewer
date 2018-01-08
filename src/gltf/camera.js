import GLTF from "./index";

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
        this.zfar = data.zfar;
        this.znear = data.znear;
        // this.extensions = data.extensions;
        // this.extras = data.extras;
    }
}
