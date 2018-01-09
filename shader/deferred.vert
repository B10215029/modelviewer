#version 300 es
precision highp float;

uniform mat4 u_ModelView;
uniform mat4 u_Persp;
uniform mat4 u_InvTrans;

in vec3 Position;
in vec3 Normal;
in vec2 Texcoord;

out vec3 fs_Normal;
out vec4 fs_Position;
out vec2 fs_Texcoord;
out float fs_Depth;

void main(void) {
    fs_Normal = normalize(mat3(u_ModelView) * Normal);
    // fs_Normal = ((u_InvTrans*vec4(Normal,0.0)).xyz);
    fs_Position = u_ModelView * vec4(Position, 1.0);
    gl_Position = u_Persp * u_ModelView * vec4(Position, 1.0);
    fs_Texcoord = Texcoord;
    fs_Depth = ((gl_Position.z / gl_Position.w));
    // gl_Position = vec4(Position, 1.0);
}
