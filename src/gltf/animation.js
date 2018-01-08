import GLTF from "./index";

export default class Animation {
    /**
     * 
     * @param {GLTF} gltf 
     * @param {*} data 
     */
    constructor(gltf, data) {
        this.gltf = gltf;
        /** @type {AnimationSampler} */
        this.samplers = data.samplers.map((value) => new AnimationSampler(gltf, value));
        /** @type {Channel} */
        this.channels = data.channels.map((value) => new Channel(gltf, value, this.samplers));
        this.name = data.name;
        // this.extensions = data.extensions;
        // this.extras = data.extras;
        this.loadFinish = Promise.all(this.channels.map((value) => value.loadFinish));
    }
}

export class AnimationSampler {
    /**
     * 
     * @param {GLTF} gltf 
     * @param {*} data 
     */
    constructor(gltf, data) {
        this.gltf = gltf;
        this.input = gltf.accessors[data.input];
        this.interpolation = data.interpolation || AnimationSampler.Interpolation.LINEAR;
        this.output = gltf.accessors[data.output];
        // this.extensions = data.extensions;
        // this.extras = data.extras;
        this.loadFinish = Promise.all([this.input.loadFinish, this.output.loadFinish]);
    }
}
AnimationSampler.Interpolation = {
    LINEAR: "LINEAR",
    STEP: "STEP",
    CUBICSPLINE: "CUBICSPLINE",
}

export class Channel {
    /**
     * 
     * @param {GLTF} gltf 
     * @param {*} data 
     */
    constructor(gltf, data, samplers) {
        this.gltf = gltf;
        this.sampler = samplers[data.sampler];
        this.target = {
            node: gltf.nodes[data.target.node],
            path: data.target.path,
        };
        // this.extensions = data.extensions;
        // this.extras = data.extras;
        this.loadFinish = Promise.all([this.sampler.loadFinish, this.target.loadFinish]);
    }
}
