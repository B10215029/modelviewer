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
import { ModelController, modelUrlMap } from "./modelController";
import { Light } from "./light"
import { LightController } from "./lightController"

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

var defaultModelList = [
    "csie.tri",
    "car_roadster.tri"
];

window.onload = () => {
    let canvas = document.getElementById("glcanvas");
    gl = WebGLUtils.setupWebGL(canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.getExtension('OES_standard_derivatives');

    camera = new Camera();
    // camera.ortho(-3, 3, -1, 1, -10, 1000);
    camera.perspective(3.14 / 4, canvas.width / canvas.height, 0.1, 10000);
    cameraController = new CameraController(canvas, camera);

    let searchParams = (new URL(window.location.href)).searchParams;
    let lightCount = Number.parseInt(searchParams.get("light") || "2");
    lightCount = lightCount > 8 ? 8 : lightCount;
    let modelCount = Number.parseInt(searchParams.get("model") || "3");

    for (let i = 0; i < lightCount; i++) {
        lights.push(new Light());
    }
    // lights = [new Light(), new Light()];
    lightControllers = lights.map((value, index) => {
        let td = document.createElement("td");
        let controller = new LightController(value);
        controller.appendToElement(td);
        document.getElementById("lightcontroller").appendChild(td);
        return controller;
    });

    lightControllers.forEach((value, index) => {
        if (index === 0) {
            value.light.position = [-100, -100, 100];
            value.light.color = [0.5, 0.5, 0.5];
        }
        if (index === 1) {
            value.light.position = [100, 100, 0];
            value.light.color = [0.7, 0.5, 0];
        }
        value.updateForm();
    });

    let modelList = [];
    for (let i = 0; i < modelCount; i++) {
        if (defaultModelList[i]) {
            modelList.push(downloadModel(modelUrlMap[defaultModelList[i]], gl));
        } else {
            modelList.push(downloadModel(require("../assets/pot.tri"), gl));
        }
    }

    document.getElementById("ambient").value = "#" + ((1 << 24) + ((lightAmbient[0] * 255) << 16) + ((lightAmbient[1] * 255) << 8) + Math.trunc(lightAmbient[2] * 255)).toString(16).slice(1);
    document.getElementById("ambient").oninput = () => {
        let value = document.getElementById("ambient").value;
        lightAmbient[0] = parseInt(value.substring(1, 3), 16) / 255;
        lightAmbient[1] = parseInt(value.substring(3, 5), 16) / 255;
        lightAmbient[2] = parseInt(value.substring(5, 7), 16) / 255;
    };
    document.getElementById("resercamera").onclick = () => {
        camera.scale = 5.5;
        camera.rotation = [0, 0, 0];
        cameraController.xRot = 0;
        cameraController.yRot = 0;
    };
    Promise.all([
        Promise.all(modelList), Promise.all([
            downloadProgram(gl, require("../assets/shader/flat.vert"), require("../assets/shader/flat.frag")),
            downloadProgram(gl, require("../assets/shader/gouraud.vert"), require("../assets/shader/gouraud.frag")),
            downloadProgram(gl, require("../assets/shader/phong.vert"), require("../assets/shader/phong.frag")),
            downloadProgram(gl, require("../assets/shader/phong.vert"), require("../assets/shader/toon.frag")),
        ])
    ]).then(([models, programs]) => {
        modelControllers = models.map((model, index) => {
            let td = document.createElement("td");
            let controller = new ModelController(model);
            controller.appendToElement(td);
            document.getElementById("modelcontroller").appendChild(td);
            if (index === 0) {
                controller.translateX.value = -10;
                controller.shaderSelector.value = 0;
                controller.colorAlpha.value = 0;
            }
            if (index === 1) {
                controller.translateX.value = 0;
                controller.shaderSelector.value = 1;
                controller.colorAlpha.value = 0;
            }
            if (index === 2) {
                controller.translateX.value = 10;
                controller.shaderSelector.value = 2;
            }
            controller.updateModel();
            return controller;
        });
        shaderPrograms = programs.map((program) => new Phong(gl, program));

        render();
    })
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    let viewMatrix = camera.viewMatrix;
    let projectionMatrix = camera.projectionMatrix;

    for (const modelController of modelControllers) {
        let useShader = shaderPrograms[modelController.shaderSelector.value];
        useShader.renderModel(modelController.model, viewMatrix, projectionMatrix, camera.eye, lightAmbient, lights);
    }

    window.requestAnimFrame(render);
}
