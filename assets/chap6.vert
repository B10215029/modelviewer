attribute vec4 vPosition;
attribute vec4 vNormal;

varying vec4 fColor;


uniform vec4 ambientProduct, diffuseProduct, specularProduct;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform vec4 lightPosition;
uniform float shininess;
uniform vec3 eyePosition;


void
main()
{
    vec3 L;
    if(lightPosition.w == 0.0)  L = normalize( lightPosition.xyz);
    else  L = normalize( (lightPosition - vPosition) .xyz);

    
    vec3 E = normalize( eyePosition);
    
    vec3 H = normalize( L + E );

    
    // Transform vertex normal into eye coordinates
    
    vec3 N = normalize(vNormal.xyz);

    // Compute terms in the illumination equation
    vec4 ambient = ambientProduct;

    float Kd = max( dot(L, N), 0.0 );
    vec4  diffuse = Kd*diffuseProduct;

    float Ks = pow( max(dot(N, H), 0.0), shininess );
    vec4  specular = Ks * specularProduct;
    
    if( dot(L, N) < 0.0 ) {
    specular = vec4(0.0, 0.0, 0.0, 1.0);
    } 

    gl_Position = projectionMatrix * modelViewMatrix * vPosition;
    
    fColor = ambient + diffuse +specular;

    fColor.a = 1.0;
}