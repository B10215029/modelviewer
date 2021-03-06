#version 300 es
precision highp float;

uniform mat4 u_ModelView;
uniform mat4 u_Persp;

in vec3 Position;
in vec3 Normal;
in vec2 Texcoord;

out vec4 fs_Normal;
out vec4 fs_Position;
out vec2 fs_Texcoord;
out float fs_Depth;

void main(void) {
    fs_Normal = u_ModelView * vec4(Normal, 0.0);
    fs_Position = u_ModelView * vec4(Position, 1.0);
    // fs_Position.z = -fs_Position.z;
    gl_Position = u_Persp * u_ModelView * vec4(Position, 1.0);
    fs_Texcoord = Texcoord;
    fs_Depth = gl_Position.z / gl_Position.w;
}
