precision mediump float;
precision mediump int;
attribute vec3 vertexPosition;
attribute vec3 vertexNormal;
attribute vec2 vertexUV;
attribute vec3 vertexFrontColor;
attribute vec3 vertexBackColor;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform int useTexture;

varying vec3 screenPosition;
varying vec3 fragPosition;
varying vec3 fragNormal;
varying vec2 fragUV;
varying vec3 frontColor;
varying vec3 backColor;

void main() {
    fragPosition = vec3(modelViewMatrix * vec4(vertexPosition, 1.0));
    fragNormal = normalize(mat3(modelViewMatrix) * vertexNormal);
    if (useTexture == 1)
        fragUV = vertexUV;
    frontColor = vertexFrontColor;
    backColor = vertexBackColor;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(vertexPosition, 1.0);
    screenPosition = gl_Position.xyz;
    // screenPosition.z = 0.9;
}
