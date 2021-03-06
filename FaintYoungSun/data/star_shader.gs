layout(triangles) in;
layout(triangle_strip, max_vertices = 4) out;

uniform mat4 uv_projectionMatrix;
uniform mat4 uv_modelViewMatrix;
uniform mat4 uv_modelViewInverseMatrix;
uniform mat4 uv_modelViewProjectionMatrix;
uniform mat4 uv_projectionInverseMatrix;
uniform mat4 uv_normalMatrix;

uniform int uv_simulationtimeDays;
uniform float uv_simulationtimeSeconds;
uniform float uv_fade;

uniform float simBindRealtime;
uniform float simUseTime;
uniform float simRealtimestart;
uniform float simRealtimeend;
uniform float simdtmin;


//to fragment (defined below)
out float sunTemp;
out float starRadius;
out vec4 fPosition;
out float RHe;
out float RConv;
out float univYr;
out float distance;
out vec3 cameraPosition;
out vec3 rayDirection;

void drawFullscreenQuadAtModelDepth(vec3 modelPos)
{
	vec4 projectedPos = uv_modelViewProjectionMatrix * vec4(modelPos,1.);
	float z = projectedPos.z;
	float w = projectedPos.w;
	gl_Position = vec4(-w, w, z, w);
	rayDirection = (mat3(uv_modelViewInverseMatrix) * (uv_projectionInverseMatrix * vec4(-1., 1., 0.5, 1.0)).xyz);
	EmitVertex();
	gl_Position = vec4(-w, -w, z, w);
	rayDirection = (mat3(uv_modelViewInverseMatrix) * (uv_projectionInverseMatrix * vec4(-1.,-1., 0.5, 1.0)).xyz);
	EmitVertex();
	gl_Position = vec4(w, w, z, w);
	rayDirection = (mat3(uv_modelViewInverseMatrix) * (uv_projectionInverseMatrix * vec4(1.,1., 0.5, 1.0)).xyz);
	EmitVertex();
	gl_Position = vec4(w, -w, z, w);
	rayDirection = (mat3(uv_modelViewInverseMatrix) * (uv_projectionInverseMatrix * vec4(1.,-1., 0.5, 1.0)).xyz);
	EmitVertex();
	EndPrimitive();
}


void main()
{

//pass these to fragment
    cameraPosition = (uv_modelViewInverseMatrix * vec4(0, 0, 0, 1)).xyz;
	distance = length(cameraPosition);

	
	sunTemp = 1000.;
	starRadius = 1.;

	
//////////////////////////////////////////////////////////////
//define the time 
	//each Uniview year represents one Myr
	float dayfract = uv_simulationtimeSeconds/(24.0*3600.0);//0.5*2.0*3.14*(time)/(sqrt(a.x*a.x*a.x/3347937656.835192));
	//float yrs = 365. + 6./24. +  9./1440. +  9./86400. ; //sidereal year
	//float yrs = 365. + 5./24. + 48./1440. + 46./86400. ; //solar year
	float yrs = 365.2425;
	float years_0 = 1970. + (uv_simulationtimeDays + dayfract)/yrs;
	univYr = clamp(years_0,0.0,13800.0); 
		
		
	float timeend = simRealtimeend;
	float timestart = simRealtimestart;
	float simTime = gl_in[0].gl_Position.x;
	float usedt = max(gl_in[1].gl_Position.z, simdtmin);
	float cosmoTime = simUseTime;     

	if (simBindRealtime == 1.){
		cosmoTime = univYr;
	} 


//////////////////////////////////////////////////////////////

    if ((cosmoTime >= simTime && cosmoTime < (simTime + usedt)) || (simTime >= timeend && cosmoTime >= timeend) || (simTime <= timestart && cosmoTime <= timestart)) {

	//get the temperature and radius
		sunTemp = mix(gl_in[0].gl_Position.z, gl_in[2].gl_Position.y, (cosmoTime-simTime)/usedt);
		starRadius = mix(gl_in[0].gl_Position.y, gl_in[2].gl_Position.x, (cosmoTime-simTime)/usedt);
		RHe = mix( floor(gl_in[1].gl_Position.x)/10000. , mod(gl_in[1].gl_Position.x, 1) * 10., (cosmoTime-simTime)/usedt) ;
		RConv = mix( floor(gl_in[1].gl_Position.y)/10000. , mod(gl_in[1].gl_Position.y, 1) * 10., (cosmoTime-simTime)/usedt) ;


		starRadius = min(starRadius, 10000.)*6.95508; //My input file gives it in RSun. The conf file says this should be in units of 10^8 m
		
		//The star is at the origin
		drawFullscreenQuadAtModelDepth(vec3(0.));
	}

}
