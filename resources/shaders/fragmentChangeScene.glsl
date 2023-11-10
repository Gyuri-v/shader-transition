uniform sampler2D u_texture1;
uniform sampler2D u_texture2;

uniform float u_progress;

varying vec2 v_uv;

void main () {
  vec2 uv = v_uv;
  
  vec4 color1 = texture2D(u_texture1, uv);
  vec4 color2 = texture2D(u_texture2, uv);
  
  float transition = uv.x - uv.y * 2.0 + fract(u_progress) * 3.0 - 0.5; // fract(x); // 소수점 구간만 취하기.
  transition = step(0.5, transition);

  gl_FragColor = mix(color1, color2, transition);
}