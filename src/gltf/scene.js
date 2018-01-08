import GLTF from "./index"
import Node from "./node"

export default class Scene {
    /**
     * 
     * @param {GLTF} gltf 
     * @param {*} data 
     */
    constructor(gltf, data) {
        this.gltf = gltf;
        this.name = data.name;
        if (gltf.nodes) {
            /** @type {Node[]} */
            this.nodes = data.nodes.map((value) => gltf.nodes[value]);
            this.loadFinish = this.nodes.map((value) => value.loadFinish);
        } else {
            this.loadFinish = Promise.resolve();
        }
        // this.extensions = data.extensions;
        // this.extras = data.extras;
        
    }
}
