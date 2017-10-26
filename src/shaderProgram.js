import Model from "./model";
import {vec3, vec4, mat4} from "gl-matrix";
import { Light } from "./light"

export class Phong {
	/**
	 * 
	 * @param {WebGLRenderingContext} gl 
	 * @param {WebGLProgram} program 
	 */
	constructor(gl, program) {
		this.gl = gl;
		this.program = program;
		this.vertexPositionLocation = gl.getAttribLocation(program, "vertexPosition");
		this.vertexNormalLocation = gl.getAttribLocation(program, "vertexNormal");
		this.modelViewMatrixLocation = gl.getUniformLocation(program, "modelViewMatrix");
		this.projectionMatrixLocation = gl.getUniformLocation(program, "projectionMatrix");
		this.ambientColorLocation = gl.getUniformLocation(program, "ambientColor");
		this.diffuseColorLocation = gl.getUniformLocation(program, "diffuseColor");
		this.lightColorLocation = gl.getUniformLocation(program, "lightColor");
		this.lightDirectionLocation = gl.getUniformLocation(program, "lightDirection");
		this.shininessLocation = gl.getUniformLocation(program, "shininess");
	}

	/**
	 * 
	 * @param {Model} model 
	 * @param {mat4} viewMatrix 
	 * @param {mat4} projectionMatrix 
	 * @param {vec4} ambientColor 
	 * @param {Light[]} lights
	 */
	renderModel(model, viewMatrix, projectionMatrix, ambientColor, lights) {
		this.gl.useProgram(this.program);
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, model.vertexBuffer);
		this.gl.enableVertexAttribArray(this.vertexPositionLocation);
		this.gl.vertexAttribPointer(this.vertexPositionLocation, 3, this.gl.FLOAT, false, 0, 0)
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, model.normalBuffer);
		this.gl.enableVertexAttribArray(this.vertexNormalLocation);
		this.gl.vertexAttribPointer(this.vertexNormalLocation, 3, this.gl.FLOAT, false, 0, 0)
		
		this.gl.uniformMatrix4fv(this.modelViewMatrixLocation, false, mat4.multiply(mat4.create(), viewMatrix, model.modelMatrix));
		this.gl.uniformMatrix4fv(this.projectionMatrixLocation, false, projectionMatrix);
		this.gl.uniform4fv(this.ambientColorLocation, ambientColor);
		this.gl.uniform4fv(this.diffuseColorLocation, model.color);
		this.gl.uniform4fv(this.lightColorLocation, [...lights[0].color, 1]);
		this.gl.uniform3fv(this.lightDirectionLocation, lights[0].position);
		this.gl.uniform1f(this.shininessLocation, model.shininess);

		this.gl.drawArrays(this.gl.TRIANGLES, 0, model.vertexs.length / 3);
	}
}

/**
 * 
 * @param {WebGLRenderingContext} gl 
 * @param {string} vertexShaderCode 
 * @param {string} fragmentShaderCode 
 * @return {WebGLProgram}
 */
export function createProgram(gl, vertexShaderCode, fragmentShaderCode) {
	let vertexShader;
	let fragmentShader;

	vertexShader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vertexShader, vertexShaderCode);
	gl.compileShader(vertexShader);

	if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
		let msg = "Vertex shader failed to compile.  The error log is:"
			+ "<pre>" + gl.getShaderInfoLog(vertexShader) + "</pre>";
		alert(msg);
		return -1;
	}

	fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fragmentShader, fragmentShaderCode);
	gl.compileShader(fragmentShader);

	if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
		let msg = "Fragment shader failed to compile.  The error log is:"
			+ "<pre>" + gl.getShaderInfoLog(fragmentShader) + "</pre>";
		alert(msg);
		return -1;
	}

	let program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);

	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		let msg = "Shader program failed to link.  The error log is:"
			+ "<pre>" + gl.getProgramInfoLog(program) + "</pre>";
		alert(msg);
		return -1;
	}

	return program;
}

/**
 * download and create program from URL
 * @param {WebGLRenderingContext} gl 
 * @param {string} vertexShaderURL 
 * @param {string} fragmentShaderURL 
 * @return {Promise<WebGLProgram>}
 */
export function downloadProgram(gl, vertexShaderURL, fragmentShaderURL) {
	return Promise.all([fetch(vertexShaderURL), fetch(fragmentShaderURL)])
		.then(response => Promise.all([response[0].text(), response[1].text()]))
		.then(texts => createProgram(gl, ...texts));
}
