import { ShaderProgram } from "./shaderProgram";
import { GBuffer } from "./gBuffer";
import { vec3, vec4, mat4 } from "gl-matrix";
import { Light } from "../light"

export class SSAO extends ShaderProgram {
	/**
	 * create a Physically Based Rendering Shader Program
	 * @param {WebGL2RenderingContext} gl 
	 * @param {WebGLProgram} program 
	 */
    constructor(gl, program, gbuffer) {
        super(gl, program);
        this.gbuffer = gbuffer;
        // this.vertexPositionLocation = gl.getAttribLocation(program, "vertexPosition");
        // this.vertexNormalLocation = gl.getAttribLocation(program, "vertexNormal");
        this.viewProjectionMatrixLocation = gl.getUniformLocation(program, "vp");
        this.invvpMatrixLocation = gl.getUniformLocation(program, "invvp");
        this.noiseScaleMatrixLocation = gl.getUniformLocation(program, "noiseScale");

        this.positionTextureLocation = gl.getUniformLocation(program, "positionMap");
        this.normalTexutreLocation = gl.getUniformLocation(program, "normalMap");
        this.depthTexutreLocation = gl.getUniformLocation(program, "depthMap");
        this.noiseTexutreLocation = gl.getUniformLocation(program, "noiseMap");

        this.ssaoKernalsLocation = gl.getUniformLocation(program, "ssaoKernals");

        this.occlusionTexutre = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.occlusionTexutre);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); 
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, width, height, 0, gl.RGBA, gl.FLOAT, null);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.gbuffer.width, this.gbuffer.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

        this.frameBuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
        gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
        // gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.gbuffer.depthTexture, 0);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.occlusionTexutre, 0);

        const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        switch (status) {
            case gl.FRAMEBUFFER_COMPLETE:
                break;
            case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
                console.warn("Incomplete framebuffer: FRAMEBUFFER_INCOMPLETE_ATTACHMENT");
                break;
            case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
                console.warn("Incomplete framebuffer: FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT");
                break;
            case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
                console.warn("Incomplete framebuffer: FRAMEBUFFER_INCOMPLETE_DIMENSIONS");
                break;
            case gl.FRAMEBUFFER_UNSUPPORTED:
                console.warn("Incomplete framebuffer: FRAMEBUFFER_UNSUPPORTED");
                break;
            default:
                console.warn("Incomplete framebuffer: " + status);
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        this.noiseMap = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.noiseMap);
        this.noiseData = new Float32Array(48);
        for (let i = 0; i < 16; i++) {
            this.noiseData[i] = vec3.fromValues(Math.random * 2 - 1, Math.random * 2 - 1, 0);
            this.noiseData[i] = vec3.normalize(this.noiseData[i], this.noiseData[i]);
        }
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB32F, 4, 4, 0, gl.RGB, gl.FLOAT, this.noiseData);

        // this.uboSSAOKernal = gl.createBuffer();
        // gl.bindBuffer(gl.UNIFORM_BUFFER, this.uboSSAOKernal);
        // gl.bufferData(gl.UNIFORM_BUFFER, 32 * 4, gl.STATIC_DRAW);
        // this.uniformSSAOKernalPtr = glMapBuffer(GL_UNIFORM_BUFFER, GL_WRITE_ONLY);

        // glBufferData(GL_UNIFORM_BUFFER, 32 * sizeof(vec4), 0, GL_STATIC_DRAW);
        // vec4 * uniformSSAOKernalPtr = (vec4 *)glMapBuffer(GL_UNIFORM_BUFFER, GL_WRITE_ONLY);
        // for (int i = 0; i < 32; ++i) {
        //     float scale = (float)i / (float)32;
        //     scale = 0.1f + 0.9f * scale * scale;
        //     uniformSSAOKernalPtr[i] = vec4(normalize(vec3(
        //         rand() / (float)RAND_MAX * 2.0f - 1.0f, // -1.0 ~ 1.0
        //         rand() / (float)RAND_MAX * 2.0f - 1.0f, // -1.0 ~ 1.0
        //         rand() / (float)RAND_MAX * 0.85f + 0.15f // 0.15 ~ 1.0
        //     )) * scale, 0);
        // }
        // glUnmapBuffer(GL_UNIFORM_BUFFER);

    }

    render(view) {
        this.gl.useProgram(this.program);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.frameBuffer);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        let viewMatrix = view ? mat4.invert(mat4.create(), view.worldMatrix) : mat4.create();
        let projectionMatrix = (view && view.camera) ? view.camera.projectionMatrix : mat4.create();
        let vp = mat4.multiply(mat4.create(), projectionMatrix, viewMatrix);
        this.gl.uniformMatrix4fv(this.viewProjectionMatrixLocation, false, vp);
        this.gl.uniformMatrix4fv(this.invvpMatrixLocation, false, mat4.invert(mat4.create(), vp));
        this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, this.uboSSAOKernal);

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.gbuffer.normalTexture);
        // console.log(this.gbuffer.normalTexture);
        this.gl.uniform1i(this.normalTexutreLocation, 0);

        this.gl.activeTexture(this.gl.TEXTURE1);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.gbuffer.depthRGBTexture);
        // console.log(this.gbuffer.depthRGBTexture);
        this.gl.uniform1i(this.depthTexutreLocation, 1);

        this.gl.activeTexture(this.gl.TEXTURE2);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.noiseMap);
        // console.log(this.noiseMap);
        this.gl.uniform1i(this.noiseTexutreLocation, 2);

        this.gl.activeTexture(this.gl.TEXTURE3);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.gbuffer.positionTexture);
        this.gl.uniform1i(this.positionTextureLocation, 3);

        this.gl.drawArrays(this.gl.TRIANGLE_FAN, 0, 4);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    }
}
