#version 300 es
precision highp float;

const int MAX_LIGHT_COUNT = 8;

uniform vec4 ambientColor;
uniform float shininess;
uniform vec3 cameraPosition;

uniform int lightCount;
uniform vec3 lightPositions[MAX_LIGHT_COUNT];
uniform vec4 lightColors[MAX_LIGHT_COUNT];

uniform sampler2D positionTexutre;
uniform sampler2D normalTexutre;
uniform sampler2D colorTexutre;
uniform sampler2D depthTexutre;
uniform sampler2D occlusionTexutre;

uniform int showposition;
uniform int shownormal;
uniform int showcolor;
uniform int showdepth;
uniform int showocclusion;

in vec2 texCoord;
out vec4 fragColor;

void main() {
    vec3 normal = texture(normalTexutre, texCoord).xyz;
    vec3 faceColor = texture(colorTexutre, texCoord).xyz;
    vec3 fragPosition = texture(positionTexutre, texCoord).xyz;

    fragColor = ambientColor;
    for (int i = 0; i < MAX_LIGHT_COUNT; i++) {
        if (i < lightCount) {
            vec3 lightDirection = normalize(lightPositions[i] - fragPosition);
            float kd = max(dot(lightDirection, normal), 0.0);
            vec4 diffuse = kd * vec4(faceColor, 1) * lightColors[i];

            vec3 reflection = normalize(dot(lightDirection, normal) * normal * 2.0 - lightDirection);
            float ks = pow(max(dot(reflection, normalize(cameraPosition - fragPosition)), 0.0), shininess);
            vec4  specular = ks * lightColors[i];

            fragColor += diffuse + specular;
        }
    }
    fragColor = fragColor * texture(occlusionTexutre, texCoord);
    if (showposition == 1)  fragColor = texture(positionTexutre, texCoord);
    if (shownormal == 1)    fragColor = texture(normalTexutre, texCoord);
    if (showcolor == 1)     fragColor = texture(colorTexutre, texCoord);
    if (showdepth == 1)     fragColor = texture(depthTexutre, texCoord);
    if (showocclusion == 1) fragColor = texture(occlusionTexutre, texCoord);
}
