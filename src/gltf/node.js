import GLTF from "./index"
import { vec3, vec4, quat, mat4 } from "gl-matrix"

export default class Node {
    /**
     * 
     * @param {GLTF} gltf 
     * @param {*} data 
     */
    constructor(gltf, data) {
        const loadList = [];
        this.gltf = gltf;
        this.name = data.name;
        if (data.children) {
            this.childrenIndex = data.children;
        }
        this.translation = data.translation ? data.translation : vec3.fromValues(0, 0, 0);
        this.rotation = data.rotation ? data.rotation : quat.fromValues(0, 0, 0, 1);
        this.scale = data.scale ? data.scale : vec3.fromValues(1, 1, 1);
        this.matrix = data.matrix;
        if (data.camera !== undefined && gltf.cameras) {
            this.camera = gltf.cameras[data.camera];
        }
        if (data.skin !== undefined && gltf.skins) {
            this.skin = gltf.skins[data.skin];
            loadList.push(this.skin.loadFinish);
        }
        if (data.mesh !== undefined && gltf.meshes) {
            this.mesh = gltf.meshes[data.mesh];
            loadList.push(this.mesh.loadFinish);
        }
        this.weights = data.weights;
        // this.extensions = data.extensions;
        // this.extras = data.extras;
        this.loadFinish = Promise.all(loadList);
    }

    /** @type {Node[]} */
    get children() {
        if (this._children) {
            this._children = this.childrenIndex.map((value) => gltf.nodes[value]);
        }
        return this._children;
    }
    set children(value) {
        this._children = value;
    }

    /** @type {vec3} */
    get translation() {
        return this._translation;
    }
    set translation(value) {
        this._translation = value;
        this._matrix = undefined;
    }

    /** @type {quat} */
    get rotation() {
        return this._rotation;
    }
    set rotation(value) {
        this._rotation = value;
        this._matrix = undefined;
    }

    /** @type {vec3} */
    get scale() {
        return this._scale;
    }
    set scale(value) {
        this._scale = value;
        this._matrix = undefined;
    }

    /** @type {mat4} */
    get matrix() {
        if (!this._matrix) {
            this._matrix = mat4.fromRotationTranslationScale(mat4.create(), this.rotation, this.translation, this.scale);
        }
        return this._matrix;
    }
    set matrix(value) {
        this._matrix = value;
    }

    /** @type {mat4} */
    get worldMatrix() {
        let worldMatrix = this.matrix;
        let currentNode = this;
        let noParent = false;
        while (!noParent) {
            noParent = true;
            for (const node of this.gltf.nodes) {
                if (node.children && !node.children.every((value) => value !== node)) {
                    mat4.multiply(worldMatrix, node.matrix, worldMatrix);
                    currentNode = node;
                    noParent = false;
                    break;
                }
            }
        }
        return worldMatrix;
    }
}
