#version 300 es
precision highp float;

out vec4            fragColor;

/** Vertices of the occluding triangle */
flat in vec3        sourceVertex0, sourceVertex1, sourceVertex2;

flat in float       area;

flat in float       meanCoverage;

uniform sampler2D   wsNormalBuffer;
uniform sampler2D   wsPositionBuffer;

uniform float       invMaxObscuranceDistance;
uniform float       falloffExponent;

/** Inward-facing volume face normals */
flat in vec3        m0, m1, m2, topNormal;

// Do acos in texture fetch (Louis Bavoil's idea...saves about 10%)
// uniform sampler2D acosTexture;
// float fastacos(float x) {
//     return texture(acosTexture, vec2(x * 0.5 + 0.5, 0.5)).x;
// }

// No normalize or shared products
float projArea(const in vec3 a, const in vec3 b, const in vec3 n) {
    // 37.2 ms (without normalization in the projHemi method)

    // Note 1/sqrt and 1/length should both be optimize rsqrt
    vec3 bXa = cross(b, a);
    float cosine = dot(a, b);
    float theta = acos(cosine * inversesqrt(dot(a, a) * dot(b, b)));
    return theta * dot(n, bXa) * inversesqrt(dot(bXa, bXa));
}

const float epsilon = 0.00001;

/**
 Clips a triangle in \a v[0..2] to the plane through the origin with normal \a n
 (and projects it onto the hemisphere if preprocessor macro NORMALIZE is #defined.) 

 The result is a convex polygon in \a v[0..3]; the last vertex may be degenerate
 and equal to the first vertex.  If that is the case, the function returns false.
 The reason that the result is *always* returned in four vertices is that subsequent
 algorithms typically iterate over edges, and the quad and tri case can be handled
 without a branch for the first three edges under this ordering.

 \return true if the result is a triangle, false if it is a quad

 Optimized (by trial and error) for GeForce 280 under GLSL 1.50

 Optimization intuition:
 1. we want to maximize coherence (to keep all threads in a warp active) by quickly reducing to a small set of common cases,
 2. minimize peak register count (to enable a large number of simultaneous threads), and
 3. avoid non-constant array indexing (which expands to a huge set of branches on most GPUs)
*/
bool clipToPlane(const in vec3 n, inout vec3 v0, inout vec3 v1, inout vec3 v2, out vec3 v3) {

    // Distances to the plane (this is an array parallel to v[], stored as a vec3)
    vec3 dist = vec3(dot(v0, n), dot(v1, n), dot(v2, n));

    bool quad = false;

    // Perform this test conservatively since we want to eliminate
    // faces that are adjacent but below the point being shaded.
    // In order to be sure that two-sided surfaces don't slip and completly
    // occlude each other, we need a fairly large epsilon.  The same constant
    // appears in the ray tracer.

    if (! any(greaterThanEqual(dist, vec3(0.01)))) {
        // All clipped; no occlusion from this triangle
        discard;
    } else if (all(greaterThanEqual(dist, vec3(-epsilon)))) {
        // None clipped (original triangle vertices are unmodified)

    } else {
        bvec3 above = greaterThanEqual(dist, vec3(0.0));

        // There are either 1 or 2 vertices above the clipping plane.
        bool nextIsAbove;

        // Find the ccw-most vertex above the plane by cycling
        // the vertices in place.  There are three cases.
        if (above[1] && ! above[0]) {
            nextIsAbove = above[2];
            // Cycle once CCW.  Use v[3] as a temp
            v3 = v0; v0 = v1; v1 = v2; v2 = v3;
            dist = dist.yzx;
        } else if (above[2] && ! above[1]) {
            // Cycle once CW.  Use v3 as a temp.
            nextIsAbove = above[0];
            v3 = v2; v2 = v1; v1 = v0; v0 = v3;
            dist = dist.zxy;
        } else {
            nextIsAbove = above[1];
        }
        // Note: The above[] values are no longer in sync with v[] and dist[].

        // Both of the following branches require the same value, so we compute
        // it into v[3] and move it to v[2] if that was the required location.
        // This helps keep some more threads coherent.

        // Compute vertex 3 first so that we don't smash the data
        // we need to reuse in vertex 2 if this is a quad.
        v3 = mix(v0, v2, dist[0] / (dist[0] - dist[2]));

        if (nextIsAbove) {
            // There is a quad above the plane
            quad = true;

            //    i0---------i1
            //      \        |
            //   .....B......A...
            //          \    |
            //            \  |
            //              i2
            v2 = mix(v1, v2, dist[1] / (dist[1] - dist[2]));

        } else {
            // There is a triangle above the plane

            //            i0
            //           / |
            //         /   |
            //   .....B....A...
            //      /      |
            //    i2-------i1

            v2 = v3;
            v1 = mix(v0, v1, dist[0] / (dist[0] - dist[1]));
        }
    }

    // For triangle output, duplicate first vertex to avoid a branch
    // (and therefore, incoherence) later
    v3 = quad ? v3 : v0;

    return quad;
}


float computeFalloffWeight
    (in  vec3 origin, 
     out vec3 p0,
     out vec3 p1, 
     out vec3 p2) {

    // Let pm[i] = p[i].dot(m[i]),
    // where p[i] is the polygon's vertex in tangent space
    // and m[i] is the normal to edge i.  
    //
    // pm[3] uses p[0] and m[3], which is the negative
    // normal to the entire occluding polygon.  That is,
    // pm[3] is the distance to the occluding polygon.
    vec4 pm;
    p0  = sourceVertex0 - origin;

    // Always the top
    pm[3] = dot(p0, topNormal);

    // Two early-out tests.
    //
    // Corectness: If distanceToPlane < 0, we're *behind* the entire volume.  We need to add a small offset
    // to ensure that we don't discard corners where a surface point is exactly
    // in the plane of the source triangle and might round off to "behind" it.
    //
    // Optimization: If area / distanceToPlane < smallConstant, then this is a small triangle relative to 
    // the point, so it will produce minimal occlusion that will round off to zero at the 
    // alpha blender.  Making the constant larger will start to abruptly truncate some occlusion.
    // Making the constant smaller will increase precision; the test can be eliminated entirely without
    // affecting correctness.
    if ((pm[3] < epsilon) || (area < pm[3] * 0.3)) {
        discard;
    }

    pm[0] = dot(p0, m0);

    p1  = sourceVertex1 - origin;
    pm[1] = dot(p1, m1);

    p2  = sourceVertex2 - origin;
    pm[2] = dot(p2, m2);

    // Let g[i] = max(0.0f, min(1.0f, 1.0f - pm[i] * invDelta));
    vec4 g = clamp(vec4(1.0) - pm * invMaxObscuranceDistance, vec4(0.0), vec4(1.0));

    g[3] = pow(g[3], falloffExponent);

    // Recall that meanCoverage is the average alpha value of the occluding polygon.
    float f = g[0] * g[1] * g[2] * g[3] * meanCoverage;

    // If falloffWeight is low, there's no point in computing AO        
    if (f < 0.1) {
        discard;
    }

    return f;
}


/** Computes the form factor of polygon \a p[0..2] and a point at the origin with normal \a n.
    The result is on the scale 0..1.  DISCARDs if the form factor is zero. */
float computeFormFactor(in vec3 n, in vec3 p0, in vec3 p1, in vec3 p2) {
    vec3 p3;

    // Clip to the plane of the deferred shading pixel.  If the triangle
    // is entirely clipped, the function will DISCARD.

    // Will discard on zero area
    bool quad = clipToPlane(n, p0, p1, p2, p3);

    float result = 0.0;
    if (quad) {
        result += projArea(p3, p0, n);
    }
    
    result += projArea(p0, p1, n);
    result += projArea(p1, p2, n);
    result += projArea(p2, p3, n);

    // Constants factored out of projArea
    const float adjust = 1.0 / (2.0 * 3.1415927);
    return result * adjust;
}

void main() {
    // ivec2 iFragCoord = ivec2(gl_FragCoord.xy);

    // // Occluding triangle's vertices relative to the origin.
    // vec3 p0, p1, p2;    

    // // World space point, from GBuffer
    // vec3 x = texelFetch(wsPositionBuffer, iFragCoord, 0).xyz;

    // // Compute falloff weight first because it will DISCARD if zero
    // float falloffWeight = computeFalloffWeight(x, p0, p1, p2);

    // // World space geometric normal at this point, from GBuffer.  Unpack
    // // into a unit vector
    // vec3 n = texelFetch(wsNormalBuffer, iFragCoord, 0).xyz * 2.0 - 1.0;

    // // Cosine-weighted projected area
    // float formFactor = computeFormFactor(n, p0, p1, p2);

    // formFactor = clamp(formFactor * falloffWeight, 0.0, 1.0);

    // fragColor.rgb = vec3(formFactor);
    // fragColor.a   = 1.0;
    fragColor = vec4(1);
}
