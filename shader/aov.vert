#version 300 es

in vec3 vertexPosition;
in vec3 vertexNormal;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

out vec2 texCoord;

flat out vec3        sourceVertex0, sourceVertex1, sourceVertex2;
flat out float       area;
flat out float       meanCoverage;
flat out vec3        m0, m1, m2, topNormal;

void main() {
    // vec3 a = vertexNormal;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(vertexPosition + normalize(vertexNormal) * 2., 1);
    // gl_Position = projectionMatrix * modelViewMatrix * vec4(vertexPosition, 1) + vec4(0, 0, -1, 0);
    texCoord = (gl_Position.xy + vec2(1)) / 2.0;
}
