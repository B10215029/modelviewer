import GLTF from "./index";

export default class Texture {
    /**
     * 
     * @param {GLTF} gltf 
     * @param {any} data 
     */
    constructor(gltf, data) {
        this.gltf = gltf;
        this.sampler = data.sampler;
        this.source = this.gltf.images[data.source];
        // this.name = data.name;
        // this.extensions = data.extensions;
        // this.extras = data.extras;
        this.loadFinish = this.source.loadFinish;
    }
}

export class RawImage {
    /**
     * 
     * @param {GLTF} gltf 
     * @param {any} data 
     */
    constructor(gltf, data) {
        this.gltf = gltf;
        this.uri = data.uri;
        this.bufferView = data.bufferView ? this.gltf.bufferViews[data.bufferView] : undefined;
        this.mimeType = data.mimeType;
        // this.name = data.name;
        // this.extensions = data.extensions;
        // this.extras = data.extras;
        if (this.uri) {
            this.data = new Image();
            this.data.src = this.gltf.baseUri + this.uri;
            this.loadFinish = new Promise((resolve) => this.data.onload = resolve);
        } else {
            this.loadFinish = this.bufferView.loadFinish
            .then((blob) => {
                this.data = new Image();
                this.data.src = URL.createObjectURL(blob);
                return new Promise((resolve) => this.data.onload = resolve);
            });
        }
    }
}

export class Sampler {
    /**
     * 
     * @param {GLTF} gltf 
     * @param {any} data 
     */
    constructor(gltf, data) {
        this.gltf = gltf;
        this.magFilter = data.magFilter;
        this.minFilter = data.minFilter;
        this.wrapS = data.wrapS || Sampler.WrapMode.REPEAT;
        this.wrapT = data.wrapT || Sampler.WrapMode.REPEAT;
        // this.name = data.name;
        // this.extensions = data.extensions;
        // this.extras = data.extras;
        // this.loadFinish = this.loadFinish;
    }
}

Sampler.FilterMode = {
    NEAREST: 9728,
    LINEAR: 9729,
    NEAREST_MIPMAP_NEAREST: 9984,
    LINEAR_MIPMAP_NEAREST: 9985,
    NEAREST_MIPMAP_LINEAR: 9986,
    LINEAR_MIPMAP_LINEAR: 9987,
}

Sampler.WrapMode = {
    CLAMP_TO_EDGE: 33071,
    MIRRORED_REPEAT: 33648,
    REPEAT: 10497,
}

export class TextureInfo {
    /**
     * 
     * @param {GLTF} gltf 
     * @param {any} data 
     */
    constructor(gltf, data) {
        this.gltf = gltf;
        this.index = this.gltf.textures[data.index];
        this.texCoord = data.texCoord || 0;
        // this.extensions = data.extensions;
        // this.extras = data.extras;
        this.loadFinish = this.index.loadFinish;
    }
}
