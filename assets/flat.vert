#version 300 es
in vec3 vertexPosition;
in vec3 vertexNormal;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

uniform vec4 ambientColor;
uniform vec4 diffuseColor;
uniform vec4 lightColor;

uniform vec3 lightDirection;
uniform float shininess;

flat out vec4 fragColor;

void main() {
    vec3 normal = normalize(mat3(modelViewMatrix) * vertexNormal);
    vec3 pos = vec3(modelViewMatrix * vec4(vertexPosition, 1.0));

    float kd = max(dot(-lightDirection, normal), 0.0);
    vec4  diffuse = kd * diffuseColor * lightColor;

    vec3 reflection = normalize(lightDirection + kd * 2.0 * normal);
    float ks = pow(max(dot(reflection, vec3(0, 0, 1)), 0.0), shininess);
    vec4  specular = ks * lightColor;

    fragColor = ambientColor + diffuse + specular;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(vertexPosition, 1.0);
}
