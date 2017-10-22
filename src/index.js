import "./index.html";
import "./webgl-utils.js";
import "./fetch.js";
// import "gl-matrix";
import { vec3, vec4, mat4 } from "gl-matrix"
import Model from "./model";
import { downloadModel } from "./model";
import { downloadProgram, Phong } from "./shaderProgram";
import { CameraController } from "./cameracontroller";

/** @type {WebGLRenderingContext} */
var gl;
/** @type {Phong} */
var flatProgram;
/** @type {Phong} */
var gouraudProgram;
/** @type {Phong} */
var phongProgram;
/** @type {Model} */
var pot;

var theta = 0.0;
var dr = 5.0 * Math.PI / 180.0;
var near = -10;
var far = 1000;
var radius = 50;
var phi = 0.0;

var left = -3.0;
var right = 3.0;
var ytop = 3.0;
var bottom = -3.0;

var lightAmbient = [0.2, 0.2, 0.2, 1.0];
var lightSpecular = [1.0, 1.0, 1.0, 1.0];

var at = [0.0, 0.0, 0.0];
var up = [0.0, 1.0, 0.0];

window.onload = () => {
	let canvas = document.getElementById("glcanvas");
	gl = WebGLUtils.setupWebGL(canvas);
	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clearColor(1.0, 1.0, 1.0, 1.0);
	// gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.enable(gl.DEPTH_TEST);

	Promise.all([
		downloadModel(require("../assets/pot.tri"), gl),
		// downloadModel(require("../assets/mesh.obj"), gl),
		downloadProgram(gl, require("../assets/flat.vert"), require("../assets/flat.frag")),
		downloadProgram(gl, require("../assets/gouraud.vert"), require("../assets/gouraud.frag")),
		downloadProgram(gl, require("../assets/phong.vert"), require("../assets/phong.frag")),
	]).then(([model1, program1, program2, program3]) => {
		flatProgram = new Phong(gl, program1);
		gouraudProgram = new Phong(gl, program2);
		phongProgram = new Phong(gl, program3);

		pot = model1;
		// pot.position[0] = 0;
		pot.scale = vec3.fromValues(0.01, 0.01, 0.01);
		// pot.scale = vec3.fromValues(100, 100, 100);
		// pot.scale = vec3.fromValues(5, 5, 5);
		// pot.shininess = 5;
		

		let controller = new CameraController(document.body);
		controller.onchange = function (xRot, yRot) {
			model1.rotation[0] = -xRot / 180 * 3.14;
			model1.rotation[1] = -yRot / 180 * 3.14;
		};

		// setInterval(() => pot.rotation[1] += 0.0314, 30);

		render();
	})
}


function render() {

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	// let eye = [radius * Math.sin(theta) * Math.cos(phi), radius * Math.sin(theta) * Math.sin(phi), radius * Math.cos(theta)];
	let eye = [0, 0, 0.1];
	let viewMatrix = mat4.lookAt(mat4.create(), eye, at, up);
	let projectionMatrix = mat4.ortho(mat4.create(), left, right, bottom, ytop, near, far);

	pot.position[0] -= 2;
	flatProgram.renderModel(pot, viewMatrix, projectionMatrix, lightAmbient, lightSpecular, vec3.normalize(vec3.create(), [-1, -1, -1]));
	pot.position[0] += 2;
	gouraudProgram.renderModel(pot, viewMatrix, projectionMatrix, lightAmbient, lightSpecular, vec3.normalize(vec3.create(), [-1, -1, -1]));
	pot.position[0] += 2;
	phongProgram.renderModel(pot, viewMatrix, projectionMatrix, lightAmbient, lightSpecular, vec3.normalize(vec3.create(), [-1, -1, -1]));
	pot.position[0] -= 2;
	window.requestAnimFrame(render);
}
