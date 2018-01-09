import GLTF from "./index";

export default class Buffer {
    /**
     * 
     * @param {GLTF} gltf 
     * @param {any} data 
     */
    constructor(gltf, data) {
        // this.gltf = gltf;
        this.byteLength = data.byteLength;
        this.uri = data.uri;
        // this.name = data.name;
        // this.extensions = data.extensions;
        // this.extras = data.extras;
        this.loadFinish = fetch(gltf.baseUri + this.uri, {mode: "Anonymous"})
            .then((response) => response.arrayBuffer())
            .then((data) => this.data = data);
    }
}
