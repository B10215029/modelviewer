#version 300 es

const float c_pone = 1.0;
const float c_none = -1.0;
const float c_zero = 0.0;

const vec2 vertexs[4] = vec2[](
	vec2(c_none, c_none),
	vec2(c_pone, c_none),
	vec2(c_pone, c_pone),
	vec2(c_none, c_pone));

out vec2 texCoord;

void main() {
	vec2 vposition = vertexs[gl_VertexID];
	texCoord = (vposition + vec2(c_pone)) / 2.0f;
	gl_Position = vec4(vposition, vec2(c_zero, c_pone));
}
