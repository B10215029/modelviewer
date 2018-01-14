import "./index.html";
import "./webgl-utils.js";
import "./fetch.js";
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

import { Light } from "./light"
import { LightController } from "./lightController"

/** @type {WebGL2RenderingContext} */
var gl;
/** @type {Scene} */
var scene;
/** @type {Node} */
var view;
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
                        "zfar": 50,
                        "znear": 0.01
                    }
                });
                view = new Node(data, { camera: (data.cameras || (data.cameras = [])).push(camera) - 1 });
                view.translation = vec3.fromValues(0, 0, 3);
            }
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
            downloadProgram(gl, require("../shader/drawTexture.vert"), require("../shader/AOBlend.fs")).then(program2 => {
                ssaoProgram = new SSAOProgram(gl, program1, program2, canvas.width, canvas.height, 0.01, 100);
            });
        }),
        // downloadProgram(gl, require("../shader/drawTexture.vert"), require("../shader/SSAO.fs")).then(program1 => {
        //     downloadProgram(gl, require("../shader/drawTexture.vert"), require("../shader/AOTest.fs")).then(program2 => {
        //         ssaoProgram2 = new SSAOProgram(gl, program1, program2, canvas.width, canvas.height, 0.01, 100);
        //     });
        // }),
        downloadProgram(gl, require("../shader/drawTexture.vert"), require("../shader/hbao.frag"))
            .then(program => hbaoProgram = new HBAO(gl, program, canvas.width, canvas.height)),
    ]).then(render);
}

var i = 0;
var ao = 1;
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
    deferredProgram.render(
        gbufferProgram.positionTexture,
        gbufferProgram.normalTexture,
        gbufferProgram.colorTexture,
        gbufferProgram.depthRGBTexture,
        hbaoProgram.occlusionTexutre,
        // gbufferProgram.defaultTexture,
        view, lights
    );
    // if (ao == 1)
    // ssaoProgram.renderSSAO(gbufferProgram.colorTexture, gbufferProgram.positionTexture, gbufferProgram.normalTexture);
    // else {
    // ssaoProgram2.renderSSAO2(deferredProgram.colorTexture, deferredProgram.positionTexture, deferredProgram.normalTexture);
    // }
    // textureProgram.renderTexture(ssaoProgram.occlusionTexutre);
    window.requestAnimFrame(render);
}

function changeAO() {
    if (ao == 1)
        ao = 0;
    else
        ao = 1;
}
