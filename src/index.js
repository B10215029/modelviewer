import "./index.html";
import "./webgl-utils.js";
import "./fetch.js";
import "gl-matrix";
import { vec3, vec4, mat4 } from "gl-matrix"
import { downloadGLTF } from "./gltf"

/** @type {WebGL2RenderingContext} */
var gl;

window.onload = () => {
    let canvas = document.getElementById("glcanvas");
    gl = WebGLUtils.setupWebGL(canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    downloadGLTF("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF/DamagedHelmet.gltf").then(data => {
        console.log(data);
    });
    // downloadGLTF("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoxAnimated/glTF/BoxAnimated.gltf").then(data => console.log(data));
}

function render() {

    window.requestAnimFrame(render);
}
