import "./webgl-utils.js";
import "gl-matrix";
import { vec3, vec4, mat4, quat } from "gl-matrix"
import { downloadGLTF } from "./gltf"
import Scene from "./gltf/scene";
import Node from "./gltf/node";
import Camera from "./gltf/camera";

import { downloadProgram } from "./program/shaderProgram";
import { Phong } from "./program/phong";
import { DrawTexture } from "./program/drawTexture";
import { GBuffer } from "./program/gBuffer";
import { Deferred } from "./program/deferred";
import { AmbientOcclusionVolumes } from "./program/aov";
import { SSAO } from "./program/ssao";
import { SSAOProgram } from "./program/SSAOProgram";
import { HBAO } from "./program/hbao";
import { Contour } from "./program/contour";

import { Light } from "./light";
import { LightController } from "./lightController";
import { CameraController } from "./cameracontroller";

/** @type {WebGL2RenderingContext} */
var gl;
/** @type {Scene} */
var scene;
/** @type {Node} */
var view;
/** @type {Node} */
var model;
/** @type {vec3} */
var viewInitPos;
/** @type {Light[]} */
var lights = [];

/** @type {Phong} */
var phongProgram;
/** @type {DrawTexture} */
var textureProgram;
/** @type {GBuffer} */
var gbufferProgram;
/** @type {Deferred} */
var deferredProgram;
/** @type {AmbientOcclusionVolumes} */
var aovProgram;
/** @type {SSAO} */
var ssaoProgram;
/** @type {HBAO} */
var hbaoProgram;
/** @type {SSAOProgram} */
var ssaoProgram;
var ssaoProgram2;
/** @type {Contour} */
var contourProgram;

var modelSelector;

var modelUrlMap = [
    "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF/DamagedHelmet.gltf",
    "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoxAnimated/glTF/BoxAnimated.gltf",
    "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Avocado/glTF/Avocado.gltf",
    "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/2CylinderEngine/glTF/2CylinderEngine.gltf",
    "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BarramundiFish/glTF/BarramundiFish.gltf",
    "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoomBox/glTF/BoomBox.gltf",
    "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoomBoxWithAxes/glTF/BoomBoxWithAxes.gltf",
    "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoxTexturedNonPowerOfTwo/glTF/BoxTexturedNonPowerOfTwo.gltf",
    "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoxVertexColors/glTF/BoxVertexColors.gltf",
    "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BrainStem/glTF/BrainStem.gltf",
    "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Buggy/glTF/Buggy.gltf",
    "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMan/glTF/CesiumMan.gltf",
    "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF/Duck.gltf",
    "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/RiggedFigure/glTF/RiggedFigure.gltf",
    "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/SciFiHelmet/glTF/SciFiHelmet.gltf",
    "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Suzanne/glTF/Suzanne.gltf",
    "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/VC/glTF/VC.gltf",
    "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/WaterBottle/glTF/WaterBottle.gltf",
];

window.onload = () => {
    let canvas = document.getElementById("glcanvas");
    gl = WebGLUtils.setupWebGL(canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);
    // gl.clearColor(0.5, 0.5, 0.5, 1.0);
    // gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

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
            value.light.color = [1, 1, 1];
        }
        value.updateForm();
    });

    new CameraController(canvas, (xr, yr, scale) => {
        // view.rotation = quat.fromEuler(quat.create(), xr, yr, 0);
        if (vec3.length(view.translation) != 0) {
            view.translation = vec3.scale(vec3.create(), viewInitPos, Math.pow(2, scale));
        }
        for (const node of scene.nodes) {
            if (!node.camera) {
                node.rotation = quat.rotateX(node.rotation, quat.fromEuler(quat.create(), -xr, -yr, 0), 0);
            }
        }
    });

    // canvas.oncontextmenu = function (e) {
    //     e.preventDefault();
    // };

    const loadScene = downloadGLTF("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF/DamagedHelmet.gltf")
        // const loadScene = downloadGLTF("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoxAnimated/glTF/BoxAnimated.gltf")
        // const loadScene = downloadGLTF("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Avocado/glTF/Avocado.gltf")
        // const loadScene = downloadGLTF("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/2CylinderEngine/glTF/2CylinderEngine.gltf")
        // const loadScene = downloadGLTF("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BarramundiFish/glTF/BarramundiFish.gltf")
        // const loadScene = downloadGLTF("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoomBox/glTF/BoomBox.gltf")
        // const loadScene = downloadGLTF("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoomBoxWithAxes/glTF/BoomBoxWithAxes.gltf")
        // const loadScene = downloadGLTF("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoxTexturedNonPowerOfTwo/glTF/BoxTexturedNonPowerOfTwo.gltf")
        // const loadScene = downloadGLTF("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoxVertexColors/glTF/BoxVertexColors.gltf")
        // const loadScene = downloadGLTF("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BrainStem/glTF/BrainStem.gltf")
        // const loadScene = downloadGLTF("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Buggy/glTF/Buggy.gltf")
        // const loadScene = downloadGLTF("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMan/glTF/CesiumMan.gltf")
        // const loadScene = downloadGLTF("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF/Duck.gltf")
        // const loadScene = downloadGLTF("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/RiggedFigure/glTF/RiggedFigure.gltf")
        // const loadScene = downloadGLTF("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/SciFiHelmet/glTF/SciFiHelmet.gltf")
        // const loadScene = downloadGLTF("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Suzanne/glTF/Suzanne.gltf")
        // const loadScene = downloadGLTF("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/VC/glTF/VC.gltf")
        // const loadScene = downloadGLTF("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/WaterBottle/glTF/WaterBottle.gltf")
        .then(data => {
            console.log(data);
            scene = data.scene;
            const findCamera = (node) => {
                if (!view) {
                    if (node.camera) {
                        view = node;
                    } else if (node.children) {
                        node.children.forEach(findCamera);
                    }
                }
            }
            scene.nodes.forEach(findCamera);
            if (!view) {
                const camera = new Camera(data, {
                    "name": "Finite perspective camera",
                    "type": "perspective",
                    "perspective": {
                        "aspectRatio": canvas.width / canvas.height,
                        "yfov": 37 / 180 * Math.PI,
                        // "yfov": 0.660593,
                        "zfar": 100,
                        "znear": 0.01
                    }
                });
                view = new Node(data, { camera: (data.cameras || (data.cameras = [])).push(camera) - 1 });
                view.translation = vec3.fromValues(0, 0, 5);
            }
            viewInitPos = view.translation;
            // console.log(view);
            // view.translation = vec3.fromValues(0, 0.05, 0.2);
            // view = scene.nodes[0];
            // view.camera.perspective.znear = 1;
        });
    Promise.all([
        loadScene,
        downloadProgram(gl, require("../shader/phong.vert"), require("../shader/phong.frag"))
            .then(program => phongProgram = new Phong(gl, program)),
        // downloadProgram(gl, require("../shader/pbr-vert.glsl"), require("../shader/pbr-frag.glsl"))
        //     .then(program => { }),
        downloadProgram(gl, require("../shader/drawTexture.vert"), require("../shader/drawTexture.frag"))
            .then(program => textureProgram = new DrawTexture(gl, program)),
        downloadProgram(gl, require("../shader/drawTexture.vert"), require("../shader/deferred.frag"))
            .then(program => deferredProgram = new Deferred(gl, program)),
        downloadProgram(gl, require("../shader/gBuffer.vert"), require("../shader/gBuffer.frag"))
            .then(program => {
                gbufferProgram = new GBuffer(gl, program, canvas.width, canvas.height);
                // return downloadProgram(gl, require("../shader/aov.vert"), require("../shader/aov.frag"))
                //     .then(aovprogram => aovProgram = new AmbientOcclusionVolumes(gl, aovprogram, gbufferProgram));
                return downloadProgram(gl, require("../shader/drawTexture.vert"), require("../shader/ssao.frag"))
                    .then(program => ssaoProgram = new SSAO(gl, program, gbufferProgram));
            }),
        downloadProgram(gl, require("../shader/drawTexture.vert"), require("../shader/SSAO.fs")).then(program1 => {
            return downloadProgram(gl, require("../shader/drawTexture.vert"), require("../shader/AOBlend.fs")).then(program2 =>
                ssaoProgram = new SSAOProgram(gl, program1, program2, canvas.width, canvas.height, 0.01, 100)
            );
        }
        ),
        // downloadProgram(gl, require("../shader/drawTexture.vert"), require("../shader/SSAO.fs")).then(program1 => {
        //     downloadProgram(gl, require("../shader/drawTexture.vert"), require("../shader/AOTest.fs")).then(program2 => {
        //         ssaoProgram2 = new SSAOProgram(gl, program1, program2, canvas.width, canvas.height, 0.01, 100);
        //     });
        // }),
        downloadProgram(gl, require("../shader/drawTexture.vert"), require("../shader/hbao.frag"))
            .then(program => hbaoProgram = new HBAO(gl, program, canvas.width, canvas.height)),
        downloadProgram(gl, require("../shader/drawTexture.vert"), require("../shader/contour.frag"))
            .then(program => contourProgram = new Contour(gl, program, canvas.width, canvas.height)),
    ]).then(() => {
        modelSelector = document.createElement("select");
        for (const key in modelUrlMap) {
            if (key) {
                let opt = document.createElement("option");
                opt.innerText = key;
                opt.value = modelUrlMap[key];
                modelSelector.appendChild(opt);
            }
        }
        modelSelector.onchange = () => {
            downloadScene(modelSelector.value);
        }
        document.body.appendChild(modelSelector);
        document.body.appendChild(document.createElement("br"));

        let div = document.createElement("div");
        checkBoxInput = document.createElement("input");
        checkBoxInput.setAttribute("type", "checkbox");
        checkBoxInput.checked = true;
        div.appendChild(checkBoxInput);
        div.appendChild(document.createTextNode("SSAO"));
        document.body.appendChild(div);

        div = document.createElement("div");
        checkBoxInput2 = document.createElement("input");
        checkBoxInput2.setAttribute("type", "checkbox");
        checkBoxInput2.checked = false;
        div.appendChild(checkBoxInput2);
        div.appendChild(document.createTextNode("HBAO"));
        document.body.appendChild(div);

        document.body.appendChild(document.createElement("br"));
        document.body.appendChild(hbaoProgram.createController());
        document.body.appendChild(document.createElement("br"));
        document.body.appendChild(deferredProgram.createController());
        document.body.appendChild(document.createElement("br"));
        document.body.appendChild(contourProgram.createController());
        render();
    });
}

var i = 0;
var checkBoxInput;
var checkBoxInput2;
function render() {
    // scene.nodes[0].rotation = quat.rotateX(scene.nodes[0].rotation, quat.fromEuler(quat.create(), 90, i++ / 10, 0), 0);
    // scene.nodes[1].rotation = quat.rotateX(scene.nodes[1].rotation, quat.fromEuler(quat.create(), 90, i++ / 10, 180), 0);
    // phongProgram.renderScene(scene, view, lights);
    // textureProgram.renderTexture(scene.gltf.meshes[0].primitives[0].material.pbrMetallicRoughness.baseColorTexture.index.GetTextureIndex(gl));
    gbufferProgram.renderScene(scene, view);
    // ssaoProgram.render(view);
    hbaoProgram.render(gbufferProgram.depthTexture, gbufferProgram.normalTexture, gbufferProgram.positionTexture, view.camera);
    // hbaoProgram.render(gbufferProgram.depthRGBTexture, gbufferProgram.positionTexture);
    // textureProgram.renderTexture(hbaoProgram.occlusionTexutre);
    if (checkBoxInput && checkBoxInput.checked) {
        // gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
        ssaoProgram.renderSSAO(gbufferProgram.colorTexture, gbufferProgram.positionTexture, gbufferProgram.normalTexture);
    }
    deferredProgram.render(
        gbufferProgram.positionTexture,
        gbufferProgram.normalTexture,
        gbufferProgram.colorTexture,
        gbufferProgram.depthRGBTexture,
        !checkBoxInput.checked && !checkBoxInput2.checked ? gbufferProgram.defaultTexture : (checkBoxInput.checked ? ssaoProgram.occlusionTarget : hbaoProgram.occlusionTexutre),
        // hbaoProgram.occlusionTexutre,
        // gbufferProgram.defaultTexture,
        view, lights
    );
    contourProgram.render(gbufferProgram.depthTexture, gbufferProgram.normalTexture, gbufferProgram.positionTexture, view.camera);
    // textureProgram.renderTexture(contourProgram.contourTexutre);
    // else {
    // ssaoProgram2.renderSSAO2(deferredProgram.colorTexture, deferredProgram.positionTexture, deferredProgram.normalTexture);
    // }
    // textureProgram.renderTexture(ssaoProgram.occlusionTexutre);
    window.requestAnimFrame(render);
}

function downloadScene(url) {
    return downloadGLTF(url)
        .then(data => {
            console.log(data);
            scene = data.scene;
            const findCamera = (node) => {
                if (!view) {
                    if (node.camera) {
                        view = node;
                    } else if (node.children) {
                        node.children.forEach(findCamera);
                    }
                }
            }
            scene.nodes.forEach(findCamera);
            if (!view) {
                const camera = new Camera(data, {
                    "name": "Finite perspective camera",
                    "type": "perspective",
                    "perspective": {
                        "aspectRatio": canvas.width / canvas.height,
                        "yfov": 37 / 180 * Math.PI,
                        // "yfov": 0.660593,
                        "zfar": 100,
                        "znear": 0.01
                    }
                });
                view = new Node(data, { camera: (data.cameras || (data.cameras = [])).push(camera) - 1 });
                view.translation = vec3.fromValues(0, 0, 5);
            }
            viewInitPos = view.translation;
        });
}
