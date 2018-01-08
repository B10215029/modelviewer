import GLTF from "./index";

export default class Accessor {
    /**
     * 
     * @param {GLTF} gltf 
     * @param {*} data 
     */
    constructor(gltf, data) {
        this.gltf = gltf;
        this.bufferView = this.gltf.bufferViews[data.bufferView];
        this.byteOffset = data.byteOffset || 0;
        this.componentType = data.componentType;
        this.normalized = data.normalized || false;
        this.count = data.count;
        this.type = data.type;
        this.max = data.max;
        this.min = data.min;
        this.sparse = data.sparse;
        // this.name = data.name;
        // this.extensions = data.extensions;
        // this.extras = data.extras;
        this.loadFinish = this.bufferView.loadFinish;
    }
}

Accessor.ComponentType = {
    BYTE            : 5120,
    UNSIGNED_BYTE   : 5121,
    SHOR            : 5122,
    UNSIGNED_SHORT  : 5123,
    UNSIGNED_INT    : 5125,
    FLOAT           : 5126,
}

Accessor.AttributeType = {
    SCALAR : "SCALAR",
    VEC2 : "VEC2",
    VEC3 : "VEC3",
    VEC4 : "VEC4",
    MAT2 : "MAT2",
    MAT3 : "MAT3",
    MAT4 : "MAT4",
}
