export class ShaderProgram {
	/**
	 * @param {WebGL2RenderingContext} gl 
	 * @param {WebGLProgram} program 
	 */
	constructor(gl, program) {
		this.gl = gl;
		this.program = program;
	}
}

/**
 * create program from shader code
 * @param {WebGL2RenderingContext} gl 
 * @param {string} vertexShaderCode 
 * @param {string} fragmentShaderCode 
 * @return {WebGLProgram}
 */
export function createProgram(gl, vertexShaderCode, fragmentShaderCode) {
	/** @type {WebGLShader} */
	let vertexShader;
	/** @type {WebGLShader} */
	let fragmentShader;
	/** @type {WebGLProgram} */
	let program;
	/** @type {string} */
	let log;

	vertexShader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vertexShader, vertexShaderCode);
	gl.compileShader(vertexShader);

	log = gl.getShaderInfoLog(vertexShader);
	if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
		console.warn("Vertex shader failed to compile.\n" + log);
		return;
	} else if (log) {
		console.log(log);
	}

	fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fragmentShader, fragmentShaderCode);
	gl.compileShader(fragmentShader);

	log = gl.getShaderInfoLog(fragmentShader);
	if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
		console.warn( "Fragment shader failed to compile.\n" + log);
		return;
	} else if (log) {
		console.log(log);
	}

	program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);

	log = gl.getProgramInfoLog(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		console.warn("Shader program failed to link.\n" + log);
		return;
	} else if (log) {
		console.log(log);
	}

	return program;
}

/**
 * download and create program from URL
 * @param {WebGL2RenderingContext} gl 
 * @param {string} vertexShaderURL 
 * @param {string} fragmentShaderURL 
 * @return {Promise<WebGLProgram>}
 */
export function downloadProgram(gl, vertexShaderURL, fragmentShaderURL) {
	return Promise.all([fetch(vertexShaderURL), fetch(fragmentShaderURL)])
		.then(response => Promise.all([response[0].text(), response[1].text()]))
		.then(texts => createProgram(gl, ...texts));
}
