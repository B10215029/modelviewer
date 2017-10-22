#version 300 es
precision mediump float;
in vec3 fragPosition;
in vec3 fragNormal;

uniform vec4 ambientColor;
uniform vec4 diffuseColor;
uniform vec4 lightColor;

uniform vec3 lightDirection;
uniform float shininess;

layout(location = 0) out vec4 outColor;

void main() {
    float kd = max(dot(-lightDirection, fragNormal), 0.0);
    vec4  diffuse = kd * diffuseColor * lightColor;

    vec3 reflection = normalize(lightDirection + kd * 2.0 * fragNormal);
    float ks = pow(max(dot(reflection, vec3(0, 0, 1)), 0.0), shininess);
    vec4  specular = ks * lightColor;

    outColor = ambientColor + diffuse + specular;
}
