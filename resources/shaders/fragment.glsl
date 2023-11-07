precision mediump float;

uniform sampler2D u_texture1;
uniform sampler2D u_texture2;
uniform sampler2D u_texture3;
uniform sampler2D u_transitionTexture;
uniform float u_progress1;

varying vec2 v_uv;

void main () {
  vec4 color1 = texture2D(u_texture1, v_uv);
  vec4 color2 = texture2D(u_texture2, v_uv);
  vec4 color3 = texture2D(u_texture3, v_uv);
  vec4 transitionColor = texture2D(u_transitionTexture, v_uv);

  float threshold = 0.2;
  float progress = u_progress1 * (1.0 + threshold * 2.0) - threshold; // -0.2 ~ 1.2
  float transition = clamp((progress - transitionColor.r) * (1.0 / threshold), 0.0, 1.0); 
  // clamp(a:현재값, b:최소값, c:최대값) 
  // clamp 하지않으면 transitionColor.r=0 -> -1~6 / itionColor.r=1 -> -6~1 --- 각각 다르게 증가할듯
  // threshold로 위의 수식을 해주지 않으면 transitionColor.r=0 -> 0~1 - 얘만 증가하고 / itionColor.r=1 -> -1~0 -> 0->0

  gl_FragColor = mix(color1, color2, transition);
}