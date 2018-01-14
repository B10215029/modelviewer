import { ShaderProgram } from "./shaderProgram";
import { vec3, vec4, mat4 } from "gl-matrix";

export class HBAO extends ShaderProgram {
	/**
	 * create a Physically Based Rendering Shader Program
	 * @param {WebGL2RenderingContext} gl 
	 * @param {WebGLProgram} program 
	 */
    constructor(gl, program, width, height) {
        super(gl, program);
        this.width = width;
        this.height = height;
        // this.vertexPositionLocation = gl.getAttribLocation(program, "vertexPosition");
        // this.vertexNormalLocation = gl.getAttribLocation(program, "vertexNormal");
        // this.viewProjectionMatrixLocation = gl.getUniformLocation(program, "vp");
        // this.invvpMatrixLocation = gl.getUniformLocation(program, "invvp");
        // this.noiseScaleMatrixLocation = gl.getUniformLocation(program, "noiseScale");
        this.resolutionLocation = gl.getUniformLocation(program, "resolution");
        this.unprojectionMatrixLocation = gl.getUniformLocation(program, "unprojectionMatrix");

        this.positionTextureLocation = gl.getUniformLocation(program, "positionMap");
        this.depthTexutreLocation = gl.getUniformLocation(program, "depthTexture");
        this.normalTexutreLocation = gl.getUniformLocation(program, "normalTexture");
        // this.noiseTexutreLocation = gl.getUniformLocation(program, "noiseMap");


        this.occlusionTexutre = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.occlusionTexutre);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); 
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, width, height, 0, gl.RGBA, gl.FLOAT, null);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

        this.frameBuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
        gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
        // gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.gbuffer.depthTexture, 0);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.occlusionTexutre, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    render(depthTexture, normalTexture, positionTexture, camera) {
        this.gl.useProgram(this.program);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.frameBuffer);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        // let viewMatrix = view ? mat4.invert(mat4.create(), view.worldMatrix) : mat4.create();
        // let projectionMatrix = (view && view.camera) ? view.camera.projectionMatrix : mat4.create();
        // let vp = mat4.multiply(mat4.create(), projectionMatrix, viewMatrix);
        // this.gl.uniformMatrix4fv(this.viewProjectionMatrixLocation, false, vp);
        // this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, this.uboSSAOKernal);
        this.gl.uniform2f(this.resolutionLocation, this.width, this.height);
        this.gl.uniformMatrix4fv(this.unprojectionMatrixLocation, false, mat4.invert(mat4.create(), camera.matrix));

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, depthTexture);
        // console.log(this.gbuffer.normalTexture);
        this.gl.uniform1i(this.depthTexutreLocation, 0);

        this.gl.activeTexture(this.gl.TEXTURE1);
        this.gl.bindTexture(this.gl.TEXTURE_2D, normalTexture);
        // console.log(this.gbuffer.depthRGBTexture);
        this.gl.uniform1i(this.normalTexutreLocation, 1);

        // this.gl.activeTexture(this.gl.TEXTURE2);
        // this.gl.bindTexture(this.gl.TEXTURE_2D, this.noiseMap);
        // // console.log(this.noiseMap);
        // this.gl.uniform1i(this.noiseTexutreLocation, 2);

        this.gl.activeTexture(this.gl.TEXTURE3);
        this.gl.bindTexture(this.gl.TEXTURE_2D, positionTexture);
        this.gl.uniform1i(this.positionTextureLocation, 3);

        this.gl.drawArrays(this.gl.TRIANGLE_FAN, 0, 4);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    }
}
