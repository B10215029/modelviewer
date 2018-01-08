import GLTF from "./index";

export default class Buffer {
    /**
     * 
     * @param {GLTF} gltf 
     * @param {any} data 
     */
    constructor(gltf, data) {
        this.gltf = gltf;
        this.byteLength = data.byteLength;
        this.uri = data.uri;
        // this.name = data.name;
        // this.extensions = data.extensions;
        // this.extras = data.extras;
        this.loadFinish = fetch(this.gltf.baseUri + this.uri)
            .then((response) => response.blob())
            .then((blob) => this.data = blob);
    }
}
