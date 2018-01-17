import { ShaderProgram } from "./shaderProgram";
import Scene from "../gltf/scene";
import Node from "../gltf/node";
import Mesh from "../gltf/mesh";
import { vec2, vec3, vec4, mat4 } from "gl-matrix";
import { Light } from "../light"

export class SSAOProgram extends ShaderProgram {
    /**
	 * create a SSAO Shader Program
	 * @param {WebGL2RenderingContext} gl
	 * @param {WebGLProgram} program
	 */
    constructor(gl, program, aoBlendProgram, width, height, near, far) {
        super(gl, program);
        this.aoBlendProgram = aoBlendProgram;
        this.width = width;
        this.height = height;
        this.key = Symbol();
        console.log(gl.getExtension("EXT_color_buffer_float"));

        // get locations
        this.ssaoUniformsLocation = gl.getUniformBlockIndex(program, "SSAOUniforms");
        gl.uniformBlockBinding(program, this.ssaoUniformsLocation, 1);
        this.positionBufferLocation = gl.getUniformLocation(program, "uPositionBuffer");
        this.normalBufferLocation = gl.getUniformLocation(program, "uNormalBuffer");
        this.noiseBufferLocation = gl.getUniformLocation(program, "uNoiseBuffer");
        this.colorBufferLocation = gl.getUniformLocation(aoBlendProgram, "uColorBuffer");
        this.occlusionBufferLocation = gl.getUniformLocation(aoBlendProgram, "uOcclusionBuffer");

        // default texture
        this.defaultTexture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.defaultTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 255, 255]));

        // create noise texture
        let numNoisePixels = gl.drawingBufferWidth * gl.drawingBufferHeight;
        let noiseTextureData = new Float32Array(numNoisePixels * 2);
        for (let i = 0; i < numNoisePixels; ++i) {
            let index = i * 2;
            noiseTextureData[index] = Math.random() * 2.0 - 1.0;
            noiseTextureData[index + 1] = Math.random() * 2.0 - 1.0;
        }
        let noiseTexture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, noiseTexture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RG16F, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RG, gl.FLOAT, noiseTextureData);

        // set uniform
        let depthRange = vec2.fromValues(near, far);
        let ssaoUniformData = new Float32Array(8);
        ssaoUniformData[0] = 26.0; // sample radius
        ssaoUniformData[1] = 0.4; // bias
        ssaoUniformData.set(vec2.fromValues(1, 1), 2); // attenuation
        ssaoUniformData.set(depthRange, 4);
        let ssaoUniformBuffer = gl.createBuffer();
        gl.bindBufferBase(gl.UNIFORM_BUFFER, 1, ssaoUniformBuffer);
        gl.bufferData(gl.UNIFORM_BUFFER, ssaoUniformData, gl.STATIC_DRAW);

        // set frame buffer
        this.occlusionBuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.occlusionBuffer);
        this.occlusionTarget = gl.createTexture();
        gl.activeTexture(gl.TEXTURE5);
        gl.bindTexture(gl.TEXTURE_2D, this.occlusionTarget);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.occlusionTarget, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    renderSSAO(colorTexture, positionTexture, normalTexture) {
        this.gl.activeTexture(this.gl.TEXTURE2);
        this.gl.bindTexture(this.gl.TEXTURE_2D, colorTexture);

        this.gl.activeTexture(this.gl.TEXTURE3);
        this.gl.bindTexture(this.gl.TEXTURE_2D, positionTexture);

        this.gl.activeTexture(this.gl.TEXTURE4);
        this.gl.bindTexture(this.gl.TEXTURE_2D, normalTexture);

        this.gl.useProgram(this.program);
        this.gl.uniform1i(this.positionBufferLocation, 3);
        this.gl.uniform1i(this.normalBufferLocation, 4);
        this.gl.uniform1i(this.noiseBufferLocation, 1);

        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.occlusionBuffer);
        this.gl.drawArrays(this.gl.TRIANGLE_FAN, 0, 4);

        this.gl.useProgram(this.aoBlendProgram);
        this.gl.uniform1i(this.colorBufferLocation, 2);
        this.gl.uniform1i(this.occlusionBufferLocation, 5);

        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        this.gl.drawArrays(this.gl.TRIANGLE_FAN, 0, 4);
    }

    renderSSAO2(colorTexture, positionTexture, normalTexture) {
        this.gl.activeTexture(this.gl.TEXTURE2);
        this.gl.bindTexture(this.gl.TEXTURE_2D, colorTexture);

        this.gl.activeTexture(this.gl.TEXTURE3);
        this.gl.bindTexture(this.gl.TEXTURE_2D, positionTexture);

        this.gl.activeTexture(this.gl.TEXTURE4);
        this.gl.bindTexture(this.gl.TEXTURE_2D, normalTexture);

        this.gl.useProgram(this.program);
        this.gl.uniform1i(this.positionBufferLocation, 3);
        this.gl.uniform1i(this.normalBufferLocation, 4);
        this.gl.uniform1i(this.noiseBufferLocation, 1);

        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.occlusionBuffer);
        this.gl.drawArrays(this.gl.TRIANGLE_FAN, 0, 4);

        this.gl.useProgram(this.aoBlendProgram);
        this.gl.uniform1i(this.colorBufferLocation, 2);
        this.gl.uniform1i(this.occlusionBufferLocation, 5);

        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        this.gl.drawArrays(this.gl.TRIANGLE_FAN, 0, 4);
    }
}