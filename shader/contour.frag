#version 300 es
precision highp float;

uniform vec2 resolution;
uniform sampler2D positionMap;
uniform sampler2D depthTexture;
uniform sampler2D normalTexture;
uniform int drawSilhouette;
uniform int drawContour;
uniform int drawSuggestive;
uniform int contourOnly;
uniform int radius;
uniform float contourThreshold;
uniform float contourThreshold2;
uniform vec3 color;

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

float intensity(in vec3 color) {
	return sqrt((color.x*color.x)+(color.y*color.y)+(color.z*color.z));
}

float ndotp(vec2 uv) {
    return dot(GetPosition(uv), GetNormal(uv));
}

float sobel(float step, vec2 center)
{
	// get samples around pixel
    float tleft  = ndotp(center + vec2(-step,step));
    float left   = ndotp(center + vec2(-step,0));
    float bleft  = ndotp(center + vec2(-step,-step));
    float top    = ndotp(center + vec2(0,step));
    float bottom = ndotp(center + vec2(0,-step));
    float tright = ndotp(center + vec2(step,step));
    float right  = ndotp(center + vec2(step,0));
    float bright = ndotp(center + vec2(step,-step));

	// Sobel masks (to estimate gradient)
	//        1 0 -1     -1 -2 -1
	//    X = 2 0 -2  Y = 0  0  0
	//        1 0 -1      1  2  1

    float x = tleft + 2.0*left + bleft - tright - 2.0*right - bright;
    float y = -tleft - 2.0*top - tright + bleft + 2.0 * bottom + bright;
    float color = sqrt((x*x) + (y*y));
    if (color > contourThreshold2){
        return 1.0;
    } else {
        return 0.0;
    }
 }

void main() {
    float contour = 0.0;
    vec3 p = -GetPosition(gl_FragCoord.xy);
    vec3 n = GetNormal(gl_FragCoord.xy);

    if (drawContour == 1) {
        int c = 0;
        for (int i = 0; i < radius; i++) {
            for (float angle = 0.0; angle <= 6.283; angle += 6.283 / float(radius * 5)) {
                vec2 offset = vec2(cos(angle), sin(angle)) * float(i);
                vec3 sp = -GetPosition(gl_FragCoord.xy + offset);
                vec3 sn = GetNormal(gl_FragCoord.xy + offset);
                if ((sp.z-p.z) >= contourThreshold) {
                    c++;
                }
            }
        }
        if (c > radius) {
            contour = 1.0;
        }
    }

    if (drawSilhouette == 1) {
        if (texture(depthTexture, gl_FragCoord.xy / resolution).r != 1.0) {
            for (int i = 0; i < radius; i++) {
                for (float angle = 0.0; angle <= 6.283; angle += 6.283 / float(radius * 5)) {
                    if (texture(depthTexture, (gl_FragCoord.xy + vec2(cos(angle), sin(angle)) * float(i)) / resolution).r == 1.0) {
                        contour = 1.0;
                        i = radius;
                        break;
                    }
                }
            }
        }
    }

    if (contourOnly == 1) {
        fragColor = vec4(vec3(1.0 - contour), 1);
    } else {
        fragColor = vec4(0, 0, 0, contour);
    }

    if (drawSuggestive == 1 && contour == 0.0) {
        for (int i = 0; i < radius; i++) {
            for (float angle = 0.0; angle <= 6.283; angle += 6.283 / float(radius * 5)) {
                if (sobel(1.0, gl_FragCoord.xy + vec2(cos(angle), sin(angle)) * float(i)) == 1.0) {
                    contour = 1.0;
                    i = radius;
                    break;
                }
            }
        }
        // contour = sobel(1.0, gl_FragCoord.xy);
        if (contourOnly == 1) {
            if (contour != 0.0) {
                fragColor = vec4(color, 1);
            }
        } else {
            fragColor = vec4(color, contour);
        }
    }
}
