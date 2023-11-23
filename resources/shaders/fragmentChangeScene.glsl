uniform sampler2D u_texture1;
uniform sampler2D u_texture2;

uniform float u_progress;

varying vec2 v_uv;

vec2 distort(vec2 uv, float progress) {
	uv = uv * 2.0 - 1.0;
	vec2 distorted = uv / (1.0 - progress * length(uv));
	return (distorted + 1.0) * 0.5;
}


void main () {
  vec2 uv = v_uv;
  
  // slope
  vec4 color1 = texture2D(u_texture1, uv);
  vec4 color2 = texture2D(u_texture2, uv);
  
  // float transition = uv.x - uv.y * 2.0 + fract(u_progress) * 3.0 - 0.5; // fract(x); // 소수점 구간만 취하기.
  // transition = step(0.5, transition);
  
  float transition = uv.x - uv.y * 2.0 + fract(u_progress) * 3.1 - 0.55;
  transition = smoothstep(0.45, 0.55, transition);


  gl_FragColor = mix(color1, color2, transition);
}