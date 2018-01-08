import GLTF from "./index";

export default class Skin {
    /**
     * 
     * @param {GLTF} gltf 
     * @param {*} data 
     */
    constructor(gltf, data) {
        this.gltf = gltf;
        if (data.inverseBindMatrices) {
            this.inverseBindMatrices = gltf.accessors[data.inverseBindMatrices];
        }
        this.skeletonIndex = data.skeleton;
        this.joints = data.joints;
        this.name = data.name;
        // this.extensions = data.extensions;
        // this.extras = data.extras;
        this.loadFinish = this.inverseBindMatrices.loadFinish;
    }

    get skeleton() {
        if (!this._skeleton) {
            this._skeleton = this.skeletonIndex ? gltf.nodes[this.skeletonIndex] : gltf.scene.nodes[0];
        }
        return this._skeleton;
    }
    set skeleton(value) {
        this._skeleton = value;
    }
}
