import GLTF from "./index";
import Material from "./material";

export default class Mesh {
    constructor(gltf, data) {
        // this.gltf = gltf;
        /**
         * An array of primitives, each defining geometry to be rendered with a material.
         * @type {Primitive[]}
         */
        this.primitives = data.primitives.map((value) => new Primitive(gltf, value));
        /**
         * Array of weights to be applied to the Morph Targets.
         * @type {number[]}
         */
        this.weights = data.weights;
        /**
         * The user-defined name of this object.
         * @type {string}
         */
        this.name = data.name;
        // this.extensions = data.extensions;
        // this.extras = data.extras;
        this.loadFinish = Promise.all(this.primitives.map(value => value.loadFinish));
    }
}

export class Primitive {
    /**
     * 
     * @param {GLTF} gltf 
     * @param {*} data 
     */
    constructor(gltf, data) {
        // this.gltf = gltf;
        /**
         * A dictionary object, where each key corresponds to mesh attribute semantic and each value is the index of the accessor containing attribute's data.
         * @type {Attribute}
         */
        this.attributes = new Attribute(gltf, data.attributes);
        const loadList = [this.attributes.loadFinish];
        if (data.indices !== undefined) {
            this.indices = gltf.accessors[data.indices];
            loadList.push(this.indices.loadFinish);
        }
        this.material = data.material !== undefined ? gltf.materials[data.material] : Material.default(gltf);
        loadList.push(this.material.loadFinish);
        this.mode = data.mode ? data.mode : PrimitiveMode.TRIANGLES;
        this.vertexArrays = {};
        /** @type {{POSITION:number;NORMAL:number;TANGENT:number;}} */
        // this.targets = data.targets;
        // this.extensions = data.extensions;
        // this.extras = data.extras;
        this.loadFinish = Promise.all([this.attributes, this.indices, this.material].map(value => value ? value.loadFinish : Promise.resolve()));
    }

    /**
     * 
     * @param {WebGL2RenderingContext} gl 
     * @param {*} programKey
     * @param {(attributes:Attribute)=>void} setAttribute 
     */
    GetVertexArray(gl, programKey, setAttribute) {
        if (this.vertexArrays[programKey] === undefined) {
            this.vertexArrays[programKey] = gl.createVertexArray();
            gl.bindVertexArray(this.vertexArrays[programKey]);
            setAttribute(this.attributes);
            gl.bindVertexArray(null);
        }
        return this.vertexArrays[programKey];
    }
}

export class Attribute {
    /**
     * 
     * @param {GLTF} gltf 
     * @param {*} data 
     */
    constructor(gltf, data) {
        const loadList = [];
        // this.gltf = gltf;
        if (data.POSITION !== undefined) {
            this.POSITION = gltf.accessors[data.POSITION];
            loadList.push(this.POSITION.loadFinish);
        }
        if (data.NORMAL !== undefined) {
            this.NORMAL = gltf.accessors[data.NORMAL];
            loadList.push(this.NORMAL.loadFinish);
        }
        if (data.TANGENT !== undefined) {
            this.TANGENT = gltf.accessors[data.TANGENT];
            loadList.push(this.TANGENT.loadFinish);
        }
        if (data.TEXCOORD_0 !== undefined) {
            this.TEXCOORD_0 = gltf.accessors[data.TEXCOORD_0];
            loadList.push(this.TEXCOORD_0.loadFinish);
        }
        if (data.TEXCOORD_1 !== undefined) {
            this.TEXCOORD_1 = gltf.accessors[data.TEXCOORD_1];
            loadList.push(this.TEXCOORD_1.loadFinish);
        }
        if (data.COLOR_0 !== undefined) {
            this.COLOR_0 = gltf.accessors[data.COLOR_0];
            loadList.push(this.COLOR_0.loadFinish);
        }
        if (data.JOINTS_0 !== undefined) {
            this.JOINTS_0 = gltf.accessors[data.JOINTS_0];
            loadList.push(this.JOINTS_0.loadFinish);
        }
        if (data.WEIGHTS_0 !== undefined) {
            this.WEIGHTS_0 = gltf.accessors[data.WEIGHTS_0];
            loadList.push(this.WEIGHTS_0.loadFinish);
        }
        this.loadFinish = Promise.all(loadList);
    }
}

export var PrimitiveMode = {
    POINTS: 0,
    LINES: 1,
    LINE_LOOP: 2,
    LINE_STRIP: 3,
    TRIANGLES: 4,
    TRIANGLE_STRIP: 5,
    TRIANGLE_FAN: 6,
}
