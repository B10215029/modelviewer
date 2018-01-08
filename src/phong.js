import Model from "./model";
import { vec3, vec4, mat4 } from "gl-matrix";
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
		this.vertexUVLocation = gl.getAttribLocation(program, "vertexUV");
		this.vertexFrontColorLocation = gl.getAttribLocation(program, "vertexFrontColor");
		this.vertexBackColorLocation = gl.getAttribLocation(program, "vertexBackColor");
		this.modelViewMatrixLocation = gl.getUniformLocation(program, "modelViewMatrix");
		this.projectionMatrixLocation = gl.getUniformLocation(program, "projectionMatrix");
		this.ambientColorLocation = gl.getUniformLocation(program, "ambientColor");
		this.diffuseColorLocation = gl.getUniformLocation(program, "diffuseColor");
		this.shininessLocation = gl.getUniformLocation(program, "shininess");
		this.cameraPositionLocation = gl.getUniformLocation(program, "cameraPosition");
		this.lightCountLocation = gl.getUniformLocation(program, "lightCount");
		this.lightPositionsLocation = gl.getUniformLocation(program, "lightPositions");
		this.lightColorsLocation = gl.getUniformLocation(program, "lightColors");
		this.mainTextureLocation = gl.getUniformLocation(program, "mainTexture");
		this.useTextureLocation = gl.getUniformLocation(program, "useTexture");

		this.defaultTexture = gl.createTexture();
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.defaultTexture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([ 255, 0, 255, 255 ]));
		gl.bindTexture(gl.TEXTURE_2D, null);
	}

	/**
	 * 
	 * @param {Model} model 
	 * @param {mat4} viewMatrix 
	 * @param {mat4} projectionMatrix 
	 * @param {vec4} ambientColor 
	 * @param {Light[]} lights
	 */
	renderModel(model, viewMatrix, projectionMatrix, cameraPosition, ambientColor, lights) {
		this.gl.useProgram(this.program);
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, model.vertexBuffer);
		this.gl.enableVertexAttribArray(this.vertexPositionLocation);
		this.gl.vertexAttribPointer(this.vertexPositionLocation, 3, this.gl.FLOAT, false, 0, 0)
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, model.normalBuffer);
		this.gl.enableVertexAttribArray(this.vertexNormalLocation);
		this.gl.vertexAttribPointer(this.vertexNormalLocation, 3, this.gl.FLOAT, false, 0, 0)
		this.gl.activeTexture(this.gl.TEXTURE0);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.defaultTexture);
		if (model.frontColorBuffer) {
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, model.frontColorBuffer);
			this.gl.enableVertexAttribArray(this.vertexFrontColorLocation);
			this.gl.vertexAttribPointer(this.vertexFrontColorLocation, 3, this.gl.FLOAT, false, 0, 0)
		}
		else {
			this.gl.disableVertexAttribArray(this.vertexFrontColorLocation);
		}
		if (model.backColorBuffer) {
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, model.backColorBuffer);
			this.gl.enableVertexAttribArray(this.vertexBackColorLocation);
			this.gl.vertexAttribPointer(this.vertexBackColorLocation, 3, this.gl.FLOAT, false, 0, 0);
		} else {
			this.gl.disableVertexAttribArray(this.vertexBackColorLocation);
		}
		if (model.texture && model.UVBuffer) {
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, model.UVBuffer);
			this.gl.enableVertexAttribArray(this.vertexUVLocation);
			this.gl.vertexAttribPointer(this.vertexUVLocation, 2, this.gl.FLOAT, false, 0, 0);
			this.gl.activeTexture(this.gl.TEXTURE0);
			this.gl.bindTexture(this.gl.TEXTURE_2D, model.texture);
			this.gl.uniform1i(this.mainTextureLocation, 0);
			this.gl.uniform1i(this.useTextureLocation, 1);
		}
		else {
			this.gl.disableVertexAttribArray(this.vertexUVLocation);
			this.gl.uniform1i(this.useTextureLocation, 0);
		}

		let mvmat = mat4.multiply(mat4.create(), viewMatrix, model.modelMatrix);
		this.gl.uniformMatrix4fv(this.modelViewMatrixLocation, false, mvmat);
		this.gl.uniformMatrix4fv(this.projectionMatrixLocation, false, projectionMatrix);
		this.gl.uniform4fv(this.ambientColorLocation, ambientColor);
		this.gl.uniform4fv(this.diffuseColorLocation, model.color);
		this.gl.uniform1f(this.shininessLocation, model.shininess);
		this.gl.uniform3fv(this.cameraPositionLocation, cameraPosition);
		this.gl.uniform1i(this.lightCountLocation, lights.length);
		this.gl.uniform3fv(this.lightPositionsLocation, lights.reduce((arr,val)=>arr.concat(...vec3.transformMat4(vec3.create(), val.position, viewMatrix)), []));
		this.gl.uniform4fv(this.lightColorsLocation, lights.reduce((arr,val)=>arr.concat(val.color, 1), []));
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
		let msg = "Vertex shader failed to compile.  The error log is:\n"
			+ gl.getShaderInfoLog(vertexShader);
		alert(msg);
		console.warn(msg);
		return -1;
	}

	fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fragmentShader, fragmentShaderCode);
	gl.compileShader(fragmentShader);

	if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
		let msg = "Fragment shader failed to compile.  The error log is:\n"
			+ gl.getShaderInfoLog(fragmentShader);
		alert(msg);
		console.warn(msg);
		return -1;
	}

	let program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);

	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		let msg = "Shader program failed to link.  The error log is:\n"
			+ gl.getProgramInfoLog(program);
		alert(msg);
		console.warn(msg);
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
