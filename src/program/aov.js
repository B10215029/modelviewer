import { ShaderProgram } from "./shaderProgram";
import { GBuffer } from "./gBuffer";
import { vec3, vec4, mat4 } from "gl-matrix";
import { Light } from "../light"

export class AmbientOcclusionVolumes extends ShaderProgram {
	/**
	 * create a Physically Based Rendering Shader Program
	 * @param {WebGL2RenderingContext} gl 
	 * @param {WebGLProgram} program 
	 */
    constructor(gl, program, gbuffer) {
        super(gl, program);
        this.gbuffer = gbuffer;
        this.vertexPositionLocation = gl.getAttribLocation(program, "vertexPosition");
        this.vertexNormalLocation = gl.getAttribLocation(program, "vertexNormal");
        this.modelViewMatrixLocation = gl.getUniformLocation(program, "modelViewMatrix");
        this.projectionMatrixLocation = gl.getUniformLocation(program, "projectionMatrix");

        this.positionTexutreLocation = gl.getUniformLocation(program, "wsPositionBuffer");
        this.normalTexutreLocation = gl.getUniformLocation(program, "wsNormalBuffer");
        // this.depthTexutreLocation = gl.getUniformLocation(program, "depthTexutre");

        this.obscuranceDistLocation = gl.getUniformLocation(program, "invMaxObscuranceDistance");
        this.falloffExponentLocation = gl.getUniformLocation(program, "falloffExponent");
        // this.cameraPositionLocation = gl.getUniformLocation(program, "cameraPosition");

		// this.lightCountLocation = gl.getUniformLocation(program, "lightCount");
		// this.lightPositionsLocation = gl.getUniformLocation(program, "lightPositions");
		// this.lightColorsLocation = gl.getUniformLocation(program, "lightColors");
        this.key = Symbol();
        
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
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.gbuffer.depthTexture, 0);
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
    }

    
	/**
	 * render a scene
	 * @param {Scene} scene 
	 * @param {Node} view 
	 */
    renderScene(scene, view) {
        this.gl.useProgram(this.program);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.frameBuffer);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        for (const node of scene.nodes) {
            this.renderNode(node, mat4.create(), view);
        }
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.null);
    }

	/**
	 * render a node
	 * @param {Node} node 
	 * @param {mat4} parentModelMatrix 
	 * @param {Node} view 
	 */
    renderNode(node, parentModelMatrix, view) {
        const modelMatrix = mat4.multiply(mat4.create(), parentModelMatrix, node.matrix);
        if (node.children) {
            for (const children of node.children) {
                this.renderNode(children, modelMatrix, view);
            }
        }
        if (node.mesh) {
            this.renderMesh(node.mesh, modelMatrix, view);
        }
    }

	/**
	 * render a mesh
	 * @param {Mesh} mesh 
	 * @param {mat4} modelMatrix 
	 * @param {Node} view 
	 */
    renderMesh(mesh, modelMatrix, view) {
        for (const primitive of mesh.primitives) {
            this.gl.bindVertexArray(primitive.GetVertexArray(this.gl, this.key, (attributes) => {
                if (attributes.POSITION) {
                    attributes.POSITION.SetVertexAttribute(this.gl, this.vertexPositionLocation);
                }
                if (attributes.NORMAL) {
                    attributes.NORMAL.SetVertexAttribute(this.gl, this.vertexNormalLocation);
                }
                if (primitive.indices) {
                    primitive.indices.BindBuffer(this.gl);
                }
            }));

            let viewMatrix = view ? mat4.invert(mat4.create(), view.worldMatrix) : mat4.create();
            let projectionMatrix = (view && view.camera) ? view.camera.projectionMatrix : mat4.create();
            this.gl.uniformMatrix4fv(this.modelViewMatrixLocation, false, mat4.multiply(mat4.create(), viewMatrix, modelMatrix));
            this.gl.uniformMatrix4fv(this.projectionMatrixLocation, false, projectionMatrix);

            this.gl.activeTexture(this.gl.TEXTURE0);
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.gbuffer.positionTexture);
            this.gl.uniform1i(this.positionTexutreLocation, 0);
            
            this.gl.activeTexture(this.gl.TEXTURE1);
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.gbuffer.normalTexture);
            this.gl.uniform1i(this.normalTexutreLocation, 1);

            if (primitive.indices) {
                this.gl.drawElements(primitive.mode, primitive.indices.count, primitive.indices.componentType, primitive.indices.byteOffset);
            } else {
                this.gl.drawArrays(primitive.mode, primitive.attributes.POSITION.byteOffset, primitive.attributes.POSITION.count);
            }
            this.gl.bindVertexArray(null);
        }
    }
}
