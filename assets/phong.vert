attribute vec3 vertexPosition;
attribute vec3 vertexNormal;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

varying vec3 fragPosition;
varying vec3 fragNormal;

void main() {
    fragPosition = vec3(modelViewMatrix * vec4(vertexPosition, 1.0));
    fragNormal = normalize(mat3(modelViewMatrix) * vertexNormal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(vertexPosition, 1.0);
}
