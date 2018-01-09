import { ShaderProgram } from "./shaderProgram";
import Scene from "./gltf/scene";
import Node from "./gltf/node";
import Mesh from "./gltf/mesh";
import { vec3, vec4, mat4 } from "gl-matrix";
import { Light } from "./light"

export class Deferred extends ShaderProgram {
	/**
	 * create a Physically Based Rendering Shader Program
	 * @param {WebGL2RenderingContext} gl 
	 * @param {WebGLProgram} program 
	 */
    constructor(gl, program, width, height) {
        super(gl, program);
        this.width = width;
        this.height = height;
        console.log(gl.getExtension("EXT_color_buffer_float"));
        this.vertexPositionLocation = gl.getAttribLocation(program, "Position");
        this.vertexNormalLocation = gl.getAttribLocation(program, "Normal");
        this.vertexUVLocation = gl.getAttribLocation(program, "Texcoord");
        this.modelViewMatrixLocation = gl.getUniformLocation(program, "u_ModelView");
        this.projectionMatrixLocation = gl.getUniformLocation(program, "u_Persp");
        this.textureLocation = gl.getUniformLocation(program, "u_Texutre");
        this.key = Symbol();

        this.defaultTexture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.defaultTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 255, 255]));
        gl.bindTexture(gl.TEXTURE_2D, null);

        this.depthTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.depthTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, width, height, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);

        this.normalTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.normalTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, width, height, 0, gl.RGBA, gl.FLOAT, null);
        // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

        this.positionTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.positionTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, width, height, 0, gl.RGBA, gl.FLOAT, null);

        this.colorTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.colorTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, width, height, 0, gl.RGBA, gl.FLOAT, null);

        this.depthRGBTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.depthRGBTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, width, height, 0, gl.RGBA, gl.FLOAT, null);

        this.frameBuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
        this.buffers = [
            gl.COLOR_ATTACHMENT0,
            gl.COLOR_ATTACHMENT1,
            gl.COLOR_ATTACHMENT2,
            gl.COLOR_ATTACHMENT3,
        ];
        gl.drawBuffers(this.buffers);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.depthTexture, 0);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.depthRGBTexture, 0);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, this.normalTexture, 0);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT2, gl.TEXTURE_2D, this.positionTexture, 0);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT3, gl.TEXTURE_2D, this.colorTexture, 0);

        const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        switch (status) {
            case gl.FRAMEBUFFER_COMPLETE:
                break;
            case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
                throw ("Incomplete framebuffer: FRAMEBUFFER_INCOMPLETE_ATTACHMENT");
                break;
            case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
                throw ("Incomplete framebuffer: FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT");
                break;
            case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
                throw ("Incomplete framebuffer: FRAMEBUFFER_INCOMPLETE_DIMENSIONS");
                break;
            case gl.FRAMEBUFFER_UNSUPPORTED:
                throw ("Incomplete framebuffer: FRAMEBUFFER_UNSUPPORTED");
                break;
            default:
                throw ("Incomplete framebuffer: " + status);
        }

        console.log(gl.checkFramebufferStatus(gl.FRAMEBUFFER));
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
            console.log("Can't use framebuffer");
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

	/**
	 * render a scene
	 * @param {Scene} scene 
	 * @param {Node} view 
	 */
    renderScene(scene, view) {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        for (const node of scene.nodes) {
            this.renderNode(node, mat4.create(), view);
        }
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
        this.gl.useProgram(this.program);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.frameBuffer);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        for (const primitive of mesh.primitives) {
            this.gl.bindVertexArray(primitive.GetVertexArray(this.gl, this.key, (attributes) => {
                if (attributes.POSITION) {
                    attributes.POSITION.SetVertexAttribute(this.gl, this.vertexPositionLocation);
                }
                if (attributes.NORMAL) {
                    attributes.NORMAL.SetVertexAttribute(this.gl, this.vertexNormalLocation);
                }
                if (attributes.TEXCOORD_0) {
                    attributes.TEXCOORD_0.SetVertexAttribute(this.gl, this.vertexUVLocation);
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
            primitive.material.pbrMetallicRoughness.baseColorTexture.index.BindTexture(this.gl);

            if (primitive.indices) {
                this.gl.drawElements(primitive.mode, primitive.indices.count, primitive.indices.componentType, primitive.indices.byteOffset);
            } else {
                this.gl.drawArrays(primitive.mode, primitive.attributes.POSITION.byteOffset, primitive.attributes.POSITION.count);
            }
            this.gl.bindVertexArray(null);
        }
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.null);
    }
}
