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
		this.normalize();
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

	get frontColorBuffer() {
		if (!this.frontColors || this.frontColors.length === 0) {
			return null;
		}
		if (!this.fcBuffer) {
			this.fcBuffer = this.gl.createBuffer();
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.fcBuffer);
			this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.frontColors), this.gl.STATIC_DRAW);
		}
		return this.fcBuffer;
	}

	get backColorBuffer() {
		if (this.bcBuffer === undefined) {
			if (!this.backColors || this.backColors.length === 0) {
				this.bcBuffer = null;
			}
			else {
				this.bcBuffer = this.gl.createBuffer();
				this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.bcBuffer);
				this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.backColors), this.gl.STATIC_DRAW);
			}
		}
		return this.bcBuffer;
	}

	get UVBuffer() {
		if (this.uvBuffer === undefined) {
			if (!this.UVs || this.UVs.length === 0) {
				this.uvBuffer = null;
			}
			else {
				this.uvBuffer = this.gl.createBuffer();
				this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.uvBuffer);
				this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.UVs), this.gl.STATIC_DRAW);
			}
		}
		return this.uvBuffer;
	}

	/**
	 * 
	 * @param {string} textData 
	 */
	readTriData(textData) {
		this.vertexs = [];
		this.normals = [];
		this.frontColors = [];
		this.backColors = [];
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
				this.frontColors[index * 9 + 0] = this.frontColors[index * 9 + 3] = this.frontColors[index * 9 + 6] = data[0] / 255;
				this.frontColors[index * 9 + 1] = this.frontColors[index * 9 + 4] = this.frontColors[index * 9 + 7] = data[1] / 255;
				this.frontColors[index * 9 + 2] = this.frontColors[index * 9 + 5] = this.frontColors[index * 9 + 8] = data[2] / 255;
				this.backColors[index * 9 + 0] = this.backColors[index * 9 + 3] = this.backColors[index * 9 + 6] = data[3] / 255;
				this.backColors[index * 9 + 1] = this.backColors[index * 9 + 4] = this.backColors[index * 9 + 7] = data[4] / 255;
				this.backColors[index * 9 + 2] = this.backColors[index * 9 + 5] = this.backColors[index * 9 + 8] = data[5] / 255;
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
		this.UVs = [];
		let verts = textData.match(/^v [^(f-z|\n)]*/gm);
		let norms = textData.match(/^vn [^(f-z|\n)]*/gm);
		let uvs = textData.match(/^vt [^(f-z|\n)]*/gm);
		let faces = textData.match(/^f [^(f-z|\n)]*/gm);
		for (const face of faces) {
			let data = face.match(/\d+/g).map((value) => Number.parseInt(value) - 1);
			if (data.length === 9) {
				this.vertexs.push(...verts[data[0]].match(/-?\d+(\.\d+(e-\d+)?)?/g).map((value) => Number.parseFloat(value)));
				this.vertexs.push(...verts[data[3]].match(/-?\d+(\.\d+(e-\d+)?)?/g).map((value) => Number.parseFloat(value)));
				this.vertexs.push(...verts[data[6]].match(/-?\d+(\.\d+(e-\d+)?)?/g).map((value) => Number.parseFloat(value)));
				this.normals.push(...norms[data[2]].match(/-?\d+(\.\d+(e-\d+)?)?/g).map((value) => Number.parseFloat(value)));
				this.normals.push(...norms[data[5]].match(/-?\d+(\.\d+(e-\d+)?)?/g).map((value) => Number.parseFloat(value)));
				this.normals.push(...norms[data[8]].match(/-?\d+(\.\d+(e-\d+)?)?/g).map((value) => Number.parseFloat(value)));
				this.UVs.push(...uvs[data[1]].match(/-?\d+(\.\d+(e-\d+)?)?/g).map((value) => Number.parseFloat(value)));
				this.UVs.push(...uvs[data[4]].match(/-?\d+(\.\d+(e-\d+)?)?/g).map((value) => Number.parseFloat(value)));
				this.UVs.push(...uvs[data[7]].match(/-?\d+(\.\d+(e-\d+)?)?/g).map((value) => Number.parseFloat(value)));
			} else if (data.length === 6) {
				this.vertexs.push(...verts[data[0]].match(/-?\d+(\.\d+(e-\d+)?)?/g).map((value) => Number.parseFloat(value)));
				this.vertexs.push(...verts[data[2]].match(/-?\d+(\.\d+(e-\d+)?)?/g).map((value) => Number.parseFloat(value)));
				this.vertexs.push(...verts[data[4]].match(/-?\d+(\.\d+(e-\d+)?)?/g).map((value) => Number.parseFloat(value)));
				this.normals.push(...norms[data[1]].match(/-?\d+(\.\d+(e-\d+)?)?/g).map((value) => Number.parseFloat(value)));
				this.normals.push(...norms[data[3]].match(/-?\d+(\.\d+(e-\d+)?)?/g).map((value) => Number.parseFloat(value)));
				this.normals.push(...norms[data[5]].match(/-?\d+(\.\d+(e-\d+)?)?/g).map((value) => Number.parseFloat(value)));
			} else if (data.length === 12) {
				this.vertexs.push(...verts[data[0]].match(/-?\d+(\.\d+(e-\d+)?)?/g).map((value) => Number.parseFloat(value)));
				this.vertexs.push(...verts[data[3]].match(/-?\d+(\.\d+(e-\d+)?)?/g).map((value) => Number.parseFloat(value)));
				this.vertexs.push(...verts[data[6]].match(/-?\d+(\.\d+(e-\d+)?)?/g).map((value) => Number.parseFloat(value)));
				this.vertexs.push(...verts[data[0]].match(/-?\d+(\.\d+(e-\d+)?)?/g).map((value) => Number.parseFloat(value)));
				this.vertexs.push(...verts[data[6]].match(/-?\d+(\.\d+(e-\d+)?)?/g).map((value) => Number.parseFloat(value)));
				this.vertexs.push(...verts[data[9]].match(/-?\d+(\.\d+(e-\d+)?)?/g).map((value) => Number.parseFloat(value)));
				this.normals.push(...norms[data[2]].match(/-?\d+(\.\d+(e-\d+)?)?/g).map((value) => Number.parseFloat(value)));
				this.normals.push(...norms[data[5]].match(/-?\d+(\.\d+(e-\d+)?)?/g).map((value) => Number.parseFloat(value)));
				this.normals.push(...norms[data[8]].match(/-?\d+(\.\d+(e-\d+)?)?/g).map((value) => Number.parseFloat(value)));
				this.normals.push(...norms[data[2]].match(/-?\d+(\.\d+(e-\d+)?)?/g).map((value) => Number.parseFloat(value)));
				this.normals.push(...norms[data[8]].match(/-?\d+(\.\d+(e-\d+)?)?/g).map((value) => Number.parseFloat(value)));
				this.normals.push(...norms[data[11]].match(/-?\d+(\.\d+(e-\d+)?)?/g).map((value) => Number.parseFloat(value)));
				this.UVs.push(...uvs[data[1]].match(/-?\d+(\.\d+(e-\d+)?)?/g).map((value) => Number.parseFloat(value)));
				this.UVs.push(...uvs[data[4]].match(/-?\d+(\.\d+(e-\d+)?)?/g).map((value) => Number.parseFloat(value)));
				this.UVs.push(...uvs[data[7]].match(/-?\d+(\.\d+(e-\d+)?)?/g).map((value) => Number.parseFloat(value)));
				this.UVs.push(...uvs[data[1]].match(/-?\d+(\.\d+(e-\d+)?)?/g).map((value) => Number.parseFloat(value)));
				this.UVs.push(...uvs[data[7]].match(/-?\d+(\.\d+(e-\d+)?)?/g).map((value) => Number.parseFloat(value)));
				this.UVs.push(...uvs[data[10]].match(/-?\d+(\.\d+(e-\d+)?)?/g).map((value) => Number.parseFloat(value)));
			}
			if (this.vertexs.length !== this.normals.length) {
				console.log(face, data);
				console.log(verts[data[0]]);
				console.log(verts[data[3]]);
				console.log(verts[data[6]]);
				console.log(norms[data[2]]);
				console.log(norms[data[5]]);
				console.log(norms[data[8]]);
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
		this.frontColors = data.vertexFrontcolors;
		this.backColors = data.vertexBackcolors;
		this.UVs = data.vertexTextureCoords;
		if (faces === undefined) {
			this.vertexs = verts;
			this.normals = norms;
		} else {
			for (const face of faces) {
				this.vertexs.push(verts[face * 3], verts[face * 3 + 1], verts[face * 3 + 2]);
				this.normals.push(norms[face * 3], norms[face * 3 + 1], norms[face * 3 + 2]);
			}
		}
	}

	normalize() {
		let maxVert = [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY];
		let minVert = [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY];
		for (let i = 0; i < this.vertexs.length; i += 3) {
			maxVert[0] = Math.max(this.vertexs[i + 0], maxVert[0]);
			maxVert[1] = Math.max(this.vertexs[i + 1], maxVert[1]);
			maxVert[2] = Math.max(this.vertexs[i + 2], maxVert[2]);
			minVert[0] = Math.min(this.vertexs[i + 0], minVert[0]);
			minVert[1] = Math.min(this.vertexs[i + 1], minVert[1]);
			minVert[2] = Math.min(this.vertexs[i + 2], minVert[2]);
		}
		let center = [(maxVert[0] + minVert[0]) / 2, (maxVert[1] + minVert[1]) / 2, (maxVert[2] + minVert[2]) / 2];
		let len = [maxVert[0] - minVert[0], maxVert[1] - minVert[1], maxVert[2] - minVert[2]];
		let s = 10 / Math.max(...len);
		for (let i = 0; i < this.vertexs.length; i += 3) {
			this.vertexs[i + 0] = (this.vertexs[i + 0] - center[0]) * s;
			this.vertexs[i + 1] = (this.vertexs[i + 1] - center[1]) * s;
			this.vertexs[i + 2] = (this.vertexs[i + 2] - center[2]) * s;
		}
	}
}

Model.TYPE = { UNKNOW: Symbol(), TRI: Symbol(), OBJ: Symbol() };
Model.DRAW_TYPE = { UNKNOW: Symbol(), ARRAY: Symbol(), ELEMENT: Symbol() };

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
