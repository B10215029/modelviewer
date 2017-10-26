import "./index.html";
import "./webgl-utils.js";
import "./fetch.js";
// import "gl-matrix";
import { vec3, vec4, mat4 } from "gl-matrix"
import Model from "./model";
import { downloadModel } from "./model";
import { downloadProgram, Phong } from "./shaderProgram";
import { CameraController } from "./cameracontroller";
import { Camera } from "./camera"
import { ModelController } from "./modelController";
import { Light } from "./light"
import { LightController } from "./lightController"

require("../assets/fighter.tri");

/** @type {WebGLRenderingContext} */
var gl;

/** @type {Phong[]} */
var shaderPrograms = [];

/** @type {CameraController} */
var cameraController;
/** @type {Camera} */
var camera;

/** @type {ModelController[]} */
var modelControllers = [];
// /** @type {Model[]} */
// var models = [];

/** @type {LightController[]} */
var lightControllers = [];
/** @type {Light[]} */
var lights = [];

var lightAmbient = [0.2, 0.2, 0.2, 1.0];
var lightSpecular = [1.0, 1.0, 1.0, 1.0];

window.onload = () => {
    let canvas = document.getElementById("glcanvas");
    gl = WebGLUtils.setupWebGL(canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.getExtension('OES_standard_derivatives');

    camera = new Camera();
    // camera.ortho(-3, 3, -1, 1, -10, 1000);
    camera.perspective(3.14/4, canvas.width / canvas.height, 0.1, 10000);
    cameraController = new CameraController(canvas, camera);

    lights = [new Light(), new Light()];
    lightControllers = lights.map((value, index) => {
        let controller = new LightController(value);
        controller.appendToElement(document.getElementById("lightcontroller" + index));
        return controller;
    });

    Promise.all([
        Promise.all([
            downloadModel(require("../assets/pot.tri"), gl),
            downloadModel(require("../assets/Teapot2.json"), gl),
            downloadModel(require("../assets/mesh.obj"), gl),
        ]),
        Promise.all([
            downloadProgram(gl, require("../assets/flat.vert"), require("../assets/flat.frag")),
            downloadProgram(gl, require("../assets/gouraud.vert"), require("../assets/gouraud.frag")),
            downloadProgram(gl, require("../assets/phong.vert"), require("../assets/phong.frag")),
        ])
    ]).then(([models, programs]) => {
        modelControllers = models.map((model, index) => {
            let controller = new ModelController(model);
            controller.appendToElement(document.getElementById("modelcontroller" + index));
            return controller;
        });
        shaderPrograms = programs.map((program) => new Phong(gl, program));

        lights[0].position = vec3.normalize(vec3.create(), [-1, -1, -1]);
        render();
    })
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    let viewMatrix = camera.viewMatrix;
    let projectionMatrix = camera.projectionMatrix;

    for (const modelController of modelControllers) {
        let useShader = shaderPrograms[modelController.shaderSelector.value];
        useShader.renderModel(modelController.model, viewMatrix, projectionMatrix, lightAmbient, lights);
    }

    window.requestAnimFrame(render);
}
