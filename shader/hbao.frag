#version 300 es
precision highp float;

uniform vec2 resolution;
uniform sampler2D positionMap;
uniform sampler2D depthTexture;
uniform sampler2D normalTexture;
uniform mat4 unprojectionMatrix;
uniform int directionCount;
uniform int numstep;
uniform float pixelRadius;
uniform float radius;
uniform float bias;
uniform float intensity;

in vec2 texCoord;

out vec4 fragColor;

float random(vec2 co) {
   return fract(sin(dot(co.xy,vec2(12.9898,78.233))) * 43758.5453);
}

vec3 GetPosition(vec2 screenPosition) {
    screenPosition /= resolution;
    // vec3 clipPosition = vec3(screenPosition, texture(depthTexture, screenPosition).r);
    // clipPosition = clipPosition * 2.0 - 1.0;
    // vec4 position = unprojectionMatrix * vec4(clipPosition, 1);
    return texture(positionMap, screenPosition).xyz;
}

vec3 MinDiff(vec3 P, vec3 Pr, vec3 Pl){
    vec3 V1 = Pr - P;
    vec3 V2 = P - Pl;
    return (dot(V1,V1) > dot(V2,V2)) ? V1 : V2;
}

vec3 GetNormal(vec2 screenPosition) {
    return texture(normalTexture, screenPosition / resolution).xyz;
    // vec3 P = GetPosition(screenPosition);
    // vec3 Pr = GetPosition(screenPosition + vec2(1, 0));
    // vec3 Pl = GetPosition(screenPosition + vec2(-1, 0));
    // vec3 Pt = GetPosition(screenPosition + vec2(0, 1));
    // vec3 Pb = GetPosition(screenPosition + vec2(0, -1));
    // return normalize(cross(MinDiff(P, Pr, Pl), MinDiff(P, Pt, Pb)));
}

// vec3 GetTangent(vec2 screenPosition, vec3 direction) {
//     vec3 normal = GetNormal(screenPosition);
//     // return normalize(cross(normal, direction));
//     return normalize(cross(cross(normal, direction), normal));
// }

float Falloff(float DistanceSquare){
    return 1.0 - DistanceSquare / (radius * radius) ;
}

float ComputeAO(vec3 P, vec3 N, vec3 S){
    vec3 V = S - P;
    float VdotV = dot(V, V);
    float NdotV = dot(N, V) * 1.0/sqrt(VdotV);
    return clamp(NdotV - bias, 0.0, 1.0) * clamp(Falloff(VdotV), 0.0, 1.0);
}

void main() {
    vec3 p = GetPosition(gl_FragCoord.xy);
    vec3 n = GetNormal(gl_FragCoord.xy);
    float stepInterval = pixelRadius / float(numstep);
    float angleInterval = 2.0 * 3.1415926 / float(directionCount);
    float stepOffset = stepInterval * random(gl_FragCoord.xy);
    float angle = angleInterval * random(gl_FragCoord.xy);
    float ao = 0.0;
    // float angle = 0.0;
    for (int i = 0; i < directionCount; i++) {
        angle += angleInterval;
        vec2 direction = vec2(sin(angle), cos(angle));
        for (int step = 1; step <= numstep; step++) {
            vec3 s = GetPosition(gl_FragCoord.xy + direction * (stepOffset + stepInterval * float(step)));
            ao += ComputeAO(p, n, s);
        }
    }
    ao = ao / float(directionCount * numstep) / (1.0 - bias) * 2.0;
    ao = pow(clamp(1.0 - ao, 0.0, 1.0), intensity);
    if (length(n) == 0.0) {
        ao = 1.0;
    }
    fragColor = vec4(vec3(ao), 1);
}
