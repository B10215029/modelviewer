#version 300 es
in vec3 vertexPosition;
in vec3 vertexNormal;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

out vec3 fragPosition;
out vec3 fragNormal;

void main() {
    fragPosition = vec3(modelViewMatrix * vec4(vertexPosition, 1.0));
    fragNormal = normalize(mat3(modelViewMatrix) * vertexNormal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(vertexPosition, 1.0);
}
