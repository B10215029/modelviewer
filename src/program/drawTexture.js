import { ShaderProgram } from "./shaderProgram";

export class DrawTexture extends ShaderProgram {
	/**
	 * create a Physically Based Rendering Shader Program
	 * @param {WebGL2RenderingContext} gl 
	 * @param {WebGLProgram} program 
	 */
    constructor(gl, program, width, height) {
        super(gl, program);
        this.textureLocation = gl.getUniformLocation(program, "image");
        this.flipYLocation = gl.getUniformLocation(program, "flipY");
    }

    renderTexture(texture, flipY) {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.gl.useProgram(this.program);
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.uniform1i(this.textureLocation, 0);
        this.gl.uniform1i(this.flipYLocation, flipY || 0);
        this.gl.drawArrays(this.gl.TRIANGLE_FAN, 0, 4);
    }
}
