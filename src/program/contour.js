import { ShaderProgram } from "./shaderProgram";
import { vec3, vec4, mat4 } from "gl-matrix";

export class Contour extends ShaderProgram {
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
        this.colorLocation = gl.getUniformLocation(program, "color");

        this.positionTextureLocation = gl.getUniformLocation(program, "positionMap");
        this.depthTexutreLocation = gl.getUniformLocation(program, "depthTexture");
        this.normalTexutreLocation = gl.getUniformLocation(program, "normalTexture");
        // this.noiseTexutreLocation = gl.getUniformLocation(program, "noiseMap");
        
        this.drawSilhouetteLocation = gl.getUniformLocation(program, "drawSilhouette");
        this.drawContourLocation = gl.getUniformLocation(program, "drawContour");
        this.drawSuggestiveLocation = gl.getUniformLocation(program, "drawSuggestive");
        this.contourOnlyLocation = gl.getUniformLocation(program, "contourOnly");
        this.radiusLocation = gl.getUniformLocation(program, "radius");
        this.contourThresholdLocation = gl.getUniformLocation(program, "contourThreshold");
        this.contourThreshold2Location = gl.getUniformLocation(program, "contourThreshold2");

        this.contourTexutre = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.contourTexutre);
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
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.contourTexutre, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    render(depthTexture, normalTexture, positionTexture, camera) {
        // this.gl.clear(this.gl.DEPTH_BUFFER_BIT);
        this.gl.useProgram(this.program);
        // this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.frameBuffer);
        this.gl.clear(this.gl.DEPTH_BUFFER_BIT);

        // let viewMatrix = view ? mat4.invert(mat4.create(), view.worldMatrix) : mat4.create();
        // let projectionMatrix = (view && view.camera) ? view.camera.projectionMatrix : mat4.create();
        // let vp = mat4.multiply(mat4.create(), projectionMatrix, viewMatrix);
        // this.gl.uniformMatrix4fv(this.viewProjectionMatrixLocation, false, vp);
        // this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, this.uboSSAOKernal);
        const color = [
            parseInt(this.colorSelector.value.substring(1, 3), 16) / 255,
            parseInt(this.colorSelector.value.substring(3, 5), 16) / 255,
            parseInt(this.colorSelector.value.substring(5, 7), 16) / 255,
        ];

        this.gl.uniform3fv(this.colorLocation, color);
        this.gl.uniform2f(this.resolutionLocation, this.width, this.height);
        this.gl.uniform1i(this.drawSilhouetteLocation, this.drawSilhouetteInput && this.drawSilhouetteInput.checked ? 1 : 0);
        this.gl.uniform1i(this.drawContourLocation, this.drawContourInput && this.drawContourInput.checked ? 1 : 0);
        this.gl.uniform1i(this.drawSuggestiveLocation, this.drawSuggestiveInput && this.drawSuggestiveInput.checked ? 1 : 0);
        this.gl.uniform1i(this.contourOnlyLocation, this.contourOnlyInput && this.contourOnlyInput.checked ? 1 : 0);
        this.gl.uniform1i(this.radiusLocation, this.radiusInput ? Number(this.radiusInput.value) : 3);
        this.gl.uniform1f(this.contourThresholdLocation, this.contourThresholdInput ? Number(this.contourThresholdInput.value) : 0.1);
        this.gl.uniform1f(this.contourThreshold2Location, this.contourThreshold2Input ? Number(this.contourThreshold2Input.value) : 3);
        // this.gl.uniformMatrix4fv(this.unprojectionMatrixLocation, false, mat4.invert(mat4.create(), camera.matrix));

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
        // this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    }

    /**
     * @returns {HTMLDivElement}
     */
    createController() {
        const div = super.createController();
        this.drawSilhouetteInput = this.addCheckBox("drawSilhouette", false, div);
        this.drawContourInput = this.addCheckBox("drawContour", false, div);
        this.drawSuggestiveInput = this.addCheckBox("drawSuggestive", false, div);
        this.contourOnlyInput = this.addCheckBox("contourOnly", false, div);
        this.radiusInput = this.addRangeNode("radius", 3, 30, 0, 1, div);
        this.contourThresholdInput = this.addRangeNode("contourThreshold", 0.1, 10, 0, 0.1, div);
        this.contourThreshold2Input = this.addRangeNode("contourThreshold2", 3, 10, 0, 0.1, div);

        this.colorSelector = document.createElement("input");
        this.colorSelector.setAttribute("type", "color");
        this.colorSelector.defaultValue = "#000000";
        this.colorSelector.setAttribute("list", "");

        div.appendChild(document.createTextNode("Color"));
        div.appendChild(this.colorSelector);
        div.appendChild(document.createElement("br"));
        return div;
    }
}
