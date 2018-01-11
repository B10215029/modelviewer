#version 300 es
precision highp float;

uniform sampler2D positionMap;
uniform sampler2D depthMap;
uniform sampler2D normalMap;
uniform sampler2D noiseMap;
uniform mat4 vp; // view projection matrix
uniform mat4 invvp; // inverse of vp
uniform mat4 noiseScale;

uniform vec3 ssaoKernals[32];

in vec2 texCoord;

out vec4 fragAO;

void main() {
    float depth = texture(depthMap, texCoord).r;
    // vec4 position = texture(positionMap, texCoord);
    vec4 position = invvp * vec4(vec3(texCoord, depth) * 2.0 - 1.0, 1.0);
    position /= position.w;


    vec3 normal = texture(normalMap, texCoord).rgb * 2.0 - 1.0;
    // vec3 randomvec = texture(noiseMap, texCoord * noiseScale).rgb * 2.0 - 1.0;
    vec3 randomvec = texture(noiseMap, texCoord).rgb * 2.0 - 1.0;
    vec3 tangent = normalize(randomvec - normal * dot(randomvec, normal));
    vec3 bitangent = cross(normal, tangent);
    mat3 tbn = mat3(tangent, bitangent, normal); // tangent to world
    const float radius = 0.25;
    float ao = 0.0;
    for(int i = 0; i < 32; ++i) {
        vec3 sampleWorld = position.xyz + tbn * ssaoKernals[i] * radius;
        vec4 samplePoint = vp * vec4(sampleWorld, 1.0);
        samplePoint /= samplePoint.w;
        samplePoint = samplePoint * 0.5 + 0.5;
        float sampleZ = texture(depthMap, samplePoint.xy).r;
        vec4 invPoint = invvp * vec4(vec3(samplePoint.xy, sampleZ) * 2.0 - 1.0, 1.0);
        invPoint /= invPoint.w;
        // compare and range check
        if(sampleZ > samplePoint.z || length(position - invPoint) > radius) {
            ao += 1.0;
        }
    }
    ao /= 32.0;
    fragAO = vec4(vec3(ao), 1.0);
    // fragAO = texture(noiseMap, texCoord);
    // fragAO = invvp * vec4(vec3(texCoord, depth) * 2.0 - 1.0, 1.0);
    fragAO = vec4(vec3(texCoord, depth) * 2.0 - 1.0, 1.0);
    // fragAO = texture(positionMap, texCoord);
}
