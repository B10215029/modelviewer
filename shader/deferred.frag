#version 300 es
precision highp float;

uniform vec3 u_Color;
//in
in vec3 fs_Normal;
in vec4 fs_Position;
in vec2 fs_Texcoord;
in float fs_Depth;

uniform sampler2D u_Texutre;
out vec4 fragColor[4];

void main(void) {
    //normal, position, depth, color
    fragColor[0] = vec4(vec3(fs_Depth), 1.0);
    fragColor[1] = vec4(normalize(fs_Normal.xyz), 1.0);
    fragColor[2] = fs_Position;
    fragColor[3] = vec4(texture(u_Texutre, fs_Texcoord).xyz, 1.0);
}
