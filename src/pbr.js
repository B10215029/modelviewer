import { ShaderProgram } from "./shaderProgram";
import Scene from "./gltf/scene";
import Node from "./gltf/node";
import Mesh from "./gltf/mesh";
import { vec3, vec4, mat4 } from "gl-matrix";
import { Light } from "./light"

export class PhysicallyBasedRendering extends ShaderProgram {
	/**
	 * create a Physically Based Rendering Shader Program
	 * @param {WebGL2RenderingContext} gl 
	 * @param {WebGLProgram} program 
	 */
	constructor(gl, program) {
		super(gl, program);
		this.vertexPositionLocation = gl.getAttribLocation(program, "a_Position");
		this.vertexNormalLocation = gl.getAttribLocation(program, "a_Normal");
		this.vertexUVLocation = gl.getAttribLocation(program, "a_Tangent");
		this.vertexFrontColorLocation = gl.getAttribLocation(program, "a_UV");
		this.modelViewMatrixLocation = gl.getUniformLocation(program, "u_MVPMatrix");
		this.projectionMatrixLocation = gl.getUniformLocation(program, "u_ModelMatrix");
		// Light
		this.lightCountLocation = gl.getUniformLocation(program, "u_LightCount");
		this.lightPositionsLocation = gl.getUniformLocation(program, "u_LightDirections");
		this.lightColorsLocation = gl.getUniformLocation(program, "u_LightColors");
		// IBL
		this.mainTextureLocation = gl.getUniformLocation(program, "u_DiffuseEnvSampler");
		this.mainTextureLocation = gl.getUniformLocation(program, "u_SpecularEnvSampler");
		this.mainTextureLocation = gl.getUniformLocation(program, "u_brdfLUT");

		this.mainTextureLocation = gl.getUniformLocation(program, "u_BaseColorSampler");
		this.cameraPositionLocation = gl.getUniformLocation(program, "u_BaseColorFactor");

		this.mainTextureLocation = gl.getUniformLocation(program, "u_NormalSampler");
		this.mainTextureLocation = gl.getUniformLocation(program, "u_NormalScale");

		this.mainTextureLocation = gl.getUniformLocation(program, "u_EmissiveSampler");
		this.mainTextureLocation = gl.getUniformLocation(program, "u_EmissiveFactor");

		this.mainTextureLocation = gl.getUniformLocation(program, "u_MetallicRoughnessSampler");
		this.shininessLocation = gl.getUniformLocation(program, "u_MetallicRoughnessValues");

		this.ambientColorLocation = gl.getUniformLocation(program, "u_OcclusionSampler");
		this.diffuseColorLocation = gl.getUniformLocation(program, "u_OcclusionStrength");
		
		this.useTextureLocation = gl.getUniformLocation(program, "u_Camera");
		this.useTextureLocation = gl.getUniformLocation(program, "u_ScaleDiffBaseMR");
		this.useTextureLocation = gl.getUniformLocation(program, "u_ScaleFGDSpec");
		this.useTextureLocation = gl.getUniformLocation(program, "u_ScaleIBLAmbient");
		this.key = Symbol();

		this.defaultTexture = gl.createTexture();
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.defaultTexture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 255, 255]));
		gl.bindTexture(gl.TEXTURE_2D, null);
	}

	/**
	 * render a scene
	 * @param {Scene} scene 
	 * @param {Node} view 
	 * @param {Light[]} lights 
	 */
	renderScene(scene, view, lights) {
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
		for (const node of scene.nodes) {
			this.renderNode(node, mat4.create(), view, lights);
		}
	}

	/**
	 * render a node
	 * @param {Node} node 
	 * @param {mat4} parentModelMatrix 
	 * @param {Node} view 
	 * @param {Light[]} lights 
	 */
	renderNode(node, parentModelMatrix, view, lights) {
		const modelMatrix = mat4.multiply(mat4.create(), parentModelMatrix, node.matrix);
		if (node.children) {
			for (const children of node.children) {
				this.renderNode(children, modelMatrix, view, lights);
			}
		}
		if (node.mesh) {
			this.renderMesh(node.mesh, modelMatrix, view, lights);
		}
	}

	/**
	 * render a mesh
	 * @param {Mesh} mesh 
	 * @param {mat4} modelMatrix 
	 * @param {Node} view 
	 * @param {Light[]} lights 
	 */
	renderMesh(mesh, modelMatrix, view, lights) {
		this.gl.useProgram(this.program);
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
				if (attributes.COLOR_0) {
					attributes.COLOR_0.SetVertexAttribute(this.gl, this.vertexFrontColorLocation);
				} else {
					this.gl.disableVertexAttribArray(this.vertexFrontColorLocation);
				}
				this.gl.disableVertexAttribArray(this.vertexBackColorLocation);
				if (primitive.indices) {
					primitive.indices.BindBuffer(this.gl);
				} 
			}));

			let viewMatrix = view ? mat4.invert(mat4.create(), view.worldMatrix) : mat4.create();
			let projectionMatrix = (view && view.camera) ? view.camera.projectionMatrix : mat4.create();
			this.gl.uniformMatrix4fv(this.modelViewMatrixLocation, false, mat4.multiply(mat4.create(), viewMatrix, modelMatrix));
			this.gl.uniformMatrix4fv(this.projectionMatrixLocation, false, projectionMatrix);

			this.gl.uniform4fv(this.ambientColorLocation, [0.1, 0.1, 0.1, 1]);
			this.gl.uniform1f(this.shininessLocation, 30);
			this.gl.uniform4fv(this.diffuseColorLocation, primitive.material.pbrMetallicRoughness.baseColorFactor);
			this.gl.uniform3fv(this.cameraPositionLocation, view.translation);
			this.gl.uniform1i(this.lightCountLocation, lights.length);
			this.gl.uniform3fv(this.lightPositionsLocation, lights.reduce((arr, val) => arr.concat(...vec3.transformMat4(vec3.create(), val.position, viewMatrix)), []));
			this.gl.uniform4fv(this.lightColorsLocation, lights.reduce((arr, val) => arr.concat(val.color, 1), []));

			if (primitive.material.pbrMetallicRoughness.baseColorTexture) {
				this.gl.uniform1i(this.useTextureLocation, 1);
				this.gl.activeTexture(this.gl.TEXTURE0);
				primitive.material.pbrMetallicRoughness.baseColorTexture.index.BindTexture(this.gl);
			} else {
				this.gl.uniform1i(this.useTextureLocation, 0);
				this.gl.activeTexture(this.gl.TEXTURE0);
				this.gl.bindTexture(this.gl.TEXTURE_2D, this.defaultTexture);
			}

			if (primitive.indices) {
				this.gl.drawElements(primitive.mode, primitive.indices.count, primitive.indices.componentType, primitive.indices.byteOffset);
			} else {
				this.gl.drawArrays(primitive.mode, primitive.attributes.POSITION.byteOffset, primitive.attributes.POSITION.count);
			}
			this.gl.bindVertexArray(null);
		}
	}
}
