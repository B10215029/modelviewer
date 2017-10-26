import * as glm from "gl-matrix";
import { vec4, mat4, quat } from "gl-matrix";

class Model {
	/**
	 * 
	 * @param {string} modelData 
	 * @param {WebGLRenderingContext} gl 
	 * @param {*} type 
	 */
	constructor(modelData, gl, type = Model.TYPE.UNKNOW) {
		/** @type {WebGLRenderingContext} */
		this.gl = gl;
		this.type = type;
		this.position = glm.vec3.fromValues(0, 0, 0);
		this.rotation = glm.vec3.fromValues(0, 0, 0);
		this.scale = glm.vec3.fromValues(1, 1, 1);
		this.shear = glm.vec3.fromValues(0, 0, 0);
		if (modelData.charAt(0) === "T")
			this.readTriData(modelData);
		else if (modelData.charAt(0) === "{")
			this.readJSONData(modelData);
		else
			this.readObjData(modelData);
		this.color = vec4.fromValues(0.5, 0.5, 0.4, 1);
		this.shininess = 20;
	}

	/**
	 * @return {glm.mat4}
	 */
	get modelMatrix() {
		let modelMat = mat4.create();
		// mat4.translate(modelMat, modelMat, this.position);
		// mat4.rotateX(modelMat, modelMat, this.rotation[0]);
		// mat4.rotateY(modelMat, modelMat, this.rotation[1]);
		// mat4.rotateZ(modelMat, modelMat, this.rotation[2]);
		// modelMat[8] += this.shear[0];
		// modelMat[9] += this.shear[1];
		// mat4.scale(modelMat, modelMat, this.scale);
		mat4.fromRotationTranslationScale(modelMat, quat.fromEuler(quat.create(), ...this.rotation), this.position, this.scale);
		modelMat[8] += this.shear[0] * this.scale[0];
		modelMat[9] += this.shear[1] * this.scale[1];
		return modelMat;
	}

	get vertexBuffer() {
		if (!this.vBuffer) {
			this.vBuffer = this.gl.createBuffer();
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vBuffer);
			this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.vertexs), this.gl.STATIC_DRAW);
		}
		return this.vBuffer;
	}

	get normalBuffer() {
		if (!this.nBuffer) {
			this.nBuffer = this.gl.createBuffer();
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.nBuffer);
			this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.normals), this.gl.STATIC_DRAW);
		}
		return this.nBuffer;
	}

	/**
	 * 
	 * @param {string} textData 
	 */
	readTriData(textData) {
		this.vertexs = [];
		this.normals = [];
		this.frontColors = [];
		this.baskColors = [];
		var triangles = textData.match(/^T[^T]*/gm);
		triangles.forEach((value, index) => {
			var data = value.match(/-?\d+(\.\d+)?/gm).map((value) => Number.parseFloat(value));
			var vpos = data.length - 18;
			for (let i = 0; i < 3; i++) {
				for (let j = 0; j < 3; j++) {
					this.vertexs[index * 9 + i * 3 + j] = data[vpos + i * 2 * 3 + j];
					this.normals[index * 9 + i * 3 + j] = data[vpos + (i * 2 + 1) * 3 + j];
				}
			}
			if (vpos !== 0) {
				this.frontColors[index * 9 + 0] = this.frontColors[index * 9 + 3] = this.frontColors[index * 9 + 6] = data[0];
				this.frontColors[index * 9 + 1] = this.frontColors[index * 9 + 4] = this.frontColors[index * 9 + 7] = data[1];
				this.frontColors[index * 9 + 2] = this.frontColors[index * 9 + 5] = this.frontColors[index * 9 + 8] = data[2];
				this.baskColors[index * 9 + 0] = this.baskColors[index * 9 + 3] = this.baskColors[index * 9 + 6] = data[3];
				this.baskColors[index * 9 + 1] = this.baskColors[index * 9 + 4] = this.baskColors[index * 9 + 7] = data[4];
				this.baskColors[index * 9 + 2] = this.baskColors[index * 9 + 5] = this.baskColors[index * 9 + 8] = data[5];
			}
		});
	}

	/**
	 * 
	 * @param {string} textData 
	 */
	readObjData(textData) {
		this.vertexs = [];
		this.normals = [];
		let verts = textData.match(/^v [^(v|n|t|f)]*/gm);
		let norms = textData.match(/^vn [^(v|n|t|f)]*/gm);
		let faces = textData.match(/^f [^(v|n|t|f)]*/gm);
		for (const face of faces) {
			let data = face.match(/\d+/g).map((value) => Number.parseInt(value));
			if (data.length === 9) {
				this.vertexs.push(...verts[data[0] - 1].match(/-?\d+(\.\d+(e-\d+)?)?/g).map((value) => Number.parseFloat(value)));
				this.vertexs.push(...verts[data[3] - 1].match(/-?\d+(\.\d+(e-\d+)?)?/g).map((value) => Number.parseFloat(value)));
				this.vertexs.push(...verts[data[6] - 1].match(/-?\d+(\.\d+(e-\d+)?)?/g).map((value) => Number.parseFloat(value)));
				this.normals.push(...norms[data[2] - 1].match(/-?\d+(\.\d+(e-\d+)?)?/g).map((value) => Number.parseFloat(value)));
				this.normals.push(...norms[data[5] - 1].match(/-?\d+(\.\d+(e-\d+)?)?/g).map((value) => Number.parseFloat(value)));
				this.normals.push(...norms[data[8] - 1].match(/-?\d+(\.\d+(e-\d+)?)?/g).map((value) => Number.parseFloat(value)));
			}
		}
	}

	readJSONData(textData) {
		this.vertexs = [];
		this.normals = [];
		let data = JSON.parse(textData);
		let verts = data.vertexPositions;
		let norms = data.vertexNormals;
		let faces = data.indices;
		for (const face of faces) {
			this.vertexs.push(verts[face * 3], verts[face * 3 + 1], verts[face * 3 + 2]);
			this.normals.push(norms[face * 3], norms[face * 3 + 1], norms[face * 3 + 2]);
		}
	}
}

Model.TYPE = { UNKNOW: Symbol(), TRI: Symbol(), OBJ: Symbol() };

export default Model

/**
 * download and create model data from URL
 * @param {string} modelURL 
 * @param {WebGLRenderingContext} gl WebGLRenderingContext for
 */
export function downloadModel(modelURL, gl) {
	return fetch(modelURL)
		.then(response => response.text())
		.then(modelData => new Model(modelData, gl));
}
