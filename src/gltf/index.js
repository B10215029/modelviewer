import Node from "./node";
import Scene from "./scene";
import Buffer from "./buffer";
import BufferView from "./bufferView";
import Accessor from "./accessor";
import Mesh from "./mesh";
import Material from "./material";
import Skin from "./skin";
import Animation from "./animation";
import Camera from "./camera";
import { default as Texture, RawImage, Sampler } from "./texture";

export default class GLTF {
    constructor(data, baseUri) {
        console.log(data);
        const loadList = [];
        this.baseUri = baseUri;
        this.asset = data.asset;
        if (data.buffers) {
            /** @type {Buffer[]} */
            this.buffers = data.buffers.map((value) => new Buffer(this, value));
            // this.buffers.forEach((value) => loadList.push(value.loadFinish));
        }
        if (data.bufferViews) {
            /** @type {BufferView[]} */
            this.bufferViews = data.bufferViews.map((value) => new BufferView(this, value));
        }
        if (data.accessors) {
            /** @type {Accessor[]} */
            this.accessors = data.accessors.map((value) => new Accessor(this, value));
        }
        if (data.images) {
            /** @type {RawImage[]} */
            this.images = data.images.map((value) => new RawImage(this, value));
            // this.images.forEach((value) => loadList.push(value.loadFinish));
        }
        if (data.samplers) {
            /** @type {Sampler[]} */
            this.samplers = data.samplers.map((value) => new Sampler(this, value));
        }
        if (data.textures) {
            /** @type {Texture[]} */
            this.textures = data.textures.map((value) => new Texture(this, value));
        }
        if (data.materials) {
            /** @type {Material[]} */
            this.materials = data.materials.map((value) => new Material(this, value));
        }
        if (data.meshes) {
            /** @type {Mesh[]} */
            this.meshes = data.meshes.map((value) => new Mesh(this, value));
        }
        if (data.skins) {
            /** @type {Skin[]} */
            this.skins = data.skins.map((value) => new Skin(this, value));
        }
        if (data.cameras) {
            /** @type {Camera[]} */
            this.cameras = data.cameras.map((value) => new Camera(this, value));
        }
        if (data.nodes) {
            /** @type {Node[]} */
            this.nodes = data.nodes.map((value) => new Node(this, value));
            this.nodes.forEach((value) => loadList.push(value.loadFinish));
        }
        if (data.animations) {
            /** @type {Skin[]} */
            this.animations = data.animations.map((value) => new Animation(this, value));
            this.animations.forEach((value) => loadList.push(value.loadFinish));
        }
        if (data.scenes) {
            /** @type {Scene[]} */
            this.scenes = data.scenes.map((value) => new Scene(this, value));
        }
        if (this.scene) {
            /** @type {Scene} */
            this.scene = this.scenes[data.scene];
            loadList.push(this.scene.loadFinish);
        }
        // this.extensions = data.extensions;
        // this.extensionsUsed = data.extensionsUsed;
        // this.extensionsRequired = data.extensionsRequired;
        // this.extras = data.extras;
        this.loadFinish = Promise.all(loadList).then(() => this);
    }
}

export function downloadGLTF(url) {
    return fetch(url)
        .then(response => response.json())
        .then(data => (new GLTF(data, url.match(/[\w\W]*\//)[0]).loadFinish));
}
