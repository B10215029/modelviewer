import GLTF from "./index";
import { TextureInfo } from "./texture"

export default class Material {
    static default(gltf) {
        return new Material(gltf, {});
    }
    /**
     * 
     * @param {GLTF} gltf 
     * @param {*} data 
     */
    constructor(gltf, data) {
        const loadList = [];
        // this.gltf = gltf;
        if (data.pbrMetallicRoughness) {
            this.pbrMetallicRoughness = new PbrMetallicRoughness(gltf, data.pbrMetallicRoughness);
            loadList.push(this.pbrMetallicRoughness.loadFinish);
        }
        if (data.normalTexture) {
            this.normalTexture = new NormalTextureInfo(gltf, data.normalTexture);
            loadList.push(this.normalTexture.loadFinish);
        }
        if (data.occlusionTexture) {
            this.occlusionTexture = new OcclusionTextureInfo(gltf, data.occlusionTexture);
            loadList.push(this.occlusionTexture.loadFinish);
        }
        if (data.emissiveTexture) {
            this.emissiveTexture = new TextureInfo(gltf, data.emissiveTexture);
            loadList.push(this.emissiveTexture.loadFinish);
        }
        this.emissiveFactor = data.emissiveFactor || [0, 0, 0];
        this.alphaMode = data.alphaMode || AlphaMode.OPAQUE;
        this.alphaCutoff = data.alphaCutoff !== undefined ? data.alphaCutoff : 0.5;
        this.doubleSided = data.doubleSided || false;

        this.name = data.name;
        // this.extensions = data.extensions;
        // this.extras = data.extras;
        this.loadFinish = Promise.all(loadList);
    }
}

export class NormalTextureInfo extends TextureInfo {
    /**
     * 
     * @param {GLTF} gltf 
     * @param {*} data 
     */
    constructor(gltf, data) {
        super(gltf, data);
        this.scale = data.scale === undefined ? 1 : data.scale;
    }
}

export class OcclusionTextureInfo extends TextureInfo {
    /**
     * 
     * @param {GLTF} gltf 
     * @param {*} data 
     */
    constructor(gltf, data) {
        super(gltf, data);
        this.strength = data.strength === undefined ? 1 : data.strength;
    }
}

export class PbrMetallicRoughness {
    /**
     * 
     * @param {GLTF} gltf 
     * @param {*} data 
     */
    constructor(gltf, data) {
        const loadList = [];
        // this.gltf = gltf;
        this.baseColorFactor = data.baseColorFactor || [1, 1, 1, 1];
        if (data.baseColorTexture) {
            this.baseColorTexture = new TextureInfo(gltf, data.baseColorTexture);
            loadList.push(this.baseColorTexture.loadFinish);
        }
        this.metallicFactor = data.metallicFactor !== undefined ? data.metallicFactor : 1;
        this.roughnessFactor = data.roughnessFactor !== undefined ? data.roughnessFactor : 1;
        if (data.metallicRoughnessTexture) {
            this.metallicRoughnessTexture = new TextureInfo(gltf, data.metallicRoughnessTexture);
            loadList.push(this.metallicRoughnessTexture.loadFinish);
        }
        // this.extensions = data.extensions;
        // this.extras = data.extras;
        this.loadFinish = Promise.all(loadList);
    }
}

export const AlphaMode = {
    OPAQUE: "OPAQUE",
    MASK: "MASK",
    BLEND: "BLEND",
}
