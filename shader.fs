precision mediump float;

varying vec2 tCoords;

uniform sampler2D uSampler;
uniform float uAlpha;
uniform float uThreshold;
uniform bool uFalseColors;
uniform vec3 uLut1;
uniform vec3 uLut2;
uniform vec3 uLut3;
uniform vec3 uLut4;
uniform vec3 uLut5;


void main(void) {
	
	gl_FragColor = texture2D(uSampler, vec2(tCoords.s, tCoords.t));
	float intensity = gl_FragColor.x;

	if (uFalseColors==true) //si on est en fausse couleur
	{ //on afiche les couleurs choisies
		if (intensity < 0.2)
		{
			gl_FragColor = vec4(uLut1, 1.0);
		}
		else if (intensity < 0.4)
		{
			gl_FragColor = vec4(uLut2, 1.0);
		}
		else if (intensity < 0.6)
		{
			gl_FragColor = vec4(uLut3, 1.0);
		}
		else if (intensity < 0.8)
		{
			gl_FragColor = vec4(uLut4, 1.0);
		}
		else
		{
			gl_FragColor = vec4(uLut5, 1.0);
		}
	}

	if (intensity <= uThreshold)
	{
		gl_FragColor.a = 0.0;
	}
	else
	{
		gl_FragColor.a = uAlpha;
	}
}