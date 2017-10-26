#extension GL_OES_standard_derivatives : enable
precision mediump float;
varying vec3 fragPosition;
varying vec3 fragNormal;

uniform vec4 ambientColor;
uniform vec4 diffuseColor;
uniform vec4 lightColor;

uniform vec3 lightDirection;
uniform float shininess;

void main() {
    vec3 U = dFdx(fragPosition);
    vec3 V = dFdy(fragPosition);
    vec3 N = normalize(cross(U,V));

    float kd = max(dot(-lightDirection, N), 0.0);
    vec4  diffuse = kd * mix(vec4(0, 0, 0, 1), diffuseColor, diffuseColor.a) * lightColor;
    

    vec3 reflection = normalize(lightDirection + kd * 2.0 * N);
    float ks = pow(max(dot(reflection, vec3(0, 0, 1)), 0.0), shininess);
    vec4  specular = ks * lightColor;

    gl_FragColor = ambientColor + diffuse + specular;
}
