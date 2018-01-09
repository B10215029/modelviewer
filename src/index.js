import "./index.html";
import "./webgl-utils.js";
import "./fetch.js";
import "gl-matrix";
import { vec3, vec4, mat4, quat } from "gl-matrix"
import { downloadGLTF } from "./gltf"
import { downloadProgram } from "./shaderProgram";
import { Phong } from "./phong";
import Scene from "./gltf/scene";
import Node from "./gltf/node";
import Camera from "./gltf/camera";
import { Light } from "./light"
import { LightController } from "./lightController"

/** @type {WebGL2RenderingContext} */
var gl;
/** @type {Phong} */
var phongProgram;
/** @type {Scene} */
var scene;
/** @type {Node} */
var view;
/** @type {Light[]} */
var lights = [];

window.onload = () => {
    let canvas = document.getElementById("glcanvas");
    gl = WebGLUtils.setupWebGL(canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    for (let i = 0; i < 3; i++) {
        lights.push(new Light());
    }
    // lights = [new Light(), new Light()];
    const lightControllers = lights.map((value, index) => {
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

    canvas.oncontextmenu = function (e) {
        e.preventDefault();
    };

    const loadScene = downloadGLTF("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF/DamagedHelmet.gltf").then(data => {
        console.log(data);
        scene = data.scene;
        const camera = new Camera(data, {
            "name": "Finite perspective camera",
            "type": "perspective",
            "perspective": {
                "aspectRatio": canvas.width / canvas.height,
                "yfov": 37 / 180 * Math.PI,
                // "yfov": 0.660593,
                // "zfar": 100,
                "znear": 0.01
            }
        });
        view = new Node(data, { camera: (data.cameras || (data.cameras = [])).push(camera) - 1 });
        view.translation = vec3.fromValues(0, 0, 5);
        // data.nodes.push(view);
    });
    // downloadGLTF("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoxAnimated/glTF/BoxAnimated.gltf").then(data => console.log(data));
    const loadProgram = downloadProgram(gl, require("../shader/phong.vert"), require("../shader/phong.frag")).then(program => {
        phongProgram = new Phong(gl, program);
    });
    Promise.all([loadScene, loadProgram]).then(render);
}

var i = 0;
function render() {
    scene.nodes[0].rotation = quat.rotateX(scene.nodes[0].rotation, quat.fromEuler(quat.create(), 90, i++/10, 0), 0);
    phongProgram.renderScene(scene, view, lights);
    window.requestAnimFrame(render);
}
