import { ShaderProgram } from "./shaderProgram";
import Scene from "./gltf/scene";
import Camera from "./gltf/camera";
import Node from "./gltf/node";
import Mesh from "./gltf/mesh";

import Model from "./model";
import { vec3, vec4, mat4 } from "gl-matrix";
import { Light } from "./light"

export class Phong extends ShaderProgram {
	/**
	 * 
	 * @param {WebGL2RenderingContext} gl 
	 * @param {WebGLProgram} program 
	 */
	constructor(gl, program) {
		super(gl, program);
		this.vertexPositionLocation = gl.getAttribLocation(program, "vertexPosition");
		this.vertexNormalLocation = gl.getAttribLocation(program, "vertexNormal");
		this.vertexUVLocation = gl.getAttribLocation(program, "vertexUV");
		this.vertexFrontColorLocation = gl.getAttribLocation(program, "vertexFrontColor");
		this.vertexBackColorLocation = gl.getAttribLocation(program, "vertexBackColor");
		this.modelViewMatrixLocation = gl.getUniformLocation(program, "modelViewMatrix");
		this.projectionMatrixLocation = gl.getUniformLocation(program, "projectionMatrix");
		this.ambientColorLocation = gl.getUniformLocation(program, "ambientColor");
		this.diffuseColorLocation = gl.getUniformLocation(program, "diffuseColor");
		this.shininessLocation = gl.getUniformLocation(program, "shininess");
		this.cameraPositionLocation = gl.getUniformLocation(program, "cameraPosition");
		this.lightCountLocation = gl.getUniformLocation(program, "lightCount");
		this.lightPositionsLocation = gl.getUniformLocation(program, "lightPositions");
		this.lightColorsLocation = gl.getUniformLocation(program, "lightColors");
		this.mainTextureLocation = gl.getUniformLocation(program, "mainTexture");
		this.useTextureLocation = gl.getUniformLocation(program, "useTexture");
		this.key = Symbol();

		this.defaultTexture = gl.createTexture();
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.defaultTexture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 255, 255]));
		gl.bindTexture(gl.TEXTURE_2D, null);
	}

	/**
	 * 
	 * @param {Model} model 
	 * @param {mat4} viewMatrix 
	 * @param {mat4} projectionMatrix 
	 * @param {vec4} ambientColor 
	 * @param {Light[]} lights
	 */
	renderModel(model, viewMatrix, projectionMatrix, cameraPosition, ambientColor, lights) {
		this.gl.useProgram(this.program);
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, model.vertexBuffer);
		this.gl.enableVertexAttribArray(this.vertexPositionLocation);
		this.gl.vertexAttribPointer(this.vertexPositionLocation, 3, this.gl.FLOAT, false, 0, 0)
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, model.normalBuffer);
		this.gl.enableVertexAttribArray(this.vertexNormalLocation);
		this.gl.vertexAttribPointer(this.vertexNormalLocation, 3, this.gl.FLOAT, false, 0, 0)
		this.gl.activeTexture(this.gl.TEXTURE0);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.defaultTexture);
		if (model.frontColorBuffer) {
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, model.frontColorBuffer);
			this.gl.enableVertexAttribArray(this.vertexFrontColorLocation);
			this.gl.vertexAttribPointer(this.vertexFrontColorLocation, 3, this.gl.FLOAT, false, 0, 0)
		}
		else {
			this.gl.disableVertexAttribArray(this.vertexFrontColorLocation);
		}
		if (model.backColorBuffer) {
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, model.backColorBuffer);
			this.gl.enableVertexAttribArray(this.vertexBackColorLocation);
			this.gl.vertexAttribPointer(this.vertexBackColorLocation, 3, this.gl.FLOAT, false, 0, 0);
		} else {
			this.gl.disableVertexAttribArray(this.vertexBackColorLocation);
		}
		if (model.texture && model.UVBuffer) {
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, model.UVBuffer);
			this.gl.enableVertexAttribArray(this.vertexUVLocation);
			this.gl.vertexAttribPointer(this.vertexUVLocation, 2, this.gl.FLOAT, false, 0, 0);
			this.gl.activeTexture(this.gl.TEXTURE0);
			this.gl.bindTexture(this.gl.TEXTURE_2D, model.texture);
			this.gl.uniform1i(this.mainTextureLocation, 0);
			this.gl.uniform1i(this.useTextureLocation, 1);
		}
		else {
			this.gl.disableVertexAttribArray(this.vertexUVLocation);
			this.gl.uniform1i(this.useTextureLocation, 0);
		}

		let mvmat = mat4.multiply(mat4.create(), viewMatrix, model.modelMatrix);
		this.gl.uniformMatrix4fv(this.modelViewMatrixLocation, false, mvmat);
		this.gl.uniformMatrix4fv(this.projectionMatrixLocation, false, projectionMatrix);
		this.gl.uniform4fv(this.ambientColorLocation, ambientColor);
		this.gl.uniform4fv(this.diffuseColorLocation, model.color);
		this.gl.uniform1f(this.shininessLocation, model.shininess);
		this.gl.uniform3fv(this.cameraPositionLocation, cameraPosition);
		this.gl.uniform1i(this.lightCountLocation, lights.length);
		this.gl.uniform3fv(this.lightPositionsLocation, lights.reduce((arr, val) => arr.concat(...vec3.transformMat4(vec3.create(), val.position, viewMatrix)), []));
		this.gl.uniform4fv(this.lightColorsLocation, lights.reduce((arr, val) => arr.concat(val.color, 1), []));
		this.gl.drawArrays(this.gl.TRIANGLES, 0, model.vertexs.length / 3);
	}

	/**
	 * 
	 * @param {Scene} scene 
	 * @param {Node} camera 
	 */
	renderScene(scene, view, lights) {
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
		for (const node of scene.nodes) {
			this.renderNode(node, mat4.create(), view, lights);
		}
	}

	/**
	 * 
	 * @param {Node} node 
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
	 * 
	 * @param {Mesh} mesh 
	 * @param {mat4} modelMatrix 
	 * @param {Node} view 
	 */
	renderMesh(mesh, modelMatrix, view, lights) {
		// console.log(mesh);
        // console.log(view);
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

			this.gl.uniform1i(this.useTextureLocation, 1);
			this.gl.activeTexture(this.gl.TEXTURE0);
			// this.gl.bindTexture(this.gl.TEXTURE_2D, this.defaultTexture);
			primitive.material.pbrMetallicRoughness.baseColorTexture.index.BindTexture(this.gl);

			if (primitive.indices) {
				this.gl.drawElements(primitive.mode, primitive.indices.count, primitive.indices.componentType, primitive.indices.byteOffset);
			} else {
				this.gl.drawArrays(primitive.mode, primitive.attributes.POSITION.byteOffset, primitive.attributes.POSITION.count);
			}
			this.gl.bindVertexArray(null);
		}
	}
}
