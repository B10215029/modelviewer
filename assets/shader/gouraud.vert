const int MAX_LIGHT_COUNT = 8;
attribute vec3 vertexPosition;
attribute vec3 vertexNormal;
attribute vec2 vertexUV;
attribute vec3 vertexFrontColor;
attribute vec3 vertexBackColor;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

uniform vec4 ambientColor;
uniform vec4 diffuseColor;
uniform float shininess;

uniform vec3 cameraPosition;
uniform int lightCount;
uniform vec3 lightPositions[MAX_LIGHT_COUNT];
uniform vec4 lightColors[MAX_LIGHT_COUNT];

uniform int useTexture;
varying vec4 fragColor;
varying vec2 fragUV;

void main() {
    vec3 normal = normalize(mat3(modelViewMatrix) * vertexNormal);
    vec3 pos = vec3(modelViewMatrix * vec4(vertexPosition, 1.0));
    vec3 faceColor = vertexFrontColor;
    if (dot(normalize(cameraPosition - pos), normal)<0.0){
        normal = -normal;
        faceColor = vertexBackColor;
    }
    if (useTexture == 1)
        fragUV = vertexUV;

    fragColor = ambientColor;
    for (int i = 0; i < MAX_LIGHT_COUNT; i++) {
        if (i < lightCount) {
            vec3 lightDirection = normalize(lightPositions[i] - pos);
            float kd = max(dot(lightDirection, normal), 0.0);
            vec4 diffuse = kd * mix(vec4(faceColor, 1), diffuseColor, diffuseColor.a) * lightColors[i];

            vec3 reflection = normalize(dot(lightDirection, normal) * normal * 2.0 - lightDirection);
            float ks = pow(max(dot(reflection, normalize(cameraPosition - pos)), 0.0), shininess);
            vec4  specular = ks * lightColors[i];

            fragColor += diffuse + specular;
        }
    }

    gl_Position = projectionMatrix * modelViewMatrix * vec4(vertexPosition, 1.0);
}
