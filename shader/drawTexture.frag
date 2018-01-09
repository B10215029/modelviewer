#version 300 es
precision highp float;
uniform sampler2D image;
uniform int flipY;

in vec2 texCoord;
out vec4 fragColor;

void main() {
    vec2 flipTexCoord = vec2(1,-1) * texCoord;
	if (flipY == 0)
		fragColor = texture(image, texCoord);
	else
		fragColor = texture(image, flipTexCoord);
	//fragColor = vec4(1, 0, 0, 1);
}
