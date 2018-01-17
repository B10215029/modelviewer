#version 300 es
precision highp float;

uniform sampler2D uColorBuffer;
uniform sampler2D uOcclusionBuffer;

in vec2 texCoord;

// out vec4 fragColor;

// void main() {
    // vec3 viewDir = vec3(0, 0, 5);
    // float v_dot_n = dot(normalize(viewDir), normalize(texture(uOcclusionBuffer, texCoord)).xyz);
    // if (v_dot_n < 0.1f) {
    //     fragColor = vec4(v_dot_n, v_dot_n, v_dot_n, 1);
    // }
    // else if (v_dot_n < 0.2f) {
    //     fragColor = 1.0f - vec4(v_dot_n, v_dot_n, v_dot_n, 1);;
    // }
    // else
    //     fragColor = vec4(1, 1, 1, 1);
// }

// out vec4 color;
// void main() {
//     color = vec4(clamp(texture(uColorBuffer, texCoord).rgb - texture(uOcclusionBuffer, texCoord).rgb, 0.0, 1.0), 1.0);
// }

out vec4 fragColor;
void main() {
    fragColor = texture(uOcclusionBuffer, texCoord);
}

// void main ()
// {
//     vec3 colour = texture(uColorBuffer, texCoord).xyz;
//     float ao = texture(uOcclusionBuffer, texCoord).x;

//     // colour = clamp(colour - ao, 0.0, 1.0);

//     // fragColor.xyz = pow(colour, vec3(1.0 / 2.2));
//     fragColor = vec4(colour * ao, 1);
//     // fragColor.w = 1.0;
// }