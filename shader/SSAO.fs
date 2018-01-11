#version 300 es
precision highp float;

layout(std140, column_major) uniform;

#define SIN45 0.707107

uniform SSAOUniforms {
    float uSampleRadius;
    float uBias;
    vec2 uAttenuation;
    vec2 uDepthRange;
};

uniform sampler2D uPositionBuffer;
uniform sampler2D uNormalBuffer;
uniform sampler2D uNoiseBuffer;

out float occlusion;

float getOcclusion(vec3 position, vec3 normal, ivec2 fragCoord) {
    vec3 occluderPosition = texelFetch(uPositionBuffer, fragCoord, 0).xyz;
    vec3 positionVec = occluderPosition - position;
    float intensity = max(dot(normal, normalize(positionVec)) - uBias, 0.0);

    float attenuation = 1.0 / (uAttenuation.x + uAttenuation.y * length(positionVec));

    return intensity * attenuation;
}

in vec2 texCoord;

void main() {
    // ivec2 fragCoord = ivec2(gl_FragCoord.xy);
    // vec3 position = texelFetch(uPositionBuffer, fragCoord, 0).xyz;
    // vec3 normal = texelFetch(uNormalBuffer, fragCoord, 0).xyz;
    // vec2 rand = normalize(texelFetch(uNoiseBuffer, fragCoord, 0).xy);
    // float depth = (length(position) - uDepthRange.x) / (uDepthRange.y - uDepthRange.x);

    // float kernelRadius = uSampleRadius * (1.0 - depth);

    // vec2 kernel[4];
    // kernel[0] = vec2(0.0, 1.0);
    // kernel[1] = vec2(1.0, 0.0);
    // kernel[2] = vec2(0.0, -1.0);
    // kernel[3] = vec2(-1.0, 0.0);

    // occlusion = 0.0;
    // for (int i = 0; i < 4; ++i) {
    //     vec2 k1 = reflect(kernel[i], rand);
    //     vec2 k2 = vec2(k1.x * SIN45 - k1.y * SIN45, k1.x * SIN45 + k1.y * SIN45);

    //     k1 *= kernelRadius;
    //     k2 *= kernelRadius;

    //     occlusion += getOcclusion(position, normal, fragCoord + ivec2(k1));
    //     occlusion += getOcclusion(position, normal, fragCoord + ivec2(k2 * 0.75));
    //     occlusion += getOcclusion(position, normal, fragCoord + ivec2(k1 * 0.5));
    //     occlusion += getOcclusion(position, normal, fragCoord + ivec2(k2 * 0.25));
    // }

    // occlusion = clamp(occlusion / 16.0, 0.0, 1.0);


    vec3 viewDir = vec3(0, 0, 5);
    float v_dot_n = dot(normalize(viewDir), normalize(texture(uNormalBuffer, texCoord)).xyz);
    if (v_dot_n < 0.1f) {
        occlusion = 1.0f;
    }
    else if (v_dot_n < 0.2f) {
        occlusion = 1.0f - v_dot_n;
    }
    else
        occlusion = v_dot_n;

    // vec3 viewDir = vec3(0, 0, 5);
    // float v_dot_n = dot(normalize(viewDir), normalize(texture(uNormalBuffer, texCoord)).xyz);
    // if (v_dot_n < 0.1f) {
    //     occlusion = 1.0f;
    // }
    // else if (v_dot_n < 0.2f) {
    //     occlusion = 1.0f - v_dot_n;
    // }
    // else
    //     occlusion = v_dot_n;
}