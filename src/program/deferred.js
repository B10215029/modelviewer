import { ShaderProgram } from "./shaderProgram";
import { vec3, vec4, mat4 } from "gl-matrix";
import { Light } from "../light"

export class Deferred extends ShaderProgram {
	/**
	 * create a Physically Based Rendering Shader Program
	 * @param {WebGL2RenderingContext} gl 
	 * @param {WebGLProgram} program 
	 */
    constructor(gl, program, width, height) {
        super(gl, program);
        this.positionTexutreLocation = gl.getUniformLocation(program, "positionTexutre");
        this.normalTexutreLocation = gl.getUniformLocation(program, "normalTexutre");
        this.colorTexutreLocation = gl.getUniformLocation(program, "colorTexutre");
        this.depthTexutreLocation = gl.getUniformLocation(program, "depthTexutre");
        this.occlusionTexutreLocation = gl.getUniformLocation(program, "occlusionTexutre");

        this.ambientColorLocation = gl.getUniformLocation(program, "ambientColor");
        this.shininessLocation = gl.getUniformLocation(program, "shininess");
        this.cameraPositionLocation = gl.getUniformLocation(program, "cameraPosition");

		this.lightCountLocation = gl.getUniformLocation(program, "lightCount");
		this.lightPositionsLocation = gl.getUniformLocation(program, "lightPositions");
        this.lightColorsLocation = gl.getUniformLocation(program, "lightColors");

		this.showpositionLocation = gl.getUniformLocation(program, "showposition");
		this.shownormalLocation = gl.getUniformLocation(program, "shownormal");
		this.showcolorLocation = gl.getUniformLocation(program, "showcolor");
		this.showdepthLocation = gl.getUniformLocation(program, "showdepth");
		this.showocclusionLocation = gl.getUniformLocation(program, "showocclusion");
    }

	/**
	 * render a mesh
	 * @param {Mesh} mesh 
	 * @param {mat4} modelMatrix 
	 * @param {Node} view 
     * @param {Lights[]} lights 
	 */
    render(positionTexutre, normalTexutre, colorTexutre, depthTexutre, occlusionTexutre, view, lights) {
        let viewMatrix = view ? mat4.invert(mat4.create(), view.worldMatrix) : mat4.create();
        this.gl.useProgram(this.program);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        this.gl.uniform4fv(this.ambientColorLocation, [0.1, 0.1, 0.1, 1]);
        this.gl.uniform1f(this.shininessLocation, 30);
        this.gl.uniform3fv(this.cameraPositionLocation, view.translation);
        this.gl.uniform1i(this.lightCountLocation, lights.length);
        this.gl.uniform3fv(this.lightPositionsLocation, lights.reduce((arr, val) => arr.concat(...vec3.transformMat4(vec3.create(), val.position, viewMatrix)), []));
        this.gl.uniform4fv(this.lightColorsLocation, lights.reduce((arr, val) => arr.concat(val.color, 1), []));

        this.gl.uniform1i(this.showpositionLocation, this.showposition && this.showposition.checked ? 1 : 0);
        this.gl.uniform1i(this.shownormalLocation, this.shownormal && this.shownormal.checked ? 1 : 0);
        this.gl.uniform1i(this.showcolorLocation, this.showcolor && this.showcolor.checked ? 1 : 0);
        this.gl.uniform1i(this.showdepthLocation, this.showdepth && this.showdepth.checked ? 1 : 0);
        this.gl.uniform1i(this.showocclusionLocation, this.showocclusion && this.showocclusion.checked ? 1 : 0);

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, positionTexutre);
        this.gl.uniform1i(this.positionTexutreLocation, 0);
        
        this.gl.activeTexture(this.gl.TEXTURE1);
        this.gl.bindTexture(this.gl.TEXTURE_2D, normalTexutre);
        this.gl.uniform1i(this.normalTexutreLocation, 1);
        
        this.gl.activeTexture(this.gl.TEXTURE2);
        this.gl.bindTexture(this.gl.TEXTURE_2D, colorTexutre);
        this.gl.uniform1i(this.colorTexutreLocation, 2);
        
        this.gl.activeTexture(this.gl.TEXTURE3);
        this.gl.bindTexture(this.gl.TEXTURE_2D, depthTexutre);
        this.gl.uniform1i(this.depthTexutreLocation, 3);
        
        this.gl.activeTexture(this.gl.TEXTURE4);
        this.gl.bindTexture(this.gl.TEXTURE_2D, occlusionTexutre);
        this.gl.uniform1i(this.occlusionTexutreLocation, 4);
        
        this.gl.drawArrays(this.gl.TRIANGLE_FAN, 0, 4);
    }

    /**
     * @returns {HTMLDivElement}
     */
    createController() {
        const div = super.createController();
        this.showposition = this.addCheckBox("position", false, div);
        this.shownormal = this.addCheckBox("normal", false, div);
        this.showcolor = this.addCheckBox("color", false, div);
        this.showdepth = this.addCheckBox("depth", false, div);
        this.showocclusion = this.addCheckBox("occlusion", false, div);
        return div;
    }


}
