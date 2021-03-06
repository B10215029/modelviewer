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
        
        this.directionCountLocation = gl.getUniformLocation(program, "directionCount");
        this.numstepLocation = gl.getUniformLocation(program, "numstep");
        this.pixelRadiusLocation = gl.getUniformLocation(program, "pixelRadius");
        this.radiusLocation = gl.getUniformLocation(program, "radius");
        this.biasLocation = gl.getUniformLocation(program, "bias");
        this.intensityLocation = gl.getUniformLocation(program, "intensity");







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
        this.gl.uniform1i(this.directionCountLocation, this.directionCountInput ? Number(this.directionCountInput.value) : 8);
        this.gl.uniform1i(this.numstepLocation, this.numstepInput ? Number(this.numstepInput.value) : 4);
        this.gl.uniform1f(this.pixelRadiusLocation, this.pixelRadiusInput ? Number(this.pixelRadiusInput.value) : 8);
        this.gl.uniform1f(this.radiusLocation, this.radiusInput ? Number(this.radiusInput.value) : 10);
        this.gl.uniform1f(this.biasLocation, this.biasInput ? Number(this.biasInput.value) : 0.2);
        this.gl.uniform1f(this.intensityLocation, this.intensityInput ? Number(this.intensityInput.value) : 1);
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

    /**
     * @returns {HTMLDivElement}
     */
    createController() {
        const div = super.createController();
        this.directionCountInput = this.addRangeNode("directionCount", 8, 20, 0, 1, div);
        this.numstepInput = this.addRangeNode("numstep", 4, 10, 1, 1, div);
        this.pixelRadiusInput = this.addRangeNode("pixelRadius", 8, 100, 0, 0.1, div);
        this.radiusInput = this.addRangeNode("radius", 10, 100, 0.1, 0.1, div);
        this.biasInput = this.addRangeNode("bias", 0.2, 1, 0, 0.1, div);
        this.intensityInput = this.addRangeNode("intensity", 1, 10, 0, 0.1, div);
        return div;
    }
}
