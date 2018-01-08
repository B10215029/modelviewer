import GLTF from "./index";

export default class BufferView {
    /**
     * 
     * @param {GLTF} gltf 
     * @param {*} data 
     */
    constructor(gltf, data) {
        /** @type {GLTF} */
        this.gltf = gltf;
        this.buffer = this.gltf.buffers[data.buffer];
        this.byteLength = data.byteLength;
        this.byteOffset = data.byteOffset || 0;
        this.byteStride = data.byteStride || 0;
        this.target = data.target;
        // this.name = data.name;
        // this.extensions = data.extensions;
        // this.extras = data.extras;
        this.loadFinish = this.buffer.loadFinish.then(data => {
            this.data = data.slice(this.byteOffset, this.byteOffset + this.byteLength);
        });
    }
}

export var BufferViewTarget = {
    ARRAY_BUFFER: 34962,
    ELEMENT_ARRAY_BUFFER: 34963,
}
