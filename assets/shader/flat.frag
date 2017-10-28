#extension GL_OES_standard_derivatives : enable
precision mediump float;
precision mediump int;
const int MAX_LIGHT_COUNT = 8;
varying vec3 fragPosition;
varying vec3 fragNormal;
varying vec2 fragUV;
varying vec3 frontColor;
varying vec3 backColor;

uniform vec4 ambientColor;
uniform vec4 diffuseColor;
uniform float shininess;

uniform vec3 cameraPosition;
uniform int lightCount;
uniform vec3 lightPositions[MAX_LIGHT_COUNT];
uniform vec4 lightColors[MAX_LIGHT_COUNT];

// uniform sampler2D mainTexture;
// uniform int useTexture;

void main() {
    vec3 U = dFdx(fragPosition);
    vec3 V = dFdy(fragPosition);
    vec3 N = normalize(cross(U,V));

    vec3 faceColor = frontColor;
    if (dot(normalize(cameraPosition - fragPosition), N) < 0.0){
        N = -N;
        faceColor = backColor;
    }

    gl_FragColor = ambientColor;
    for (int i = 0; i < MAX_LIGHT_COUNT; i++) {
        if (i < lightCount) {
            vec3 lightDirection = normalize(lightPositions[i] - fragPosition);
            float kd = max(dot(lightDirection, N), 0.0);
            vec4 diffuse = kd * mix(vec4(faceColor, 1), diffuseColor, diffuseColor.a) * lightColors[i];

            vec3 reflection = normalize(dot(lightDirection, N) * N * 2.0 - lightDirection);
            float ks = pow(max(dot(reflection, normalize(cameraPosition - fragPosition)), 0.0), shininess);
            vec4  specular = ks * lightColors[i];

            gl_FragColor += diffuse + specular;
        }
    }
}
